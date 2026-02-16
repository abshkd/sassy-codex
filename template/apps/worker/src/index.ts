import { registerJobs } from './jobs';
async function main() { await registerJobs(); console.log(JSON.stringify({ level:'info', msg:'worker started' })); }
main();
