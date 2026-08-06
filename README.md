# 🥊 JGA Chrise – CREW vs. BRÄUTIGAM

Mobile-First Party-App für den Junggesellenabschied (6 Männer, 8.–9.8.2026).
**Das Reiseziel steht bewusst nirgends im Repo** – siehe „Geheimhaltung" unten.
**React + Vite + Tailwind + Supabase Realtime.** Kein Login für Spieler, alle Handys live synchron.

## Das Konzept
Jeder der 6 Herausforderer tritt **1-gegen-1 gegen den Bräutigam** an – er spielt JEDES Duell.
Die Zuschauer **wetten mit Einsatz** auf jeden Ausgang. Zwischen den Duellen dreht sich das
**Bräutigam-Glücksrad** mit Zusatzaufgaben. Am Ende: **Wurde der Bräutigam geschlagen?** + MVP der Nacht.

## Features
- 🧑‍🎨 **Avatare** – jeder baut seinen Cartoon-Avatar (lokal generiertes SVG, offline-fähig). Bräutigam trägt die Krone. Duell-Pleiten = sichtbare Tränen, Siege = Lorbeer.
- 🥊 **Duell-Arena** mit 9 Disziplinen:
  - **Handy-Duelle (auto-gewertet):** ⚡ Reaktions-Duell (best of 3, lokal gemessen – kein Netz-Race), 👆 Tap-Sprint, 🧠 Blitz-Quiz, 🎯 Schätzmeister, 🔢 Zahlen-Memory
  - **Real-Duelle (Crowd-Voting):** 💪 Armdrücken, 🍺 Bierpong, 🏋️ Liegestütz-Battle
  - **🎤 Performance-Battle** – Zuschauer voten live den Sieger
- 💰 **Wett-System** – Zuschauer setzen 20/50/100 Punkte pro Duell: richtig = +Einsatz, falsch = −Einsatz
- 👑 **3 Bräutigam-Joker** – Veto (Disziplin ablehnen), Handicap (Gegner erschweren), Verdopplung
- 🎡 **Bräutigam-Glücksrad** – 12 Zusatzaufgaben; die Crew wettet vorher „Schafft er's?"
- 🏆 **Finale „Alles oder Nichts"** – MVP vs. Bräutigam, alle setzen 50 % ihres Scores
- 🧠 **„Wer kennt den Bräutigam?"** – 10 MC-Fragen, Speed-Bonus, perfekt zum Warmwerden
- 📊 **Crew-Meter** (Duell-Siege Crew vs. Bräutigam) + getrenntes **MVP-Ranking**
- 🔥 **Live-Emoji-Reaktionen** fliegen über alle Handys (Supabase Broadcast) + Konfetti
- 🛠 **Kommandozentrale (Admin)** – Duelle aufsetzen, freigeben, notfalls manuell werten, Glücksrad, Punkte, DQ
- 📵 **Party-tauglich:** Wake-Lock bei Minigames, reload-safe (localStorage-Identität), Auto-Auswertung race-sicher, Admin-Force-Buttons für jeden Zustand

## Punktesystem
| Aktion | Punkte |
|---|---|
| Duell gewonnen | **+250** (Finale +500, Verdopplungs-Joker ×2) |
| Bräutigam verliert ein Duell | +50 Trost (er spielt jedes) |
| Wette richtig / falsch | +Einsatz / −Einsatz (20/50/100) |
| Glücksrad-Aufgabe geschafft | +100 für den Bräutigam |
| Quiz-Frage richtig | 20 + bis zu 20 Speed-Bonus |

---

## ⚡ In 5 Minuten startklar

