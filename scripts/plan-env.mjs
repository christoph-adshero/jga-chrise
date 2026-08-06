// Packt plan.local.js (gitignored) base64-kodiert nach VITE_PLAN – lokal in .env
// und, wenn `gh` da ist, direkt als GitHub-Secret für den Deploy.
//
//   npm run plan
//
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'plan.local.js')

if (!existsSync(src)) {
  console.error('❌ plan.local.js fehlt. Ohne sie gibt es keinen Plan-Inhalt.')
  process.exit(1)
}

const m = await import(`file://${src}`)
const plan = {
  BASECAMP: m.BASECAMP,
  KEYSAFE_CODE: m.KEYSAFE_CODE,
  DAYS: m.DAYS,
  PACKLISTE: m.PACKLISTE,
  OFFENE_BUCHUNGEN: m.OFFENE_BUCHUNGEN,
  GEBUCHT: m.GEBUCHT
}
const b64 = Buffer.from(JSON.stringify(plan), 'utf8').toString('base64')

// .env aktualisieren (Zeile ersetzen oder anhängen)
const envPath = join(root, '.env')
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const line = `VITE_PLAN=${b64}`
writeFileSync(envPath, /^VITE_PLAN=.*$/m.test(env)
  ? env.replace(/^VITE_PLAN=.*$/m, line)
  : `${env.replace(/\n*$/, '\n')}${line}\n`)
console.log(`✅ .env aktualisiert (${plan.DAYS.length} Tage, ${b64.length} Zeichen)`)

// GitHub-Secret setzen
try {
  execFileSync('gh', ['secret', 'set', 'VITE_PLAN', '--body', b64], { stdio: 'pipe' })
  console.log('✅ GitHub-Secret VITE_PLAN gesetzt – nächster Push deployt den neuen Plan.')
} catch {
  console.log('ℹ️  gh nicht verfügbar – Secret ggf. manuell setzen: gh secret set VITE_PLAN')
}
