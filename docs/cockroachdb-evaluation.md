# CockroachDB evaluation for ecamp3

## Scope

This evaluation keeps the default PostgreSQL service and `DATABASE_URL` unchanged.
CockroachDB is an optional, insecure test service with two profiles: a single node
(`docker-compose.cockroachdb.yml`, local default) and a 3-node cluster
(`docker-compose.cockroachdb-cluster.yml`, matching the CI evaluation). Doctrine continues
to use the PostgreSQL wire protocol with `server_version: 15.0`.

## Reproducible setup

```sh
docker compose -f docker-compose.cockroachdb.yml config
docker compose -f docker-compose.cockroachdb.yml up -d
docker compose -f docker-compose.cockroachdb.yml ps
docker compose -f docker-compose.cockroachdb.yml exec -T cockroachdb \
  cockroach sql --insecure --host=localhost:26256 --execute='SHOW DATABASES; SHOW USERS;'
```

The commands were run on 2026-09-23. `config` succeeded. The service became healthy and
reported CockroachDB v24.3.0, database `ecamp3`, and user `ecamp3`. The full application
stack was not started because the default compose file requests more CPUs than this runner
provides.

CockroachDB v24.3 requires the node listener to use port 26257. Its SQL listener uses
port 26256 inside the container and is published as `localhost:26257`; the HTTP admin UI is
reachable at `localhost:8080`. Keeping the listeners on separate ports avoids the bind error
from the previous compose file. The healthcheck creates the `ecamp3` database and user idempotently.

## Compatibility changes

- Removed the ineffective custom Doctrine PostgreSQL platform and restored the normal schema
  manager platform. No vendor files are tracked or modified.
- Removed ordinary `NOT DEFERRABLE INITIALLY IMMEDIATE`/`NOT DEFERRABLE` clauses from schema
  foreign-key migrations. PostgreSQL's default remains immediate enforcement; no deferred
  unique constraints existed in these migrations.
- Added `App\Doctrine\DBAL\CockroachDb` to detect CockroachDB from `SELECT version()`.
  Type-changing migrations use CockroachDB's `STRING` type while preserving the original
  PostgreSQL `VARCHAR`/`TEXT` statements.
- The `pg_trgm` extension and GIN indexes are skipped only on CockroachDB; PostgreSQL keeps
  the original migration behavior.
- `server_version: '15.0'` remains unchanged.

