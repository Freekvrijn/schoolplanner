# Proceslog Schoolplanner

## 13 november 2026 — start

- Opdracht van de student: bouwen met Lovable, Avans-agenda ophalen, per les aantekeningen en voorbereidingstaken, mobile first, publiceren op main van `Freekvrijn/schoolplanner` via GitHub Pages.
- Hostingkeuze wijkt af van de Netlify-instructie uit de lespresentatie: GitHub Pages is expliciet door de student gekozen. Een afwijkende afspraak met de docent is niet bevestigd.
- AGENTS.md gelezen. Deze sessie voert de gekozen schoolplanner uit; andere tools zijn niet namens de student vergeleken.
- Assistent heeft de echte ICS-feed opgehaald: 48 VEVENT-items, geen RRULE en geen geannuleerde items in deze momentopname.
- Geobserveerde beperking: de agendaresponse bevat geen Access-Control-Allow-Origin. Daarom haalt een geplande GitHub Action het rooster op en serveert de website een eigen JSON-bestand.
- Praktische MVP-keuze door de assistent: persoonlijke taken en notities in lokale browseropslag, met backup/import. Synchronisatie tussen apparaten valt buiten deze eerste versie.
- Lovable-project aangemaakt: https://lovable.dev/projects/b56cb6be-5819-4636-abd5-85fdcd50b24f.
- Exacte verzonden bouwprompt: [iteratie 001](bewijs/iteratie-001/prompt.txt).
- GitHub Pages via Safari ingesteld op GitHub Actions. Screenshot: [instelling](bewijs/iteratie-001/01-github-pages-instelling.png).
- Screenshot van daadwerkelijk verzonden Lovable-prompt en lopende bouw: [Lovable](bewijs/iteratie-001/02-lovable-prompt-en-bouw.png).
- Lokale publicatiecheckout: `/private/tmp/schoolplanner-publish`, omdat de projectmap het aanmaken van `.git` niet toestond. Er is nog geen commit of publicatie uitgevoerd op het moment van deze notitie.

| Iteratie | Tool / uitvoerder | Doel | Resultaat | Bewijsstatus | Vervolg |
| --- | --- | --- | --- | --- | --- |
| 001 | Lovable, gestart door Codex namens student | Eerste MVP bouwen | In uitvoering | Prompt en beginsituatie vastgelegd; functionele controle volgt | Broncode controleren en gebruikersflows testen |

Persoonlijke reflectie: nog door student aan te vullen.
