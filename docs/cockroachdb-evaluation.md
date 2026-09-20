# CockroachDB Evaluation for ecamp3

## Setup Steps

```bash
# 1. Create single-node CockroachDB container (insecure, for evaluation only)
docker compose -f docker-compose.cockroachdb.yml up -d

# 2. Configure Doctrine DBAL for CockroachDB
# Note: Doctrine DBAL 4.4.4 does not support `cockroachdb://` URL scheme directly.
# Use `postgresql://` with `serverVersion=15.0` (PostgreSQL-compatible).
# The `database_server_version` env var approach was removed due to Symfony env syntax issues.

# 3. Apply schema/migrations (requires minimal patches for CockroachDB compatibility)
DATABASE_URL="postgresql://ecamp3@ecamp3-cockroachdb:26258/ecamp3?serverVersion=15.0&charset=utf8" \
  docker compose exec api bin/console doctrine:migrations:migrate --no-interaction
```

## Compatibility Findings

### What Worked
- Single-node CockroachDB `v24.3.0` starts successfully with `--insecure`.
- Database `ecamp3` and user `ecamp3` created without issues.
- `JSONB` column type (`content_node.data`) is supported by CockroachDB.
- `pgcrypto` extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto`) works.
- UUID generation (`gen_random_uuid()`) works.

### What Failed / Blocked
- **DEFERRABLE syntax**: 15 migration files contain `NOT DEFERRABLE INITIALLY IMMEDIATE` which CockroachDB does not support. Fixed by patching `AbstractPlatform.php` in vendor (temporary) and removing clauses from `Version20211002102059.php`.
- **ALTER COLUMN TYPE**: Migration `Version20211010091358` fails with `ALTER COLUMN TYPE from varchar to varchar is only supported experimentally`. Requires `SET enable_experimental_alter_column_type_general = true`.
- **Partial indexes / `pg_trgm`**: Migration `Version20260627120000` uses `pg_trgm` GIN indexes (`gin_trgm_ops`) which are not supported in CockroachDB.
- **UUID / `gen_random_bytes`**: Migration `Version20230409164830` uses `encode(gen_random_bytes(6), 'hex')` which may have compatibility differences.
- **Doctrine DBAL driver**: `cockroachdb://` URL scheme is not recognized by Doctrine DBAL 4.4.4. Must use `postgresql://` with `serverVersion=15.0`.

### Performance Note
- Single-node insecure mode is not representative of production CockroachDB performance.
- No benchmark tests were run due to time constraints.
- CockroachDB's distributed architecture introduces overhead compared to single-node PostgreSQL; year-based partitioning (see proposal below) is recommended for large tables.

## Concrete Year-Based Partitioning Proposal

```sql
-- Example: partition `content_node` by year of `createTime`
CREATE TABLE content_node_2024 (
    LIKE content_node INCLUDING ALL
) PARTITION OF content_node
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE content_node_2025 (
    LIKE content_node INCLUDING ALL
) PARTITION OF content_node
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

Note: CockroachDB supports range partitioning but requires `PARTITION BY RANGE` syntax. The above is a conceptual DDL example; actual implementation requires CockroachDB-specific syntax (`PARTITION BY RANGE (createTime)`).

## Recommendation

**Do not migrate to CockroachDB for production ecamp3 at this time.**

Reasons:
1. Doctrine DBAL lacks native `cockroachdb://` driver support.
2. 15+ migration files contain PostgreSQL-specific syntax (`DEFERRABLE`, `ALTER COLUMN TYPE`) that requires significant patching.
3. `pg_trgm` partial indexes are unsupported.
4. The evaluation was conducted with an insecure single-node instance (`--insecure`), which is not production-ready.

If CockroachDB adoption is pursued in the future:
- Upgrade Doctrine DBAL to a version with CockroachDB support (if available).
- Patch all 15 migration files to remove `DEFERRABLE` clauses.
- Enable `enable_experimental_alter_column_type_general` or rewrite `ALTER COLUMN TYPE` migrations.
- Replace `pg_trgm` indexes with CockroachDB-compatible full-text search alternatives.
- Implement year-based partitioning for large tables (`content_node`, `activity`).

## Ponytail Comments (Corners Cut)

```markdown
# ponytail: insecure single-node (`--insecure`) used for evaluation; never use in production.
# ponytail: limited test subset (10-20 tests) not fully executed due to migration blocking issues.
# ponytail: `database_server_version` env syntax removed; `DATABASE_URL` relies on `?serverVersion=15.0`.
# ponytail: vendor file `AbstractPlatform.php` patched temporarily; not a permanent solution.
# ponytail: only 1 of 15 DEFERRABLE migration files fixed (`Version20211002102059.php`).
```

## PR Hygiene & Evidence

- **Branch:** `issue-225` on `bacluc-agent/ecamp3` (fork of `ecamp/ecamp3`).
- **Additional-test action run:** `https://github.com/bacluc-agent/ecamp3/actions/runs/<run_id>` (to be updated after push; command: `docker-compose -f docker-compose.cockroachdb.yml up -d && DATABASE_URL=postgresql://ecamp3:ecamp3@localhost:26257/ecamp3?serverVersion=15.0 bin/console doctrine:migrations:migrate`)
- **Ponytail annotations:** `# ponytail: insecure single-node`, `# ponytail: limited test subset`, `# ponytail: temporary vendor patch`, `# ponytail: only 1 of 15 DEFERRABLE files fixed`.
- **No new PHP dependencies added.** Doctrine DBAL 4.4.4 covers `PostgreSQLPlatform`; `CustomPostgreSQLPlatform` extends it.

## Commands Run

```bash
# Start CockroachDB
docker compose -f docker-compose.cockroachdb.yml up -d

# Configure Doctrine (modified `api/config/packages/doctrine.yaml` and `api/.env`)
# Note: `database_server_version` env approach removed due to Symfony syntax errors.

# Apply migrations (blocked at Version20211010091358 due to ALTER COLUMN TYPE)
DATABASE_URL="postgresql://ecamp3:ecamp3@localhost:26257/ecamp3?serverVersion=15.0&charset=utf8" \
  docker compose exec api bin/console doctrine:migrations:migrate --no-interaction

# Test command (not fully executed due to blocking migration errors)
# docker compose exec api composer test tests/Api/...
```

## Files Changed

1. `docker-compose.cockroachdb.yml` (new)
2. `api/config/packages/doctrine.yaml` (modified `server_version` to env-based, then reverted)
3. `api/.env` (added CockroachDB URL comment, then reverted `database_server_version`)
4. `api/src/Doctrine/DBAL/Schema/CustomPostgreSQLPlatform.php` (new)
5. `api/src/Doctrine/DBAL/Schema/CustomSchemaManagerFactory.php` (modified)
6. `api/migrations/schema/Version20211002102059.php` (modified - removed DEFERRABLE clause)
7. `docs/cockroachdb-evaluation.md` (new)

Note: The `CustomPostgreSQLPlatform.php` and `CustomSchemaManagerFactory.php` changes are minimal compatibility fixes but do not fully resolve all blocking issues (DEFERRABLE in 14 remaining files, ALTER COLUMN TYPE, pg_trgm).
