#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'template');

function parseArgs(argv) {
  const args = { targetDir: argv[0], orgs: true, billing: true, loops: true, storage: true, yes: false };
  for (const arg of argv.slice(1)) {
    if (arg === '--no-orgs') args.orgs = false;
    if (arg === '--no-billing') args.billing = false;
    if (arg === '--no-loops') args.loops = false;
    if (arg === '--no-storage') args.storage = false;
    if (arg === '--yes' || arg === '-y') args.yes = true;
  }
  return args;
}

async function promptConfig(args) {
  const rl = readline.createInterface({ input, output });
  const ask = async (q, d) => {
    if (args.yes) return d;
    const v = (await rl.question(`${q} (${d}): `)).trim();
    return v || d;
  };
  const askBool = async (q, d) => {
    if (args.yes) return d;
    const v = (await rl.question(`${q} [${d ? 'Y/n' : 'y/N'}]: `)).trim().toLowerCase();
    if (!v) return d;
    return ['y', 'yes'].includes(v);
  };

  const projectName = await ask('Project name', path.basename(args.targetDir || 'saas-app'));
  const orgs = await askBool('Enable orgs?', args.orgs);
  const billing = await askBool('Enable Stripe billing scaffold?', args.billing);
  const loops = await askBool('Enable Loops email scaffold?', args.loops);
  const storage = await askBool('Enable Supabase Storage scaffold?', args.storage);
  rl.close();
  return { projectName, orgs, billing, loops, storage };
}

function shouldSkip(rel, flags) {
  if (!flags.orgs && rel.includes('app/o/[orgSlug]')) return true;
  if (!flags.billing && rel.includes('/billing/')) return true;
  if (!flags.storage && rel.includes('/files/')) return true;
  if (!flags.storage && rel.includes('/uploads/signed-url/')) return true;
  if (!flags.billing && rel.includes('/stripe/')) return true;
  if (!flags.loops && rel.includes('loops.send_event')) return true;
  return false;
}

function copyTemplate(dest, flags) {
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    const srcDir = path.join(TEMPLATE_DIR, rel);
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name);
      if (shouldSkip(childRel, flags)) continue;
      const src = path.join(TEMPLATE_DIR, childRel);
      const out = path.join(dest, childRel);
      if (entry.isDirectory()) {
        fs.mkdirSync(out, { recursive: true });
        stack.push(childRel);
      } else {
        let content = fs.readFileSync(src, 'utf8');
        content = content
          .replaceAll('__PROJECT_NAME__', flags.projectName)
          .replaceAll('__ENABLE_ORGS__', String(flags.orgs))
          .replaceAll('__ENABLE_BILLING__', String(flags.billing))
          .replaceAll('__ENABLE_LOOPS__', String(flags.loops))
          .replaceAll('__ENABLE_STORAGE__', String(flags.storage));
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, content);
      }
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.targetDir) {
    console.error('Usage: create-saas-stack <target-dir> [--no-orgs] [--no-billing] [--no-loops] [--no-storage]');
    process.exit(1);
  }

  const target = path.resolve(process.cwd(), args.targetDir);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    console.error('Target directory exists and is not empty.');
    process.exit(1);
  }
  fs.mkdirSync(target, { recursive: true });
  const config = await promptConfig(args);
  copyTemplate(target, config);

  console.log('Installing dependencies with pnpm...');
  try {
    execSync('pnpm install', { cwd: target, stdio: 'inherit' });
  } catch {
    console.warn('pnpm install failed. You can run it manually.');
  }

  console.log(`✅ SaaS stack generated in ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
