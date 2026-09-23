# CockroachDB evaluation for ecamp3

## Scope

This evaluation keeps the default PostgreSQL service and `DATABASE_URL` unchanged.
CockroachDB is an optional, insecure single-node test service only. Doctrine continues to
use the PostgreSQL wire protocol with `server_version: 15.0`.

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

A clean full migration and API test run requires the API image and application services.
They were not claimed here because the runner could not start the default stack.

## Range partitioning implications

CockroachDB partitioning is declared on the parent table; PostgreSQL's `PARTITION OF`
syntax is not valid CockroachDB DDL. A valid year-based example is:

```sql
CREATE TABLE content_node (
    id STRING NOT NULL,
    createTime TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) PARTITION BY RANGE (createTime) (
    PARTITION content_node_2024 VALUES FROM ('2024-01-01') TO ('2025-01-01'),
    PARTITION content_node_2025 VALUES FROM ('2025-01-01') TO ('2026-01-01'),
    PARTITION content_node_future VALUES FROM ('2026-01-01') TO (MAXVALUE)
);
```

A production design must include every parent column, primary/unique-key implications,
foreign keys, indexes, retention boundaries, and a default/future partition. Partitioning
only `content_node` is not an application change and was not introduced by this evaluation.
One replica per shard is explicitly rejected: CockroachDB replication is a range-level
cluster concern, not a recommendation to run one replica per application shard.

## Performance conclusions

`.ops/performance-test/` contains HTTP-level k6-style scripts and measurements; it does not
contain query plans or measurements attributable to issues ecamp3 #8123 or #8668. Therefore
this evaluation makes no query-bound conclusion for either issue. Those conclusions require
reproducible workloads for the affected endpoints plus `EXPLAIN ANALYZE`/statement metrics
on PostgreSQL and a representative multi-node CockroachDB cluster. A single insecure node
cannot establish distributed-performance behavior.

## Recommendation

Do not migrate production ecamp3 to CockroachDB based on this evaluation. The migrations now
cover the identified syntax differences, but full application migration/API evidence and
issue-specific query measurements remain outstanding.

## Commands and results

| Command | Result |
| --- | --- |
| `docker compose -f docker-compose.cockroachdb.yml config` | Passed |
| `docker compose -f docker-compose.cockroachdb.yml up -d` | Passed; service healthy |
| `... exec ... SHOW DATABASES; SHOW USERS;` | Passed; `ecamp3` database and user present |
| `docker compose up -d` | Blocked: runner exposes 4 CPUs but compose requests a larger CPU range |
| Full migrations/API tests | Not run; API stack startup was blocked |

## References

- Issue: https://github.com/bacluc-agent/agent-todo/issues/225
- Prior PR: https://github.com/bacluc-agent/ecamp3/pull/21
- Performance tooling: `.ops/performance-test/`
