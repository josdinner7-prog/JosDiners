import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const target = (process.argv[2] || 'customer').toLowerCase()

if (target !== 'team' && target !== 'customer') {
  console.error(`Invalid target "${target}". Expected "team" or "customer".`)
  process.exit(1)
}

function run(cmd, args, extraEnv = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv }
  })
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`)
    process.exit(result.status || 1)
  }
}

console.log(`========================================`)
console.log(` Building Android App: ${target.toUpperCase()}`)
console.log(`========================================`)

// 1. Prepare Android config files
run('node', ['scripts/prepare-app.js', target])

// 2. Build Vite bundle with VITE_APP_TARGET
run('npx', ['vite', 'build'], { VITE_APP_TARGET: target })

// 3. Sync to Capacitor Android
run('npx', ['cap', 'sync', 'android'])

console.log(`\n========================================`)
console.log(` ${target.toUpperCase()} App Ready for Gradle / Android Studio!`)
console.log(`========================================\n`)
