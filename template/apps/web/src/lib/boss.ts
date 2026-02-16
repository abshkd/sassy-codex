import PgBoss from 'pg-boss';
import { env } from './env';

let boss: PgBoss | null = null;

export async function getBoss() {
  if (!boss) {
    boss = new PgBoss({ connectionString: env.DATABASE_URL });
    await boss.start();
  }

  return boss;
}
