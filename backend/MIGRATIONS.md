# TypeORM Migrations

Schema changes go through migration files so production is no longer dependent
on `synchronize: true`. This doc covers: the one-time bootstrap, the day-to-day
workflow when you add a column, and how rollbacks work.

## Setup at a glance

- **DataSource for CLI**: [src/data-source.ts](src/data-source.ts)
- **Migration files**: `src/migrations/*.ts` (committed); compiled to `dist/migrations/*.js`
- **Tracking table**: `migrations` (created automatically)
- **Auto-run on boot**: env var `DB_MIGRATIONS_RUN=true` (already set in [docker-compose.prod.yml](../docker-compose.prod.yml))
- **Auto-sync (legacy)**: env var `DB_SYNCHRONIZE` — leave `false` in prod

## One-time baseline (existing prod DB already has all tables)

The prod DB has been running with `synchronize: true`, so its schema is already
correct. We just need to tell TypeORM "the baseline matches code, don't try to
recreate anything." Do this **once**, after deploying the migrations setup:

```bash
# On the LXC host
docker exec -it babydaily-postgres psql -U "$DB_USERNAME" -d "$DB_DATABASE" -c "
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL
);
"
```

That's it — no rows needed. From now on, any future migration generates a row
the first time it runs and is skipped afterward.

> Why no baseline migration row? Because we never generated a "CreateAll"
> migration — the schema was built by `synchronize`. The `migrations` table is
> just an empty ledger waiting for real diffs. Future `migration:generate`
> compares entities vs current DB and only emits the delta.

## Day-to-day: I changed an entity, now what?

1. Make sure your **local dev DB matches prod schema**. Easiest: restore the
   latest prod backup into your local Postgres. Otherwise run with
   `DB_SYNCHRONIZE=true` once to mirror the entity state.

2. Generate a migration from the diff:

   ```bash
   cd backend
   npm run migration:generate -- src/migrations/AddBabyAvatarUrl
   ```

   TypeORM diffs entities against the connected DB and writes
   `src/migrations/<timestamp>-AddBabyAvatarUrl.ts`.

3. **Read the generated SQL.** TypeORM sometimes emits destructive defaults
   (drop+recreate of nullable columns, casts that lose data). Edit the file if
   needed.

4. Test it locally:

   ```bash
   npm run migration:run     # applies pending
   npm run migration:show    # lists [X] applied, [ ] pending
   npm run migration:revert  # rolls back the last one — verify down() works
   npm run migration:run     # re-apply
   ```

5. Commit `src/migrations/<timestamp>-*.ts`.

6. Deploy. The Docker container boots with `DB_MIGRATIONS_RUN=true`, picks up
   any pending migration files in `dist/migrations/`, and applies them
   atomically before the HTTP server starts accepting requests.

## Other commands

```bash
# Empty migration scaffold for hand-written SQL (no entity diff):
npm run migration:create -- src/migrations/SeedDefaultSettings

# What's applied vs pending:
npm run migration:show

# Roll back the most recent applied migration:
npm run migration:revert
```

## Edge cases & gotchas

- **`migration:generate` against an empty DB** will emit a "CreateAll" file.
  Don't commit that — only commit deltas. Restore a recent dump first.

- **CI / fresh dev environments** can be bootstrapped two ways:
  1. Restore a prod backup, then run migrations forward.
  2. Set `DB_SYNCHRONIZE=true` for the first boot to build the schema, then
     turn it off and mark migrations as applied:
     `INSERT INTO migrations(timestamp, name) SELECT ...` for each file.
     (Same trick as the prod baseline above.)

- **Don't mix `synchronize: true` and migrations** in the same DB long-term.
  Sync rewrites schema and won't write to the `migrations` table — your ledger
  will lie. Pick one source of truth per environment.

- **Renames look like drop+create to TypeORM.** Always inspect generated SQL
  for `DROP COLUMN` you didn't intend; rewrite as `ALTER ... RENAME` by hand.

- **Migrations run inside a transaction** by default. If you need
  `CREATE INDEX CONCURRENTLY` or other non-transactional DDL, set
  `transaction: 'none'` on the migration class.
