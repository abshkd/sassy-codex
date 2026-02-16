import PgBoss from 'pg-boss';
import { env } from '../env';

export async function createBoss() {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL });
  await boss.start();
  return boss;
}
