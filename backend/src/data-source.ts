// Used by the TypeORM CLI for generating, running, and reverting migrations.
// At dev time __dirname is src/, at runtime in the Docker image it is dist/.
// The same glob pattern works in both, because both `.ts` and `.js` are matched.
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

// dotenv is a transitive dependency of @nestjs/config; load it lazily so this
// file still imports cleanly if someone runs the CLI in an environment that
// has already exported the env vars another way.
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: join(__dirname, '..', '.env') });
} catch {
    /* env already set by shell / CI / docker — that's fine */
}

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'babydaily',
    entities: [join(__dirname, '**/*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations/*.{ts,js}')],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
});

export default AppDataSource;