Full migrations, `bin/console about` and representative API tests run against the
CockroachDB service in the Additional-Test workflow (JWT keys are generated there as in
`continuous-integration.yml`; with `APP_ENV=test` Doctrine appends the configured
`dbname_suffix`, so the workflow's schema lives in `ecamp3test`).

## Range partitioning implications

CockroachDB partitioning is declared on the parent table; PostgreSQL's `PARTITION OF`
syntax is not valid CockroachDB DDL. A valid year-based example is:

A partition column must be a prefix of the index being partitioned. Partitioning
`content_node` by `createTime` with only a primary key on `id` is invalid (error 42601).
The verified pattern is a secondary index on the partition column, then partitioning that
index (this is what the workflow applies to `period(start)`):

```sql
CREATE INDEX IF NOT EXISTS period_start ON period(start);
ALTER INDEX period@period_start PARTITION BY RANGE (start) (
    PARTITION y_le2022 VALUES FROM (MINVALUE) TO ('2023-01-01'),
    PARTITION y2023    VALUES FROM ('2023-01-01') TO ('2024-01-01'),
    PARTITION y2024    VALUES FROM ('2024-01-01') TO ('2025-01-01'),
    PARTITION y_ge2025 VALUES FROM ('2025-01-01') TO (MAXVALUE)
);
ALTER PARTITION y_le2022 OF INDEX period@period_start CONFIGURE ZONE USING
    constraints = '[]', lease_preferences = '[[+node=n1]]';
```

Table-level `PARTITION BY RANGE` on a table whose primary key does not start with the
partition column stays invalid and is not used anywhere in this repository.

A production design must still cover primary/unique-key implications, foreign keys,
retention boundaries, and a default/future partition. One replica per shard is explicitly
rejected: CockroachDB replication is a range-level cluster concern, not a recommendation
to run one replica per application shard.

## Multi-replica (3-node) evaluation

Addressing the review feedback on https://github.com/bacluc-agent/agent-todo/issues/225
("test it with multiple replicas of CockroachDB … distribute the different years of the
camps on different replicas").

### Topology

`docker-compose.cockroachdb-cluster.yml` and the Additional-Test workflow bring up the
same shape: three CockroachDB v24.3.0 nodes with localities `node=n1`, `node=n2`,
`node=n3`:

- plain `start` (never `start-single-node`) with `--advertise-addr=<svc>:26257` —
  mandatory, otherwise the nodes cannot gossip; shared
  `--join=n1:26257,n2:26257,n3:26257`
- `cockroach init --host=n1:26257 --insecure` once (retried until the nodes accept it)
- readiness is `SELECT count(*) FROM crdb_internal.gossip_nodes WHERE is_live` = 3, not
  `SELECT 1`
- keyless (insecure) clusters get a 7-day enterprise-feature grace period, which covers CI
  runs; replicas default to RF=3, so every range is stored on all three nodes
- the app connects only to the published `n1` port `26257`; `DATABASE_URL` is unchanged

### How the camp years were distributed

Camps have no year column; the year lives in `period.start` (fixture years: 2021, 2023,
2024, 2025). The workflow creates a secondary index on `period(start)`, splits it into
RANGE partitions per year, and pins the leaseholder per partition with zone configs
(`constraints='[]'` is required — CockroachDB rejects `lease_preferences` without an
explicit `constraints` field — and keeps RF=3 placement unchanged):

| Partition  | Years (fixture rows) | `lease_preferences` | Leaseholder node |
| ---------- | -------------------- | ------------------- | ---------------- |
| `y_le2022` | 2021                 | `[[+node=n1]]`      | n1               |
| `y2023`    | 2023                 | `[[+node=n2]]`      | n2               |
| `y2024`    | 2024                 | `[[+node=n3]]`      | n3               |
| `y_ge2025` | 2025                 | `[[+node=n1]]`      | n1               |

Four years on three nodes: n1 serves both 2021 and 2025.

### Premise vs. the CockroachDB replication model

The feedback asked for years on "different replicas". CockroachDB replicates every range
to all nodes (`replicas={1,2,3}` in `SHOW RANGES`), so physical replica placement per year
is not how the database works. What differs per year is the **leaseholder** — the node
that serves reads and writes for that year's data. Evidence queries (printed by the
workflow):

```sql
SHOW PARTITIONS FROM TABLE period;
SHOW RANGES FROM TABLE period WITH DETAILS;   -- lease_holder, replicas, replica_localities
SELECT node_id, locality, is_live FROM crdb_internal.gossip_nodes;
SELECT start FROM period ORDER BY start;      -- fixture years actually present
```

`SHOW RANGES ... WITH DETAILS` shows one range per partition with `replicas {1,2,3}` and
`lease_holder_locality` matching the table above. Rejected alternative: setting
`num_replicas=1` plus placement constraints would give literal single-node-per-year
storage, but it deletes high availability and contradicts this document's own rejection
of one-replica-per-shard designs; it is therefore not the default.

Local rehearsal on the compose cluster: partitions split at the year boundaries and all
four leaseholders converged to the preferred nodes after roughly 150 seconds. Caveats:
lease moves take seconds to minutes (the workflow waits before printing evidence), tiny
tables may split ranges slightly after the partition boundary appears, and the keyless
license grace window (7 days) applies to long-lived clusters.

### Test results

Additional-Test run
https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286
(all steps green, branch `issue-225`):

- [3-node cluster start / init / wait for 3 live nodes](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:2)
- [cluster compose file validated](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:6)
- [full migrations](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:11)
- [year partitions + lease_preferences applied](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:12)
- [partition/range/gossip evidence](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:13)
- [bin/console about](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:14)
- [ListCampsTest + CreateCampTest: `OK (63 tests, 145 assertions)`](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:15)
- [fixture years and per-year leaseholders after convergence](https://github.com/bacluc-agent/ecamp3/actions/runs/35846663297/job/107134362286#step:16)

Evidence excerpt from the final step (`SHOW RANGES FROM TABLE period WITH DETAILS`,
`period_start` ranges; every range has `replicas {1,2,3}`):

| Span (partition)                 | Fixture rows | Leaseholder |
| -------------------------------- | ------------ | ----------- |
| `…/29 → …/29/19358` (2021)       | 1            | `1 node=n1` |
| `…/29/19358 → …/29/19723` (2023) | 3            | `2 node=n2` |
| `…/29/19723 → …/29/20089` (2024) | 1            | `3 node=n3` |
| `…/29/20089 → …/30` (2025)       | 1            | `1 node=n1` |

Earlier runs on the way there (bug-fix history): migrations blocked at
`Version20250520220800` in
https://github.com/bacluc-agent/ecamp3/actions/runs/35830769267 and at
`Version20250821113132` in
https://github.com/bacluc-agent/ecamp3/actions/runs/35843389988; fixture loading failed
on the case-sensitive `profileId` column in
https://github.com/bacluc-agent/ecamp3/actions/runs/35843772190.

## Performance conclusions

`.ops/performance-test/` contains HTTP-level k6-style scripts and measurements; it does not
contain query plans or measurements attributable to issues ecamp3 #8123 or #8668. Therefore
this evaluation makes no query-bound conclusion for either issue. Those conclusions require
reproducible workloads for the affected endpoints plus `EXPLAIN ANALYZE`/statement metrics
on PostgreSQL and a representative multi-node CockroachDB cluster. A single insecure node
cannot establish distributed-performance behavior.

## Recommendation

Do not migrate production ecamp3 to CockroachDB based on this evaluation. Migrations and
the representative API tests now run against a 3-node cluster, but issue-specific query
measurements (ecamp3 #8123/#8668) remain outstanding.

## Commands and results

| Command                                                           | Result                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `docker compose -f docker-compose.cockroachdb.yml config`         | Passed                                                                 |
| `docker compose -f docker-compose.cockroachdb.yml up -d`          | Passed; service healthy                                                |
| `... exec ... SHOW DATABASES; SHOW USERS;`                        | Passed; `ecamp3` database and user present                             |
| `docker compose up -d`                                            | Blocked: runner exposes 4 CPUs but compose requests a larger CPU range |
| `docker compose -f docker-compose.cockroachdb-cluster.yml config` | Passed                                                                 |
| 3-node cluster + partitions + tests                               | See Multi-replica evaluation test results below                        |

## References

- Issue: https://github.com/bacluc-agent/agent-todo/issues/225
- Prior PR: https://github.com/bacluc-agent/ecamp3/pull/21
- Performance tooling: `.ops/performance-test/`