### 1. Supabase-Projekt anlegen (kostenlos)
1. [supabase.com](https://supabase.com) → **New Project** (Region: Frankfurt).
2. **SQL Editor** → Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → **Run**.
3. **Project Settings → API**: `Project URL` und `anon public` Key kopieren.

### 2. Lokal einrichten
```bash
cd jga-chrise-app
npm install
cp .env.example .env   # Keys eintragen
npm run dev
```
→ `http://localhost:5173` (Handys im gleichen WLAN: `http://<deine-IP>:5173`)

### 3. Spielen
1. **„Neue Runde erstellen"** → du bist Organisator (Join-Code + QR).
2. Alle scannen den QR, tragen Namen ein, **bauen ihren Avatar**.
3. In der Lobby den **Bräutigam markieren**.
4. **ADMIN** (oben rechts) → PIN → im Setup den **Bräutigam-Namen** eintragen.
5. Warm werden mit 🧠 Quiz → dann 🥊 **Duell-Arena**: Herausforderer + Disziplin wählen → Wettphase → LIVE.
6. Zwischendurch 🎡 Glücksrad · Am Ende 🏆 Finale → 🏛️ Endstand.

### Dramaturgie-Tipp
Kopf-Duelle (Quiz, Memory, Schätzen) **früh am Abend**, Körper-Duelle & Performance **später** –
ab 1 Uhr funktioniert nur noch Tap-Sprint. 😄

---

## 🚀 Deployment

### GitHub Pages (aktiv)
Läuft automatisch bei jedem Push auf `main` über [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Alle Keys und geheimen Inhalte liegen als **Repo-Secrets**, nicht im Code:
```bash
gh secret set VITE_SUPABASE_URL   --body "https://deinprojekt.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJhbGciOi..."
gh secret set VITE_ADMIN_PIN --body "1909"     # Organisator-Panel
gh secret set VITE_CREW_PIN  --body "…"        # Crew-Code für /plan
npm run plan                                   # setzt VITE_PLAN aus plan.local.js
gh workflow run deploy.yml    # neu bauen
```

### Vercel (Alternative)
```bash
npm i -g vercel && vercel
# Env-Vars im Dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_PIN
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --build --prod   # Env-Vars im Site-Dashboard setzen
```
SPA-Configs (`vercel.json`, `netlify.toml`) liegen bei.

---

## 📁 Projektstruktur
```
src/
├── lib/
│   ├── supabase.js       # Client + Config-Check (Demo-Modus ohne Keys)
│   ├── api.js            # DB-Ops inkl. race-sicherem claimDuelWinner/claimTaskResult
│   ├── gameData.js       # Disziplinen, Glücksrad-Aufgaben, Quiz, Punkte, Joker
│   ├── duelLogic.js      # Seeded RNG, Duell-Auswertung, Crew-Meter, Stats
│   └── avatars.js        # SVG-Avatar-System (lokal, offline)
├── hooks/
│   ├── useSession.js     # Realtime: Session, Spieler, Antworten
│   └── useWakeLock.js    # Bildschirm wach halten bei Minigames
├── components/
│   ├── Avatar.jsx · AvatarEditor.jsx
│   ├── Scoreboard.jsx    # MVP-Ranking + Bräutigam-Kachel (getrennt!)
│   ├── EmojiReactions.jsx · Confetti.jsx · Timer.jsx · QRShare.jsx · Layout.jsx
│   └── minigames/        # ReactionDuel · TapSprint · QuizDuel · EstimateDuel · MemoryDuel
└── pages/
    ├── Home.jsx · Play.jsx · Lobby.jsx · Admin.jsx
    └── games/
        ├── DuelArena.jsx # Herzstück: Wettphase → Live → Auto-Auswertung → Ergebnis
        ├── WerKennt.jsx · Results.jsx
```

## ✏️ Inhalte anpassen
- **Bräutigam-Name**: Admin-Panel → ersetzt `[BRÄUTIGAM]` überall live.
- **Quiz über den Bräutigam** (die Antworten!), Glücksrad-Aufgaben, Blitz-Quiz-Fragen:
  [`src/lib/gameData.js`](src/lib/gameData.js) → neu deployen. Der Bräutigam darf die Datei natürlich nicht sehen. 😏

## 🏗 Architektur-Entscheidungen
- **Reaktionszeiten werden lokal gemessen** (performance.now) und nur Ergebnisse verglichen – Club-WLAN-Latenz kann kein Duell entscheiden.
- **Race-sichere Auswertung**: guarded UPDATE (`…where state->duel->>winner is null`) – exakt ein Client vergibt Punkte, egal wie viele es gleichzeitig versuchen.
- **Reload-safe**: Identität in localStorage, kompletter Zustand in Postgres, Realtime nur als Push-Beschleuniger.
- **Nichts blockt hart**: jede Phase hat Admin-Force-Buttons (manuell werten, abbrechen, weiter).

## 🤫 Geheimhaltung (der Bräutigam liest mit)
Das Repo ist öffentlich, der Bräutigam bekommt den App-Link. Deshalb:
- **Reiseziel & Plan** stehen in `plan.local.js` – **gitignored**. `npm run plan` schiebt den
  Inhalt base64-kodiert ins Secret `VITE_PLAN`, aus dem der Build ihn zieht. Im Repo steht nur der Lader.
- **`/plan` ist doppelt gesperrt:** Crew-Code (`VITE_CREW_PIN`) für alle, plus harte Sperre für
  den markierten Bräutigam (die bleibt auch, wenn er den Code kennt).
- **Keine Orts-Hinweise im Spiel:** Quiz-, Schätz- und Tippfragen sowie die Join-Codes sind
  bewusst neutral gehalten. Beim Ergänzen daran denken.
- Fotos und Roh-Renderings der Avatare (`avatars/fotos`, `avatars/out`) sind ebenfalls gitignored.

## 🔒 Sicherheit (bewusst einfach)
Wegwerf-Session ohne Login; RLS-Policies erlauben anonymen Zugriff – ideal für einen Abend, nicht für sensible Daten. Admin-PIN ist Komfort, kein echtes Auth. Nach dem JGA: Session löschen oder Supabase-Projekt pausieren.
