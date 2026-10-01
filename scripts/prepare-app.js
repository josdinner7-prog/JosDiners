import fs from 'fs'
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

const config = {
  team: {
    appName: "Jo's Diner Team",
    appId: "com.josdiners.rider",
    apkPrefix: "JosDiners-Team"
  },
  customer: {
    appName: "Jo's Diner",
    appId: "com.josdiners.customer",
    apkPrefix: "JosDiners-Customer"
  }
}[target]

console.log(`[prepare-app] Configuring Android app for target: ${target.toUpperCase()}`)
console.log(`  - App Name: ${config.appName}`)
console.log(`  - Package ID: ${config.appId}`)
console.log(`  - APK Prefix: ${config.apkPrefix}`)

// 1. Update root capacitor.config.json
const capConfigPath = path.join(rootDir, 'capacitor.config.json')
if (fs.existsSync(capConfigPath)) {
  const capJson = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'))
  capJson.appName = config.appName
  capJson.appId = config.appId
  fs.writeFileSync(capConfigPath, JSON.stringify(capJson, null, 2) + '\n', 'utf8')
  console.log(`  ✓ Updated capacitor.config.json`)
}

// 2. Update android strings.xml
const stringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml')
if (fs.existsSync(stringsPath)) {
  const escapedAppName = config.appName.replace(/'/g, "\\'")
  const stringsContent = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${escapedAppName}</string>
    <string name="title_activity_main">${escapedAppName}</string>
    <string name="package_name">${config.appId}</string>
    <string name="custom_url_scheme">${config.appId}</string>
</resources>
`
  fs.writeFileSync(stringsPath, stringsContent, 'utf8')
  console.log(`  ✓ Updated android strings.xml`)
}

// 3. Update android/app/build.gradle
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle')
if (fs.existsSync(buildGradlePath)) {
  let gradle = fs.readFileSync(buildGradlePath, 'utf8')
  // Update applicationId
  gradle = gradle.replace(/applicationId\s+["'][^"']+["']/, `applicationId "${config.appId}"`)
  // Update outputFileName
  gradle = gradle.replace(/outputFileName\s*=\s*["'][^"']+["']/, `outputFileName = "${config.apkPrefix}-\${variant.name}.apk"`)
  fs.writeFileSync(buildGradlePath, gradle, 'utf8')
  console.log(`  ✓ Updated android/app/build.gradle`)
}

// 4. Update android/app/src/main/assets/capacitor.config.json if exists
const assetCapPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json')
if (fs.existsSync(assetCapPath)) {
  const assetCapJson = JSON.parse(fs.readFileSync(assetCapPath, 'utf8'))
  assetCapJson.appName = config.appName
  assetCapJson.appId = config.appId
  fs.writeFileSync(assetCapPath, JSON.stringify(assetCapJson, null, 2) + '\n', 'utf8')
  console.log(`  ✓ Updated android assets capacitor.config.json`)
}

console.log(`[prepare-app] Target configuration complete for ${config.appName}!`)
