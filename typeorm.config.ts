import { config as loadEnv } from 'dotenv';
import { extname } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

loadEnv();

const isRunningTs = extname(__filename) === '.ts';
const entitiesGlob = isRunningTs ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'];
const migrationsGlob = isRunningTs ? ['src/migrations/*.ts'] : ['dist/migrations/*.js'];

const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: entitiesGlob,
  migrations: migrationsGlob,
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(options);
export default dataSource;
