// Fotos für „Damals & Heute" hochladen und in gameData.js eintragen.
//
//   npm run fotos -- "/Pfad/zum/Ordner"
//   npm run fotos                       (Standard: ~/Desktop/Chrise Bilder/neu)
//
// Dateiname MUSS mit dem Jahr beginnen:  2009.jpg · 2009-abiball.jpeg · 2013_sylt.png
// Alles andere wird übersprungen und am Ende gemeldet – lieber ein Foto weniger
// als ein falsches Jahr im Spiel.
//
// Das Skript verkleinert auf 1400px JPEG, lädt in den Supabase-Bucket „chrise"
// und schreibt den Block zwischen FOTOS-START/FOTOS-ENDE in gameData.js neu.
// Vorhandene Fotos im Bucket bleiben erhalten und kommen wieder mit rein.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, basename } from 'node:path'
import { tmpdir, homedir } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUCKET = 'chrise'
const src = process.argv[2] || join(homedir(), 'Desktop', 'Chrise Bilder', 'neu')

const keyFile = join(root, '.supabase-service-key.txt')
if (!existsSync(keyFile)) {
  console.error('❌ .supabase-service-key.txt fehlt – ohne den Key geht kein Upload.')
  process.exit(1)
}
const SERVICE_KEY = readFileSync(keyFile, 'utf8').trim()
const URL_BASE = readFileSync(join(root, '.env'), 'utf8')
  .match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1]?.trim()

if (!existsSync(src)) {
  console.error(`❌ Ordner nicht gefunden: ${src}`)
  process.exit(1)
}

// ---------- 1. Dateien einsammeln ----------
const OK_EXT = ['.jpg', '.jpeg', '.png', '.heic']
const übersprungen = []
const neu = []

for (const f of readdirSync(src).sort()) {
  if (f.startsWith('.')) continue
  if (!OK_EXT.includes(extname(f).toLowerCase())) { übersprungen.push([f, 'kein Bild']); continue }
  const m = basename(f).match(/^(19[5-9]\d|20[0-2]\d)/)
  if (!m) { übersprungen.push([f, 'kein Jahr am Anfang des Dateinamens']); continue }
  neu.push({ quelle: join(src, f), year: Number(m[1]) })
}

if (!neu.length) {
  console.error(`❌ Keine verwendbaren Fotos in ${src}`)
  übersprungen.forEach(([f, grund]) => console.error(`   übersprungen: ${f} (${grund})`))
  process.exit(1)
}

// ---------- 2. Bestehende Fotos aus dem Bucket holen ----------
const api = (pfad, opts = {}) => execFileSync('curl', [
  '-s', '-X', opts.method || 'GET', `${URL_BASE}/storage/v1/${pfad}`,
  '-H', `Authorization: Bearer ${SERVICE_KEY}`, '-H', `apikey: ${SERVICE_KEY}`,
  ...(opts.args || [])
], { maxBuffer: 64 * 1024 * 1024 }).toString()

const vorhanden = JSON.parse(api(`object/list/${BUCKET}`, {
  method: 'POST',
  args: ['-H', 'Content-Type: application/json', '-d', JSON.stringify({ limit: 200, prefix: '' })]
})).map((o) => o.name).filter((n) => n.endsWith('.jpg'))

// ---------- 3. Verkleinern und hochladen ----------
const tmp = mkdtempSync(join(tmpdir(), 'fotos-'))
const belegt = new Set(vorhanden)
const hochgeladen = []

for (const { quelle, year } of neu) {
  // Bei mehreren Fotos pro Jahr: 2009.jpg, 2009b.jpg, 2009c.jpg …
  let name = `${year}.jpg`
  for (let i = 1; belegt.has(name); i++) name = `${year}${String.fromCharCode(97 + i)}.jpg`
  belegt.add(name)

  const ziel = join(tmp, name)
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', '1400',
                        quelle, '--out', ziel], { stdio: 'ignore' })

  const code = execFileSync('curl', [
    '-s', '-o', '/dev/null', '-w', '%{http_code}',
    '-X', 'POST', `${URL_BASE}/storage/v1/object/${BUCKET}/${name}`,
    '-H', `Authorization: Bearer ${SERVICE_KEY}`, '-H', `apikey: ${SERVICE_KEY}`,
    '-H', 'Content-Type: image/jpeg', '--data-binary', `@${ziel}`
  ]).toString()

  if (code === '200') {
    hochgeladen.push({ file: name, year })
    console.log(`✅ ${basename(quelle)} → ${name}`)
  } else {
    console.error(`❌ ${basename(quelle)} → HTTP ${code}`)
  }
}

// ---------- 4. gameData.js neu schreiben ----------
const alle = [
  ...vorhanden.map((file) => ({ file, year: Number(file.match(/^\d{4}/)[0]) })),
  ...hochgeladen
].sort((a, b) => a.year - b.year || a.file.localeCompare(b.file))

const minJahr = Math.min(...alle.map((p) => p.year))
const von = Math.max(1950, minJahr - 3)
const bis = 2026

const block = `// FOTOS-START – wird von \`npm run fotos\` neu geschrieben, nicht von Hand ändern
export const GROOM_PHOTOS = [
${alle.map((p) => `  { file: '${p.file}',${' '.repeat(Math.max(0, 10 - p.file.length))} year: ${p.year} }`).join(',\n')}
].map((p) => ({ ...p, url: \`\${PHOTO_BASE}/\${p.file}\` }))

// Spannweite des Jahres-Reglers – bewusst weiter als die Fotos, sonst
// verrät der Regler schon, in welchem Zeitraum die Lösung liegt.
export const PHOTO_YEAR_RANGE = { from: ${von}, to: ${bis} }
// FOTOS-ENDE`

const gd = join(root, 'src/lib/gameData.js')
const s = readFileSync(gd, 'utf8')
const re = /\/\/ FOTOS-START[\s\S]*?\/\/ FOTOS-ENDE/
if (!re.test(s)) {
  console.error('❌ Markierungen FOTOS-START/FOTOS-ENDE in gameData.js nicht gefunden.')
  process.exit(1)
}
writeFileSync(gd, s.replace(re, block))

console.log(`\n📷 ${alle.length} Fotos im Spiel (${minJahr}–${Math.max(...alle.map((p) => p.year))}), Regler ${von}–${bis}`)
if (übersprungen.length) {
  console.log('\n⚠️  Übersprungen:')
  übersprungen.forEach(([f, grund]) => console.log(`   ${f} – ${grund}`))
}
console.log('\nJetzt noch:  git add -A && git commit -m "Neue Fotos" && git push')
