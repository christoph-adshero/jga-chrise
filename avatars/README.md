# 🏎️ Cartoon-Avatare (Mario-Kart-Style) — Pipeline

Jeder der 7 Jungs bekommt eine **Kart-Racer-Cartoonfigur mit seinem echten Gesicht** als App-Avatar.

## Workflow (sobald die Fotos da sind)

1. **Fotos sammeln:** 1 Foto pro Person, frontal, Gesicht gut erkennbar, gute Beleuchtung.
   Ablegen als `avatars/fotos/<name>.jpg`.
2. **Generierung via Higgsfield** (Nano Banana Pro, Foto als Referenz — Identität NUR über das
   Referenzbild, nicht per img2img, das zerstört die Gesichtszüge):
   - Prompt-Template siehe unten, pro Person `[NAME-BESCHREIBUNG]` anpassen (Bartform, Brille, Haarfarbe unterstützen die Ähnlichkeit)
   - Bräutigam-Variante: goldenes Kart + Krone + Bräutigam-Schärpe
3. **Nachbearbeitung:** quadratisch croppen (Gesicht mittig, Figur sichtbar), ~800×800px, als WebP/JPG exportieren → `avatars/out/<name>.jpg`
4. **Hosting:** Bilder brauchen eine öffentliche URL. Einfachster Weg: mit ins Deployment legen
   (`public/avatars/<name>.jpg` → URL wird `https://<app-domain>/avatars/<name>.jpg`) und neu deployen.
5. **In der App zuweisen:** Admin-Panel → Spieler verwalten → 🏎️-Button → URL einfügen. Fertig —
   der Avatar erscheint live auf allen Handys (Krone/Pokal/Tränen legt die App automatisch drüber).

## Prompt-Template (Deutsch → wird intern übersetzt, EN funktioniert am besten)

```
3D cartoon kart racer character in the style of a modern party racing game,
chibi proportions with oversized head, sitting in a tiny open go-kart,
gripping the steering wheel, cheeky confident grin, dynamic slight 3/4 view,
[NAME-BESCHREIBUNG: e.g. short brown hair, full beard, black t-shirt],
face closely matching the reference photo, clean studio background in deep
navy (#0b0b10) with subtle red rim light, glossy toy-like render, high detail,
square composition, character centered
NO text, NO logos, NO real brand references
```

**Bräutigam-Zusatz:** `golden kart, small golden crown on his head, white shirt, sash reading nothing (no text)`

## Regeln (aus früheren Higgsfield-Projekten gelernt)
- Identität über **Referenzbild-Slot**, nie img2img
- Maße/Details nach Generierung prüfen (Logos garbeln gern → deshalb NO text/logos im Prompt)
- Pro Person 2–3 Varianten generieren, beste wählen
- Stil-Referenz: `avatars/out/_style_sample.*` (abgesegnetes Muster — alle 7 im selben Look!)
