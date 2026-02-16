import { createBoss } from './lib/boss';
import { registerJobs } from './jobs';

async function main() {
  const boss = await createBoss();
  await registerJobs(boss);
  console.log(JSON.stringify({ level: 'info', msg: 'worker started' }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
