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
| 001 | Lovable, gestart door Codex namens student | Eerste MVP bouwen | App gegenereerd; onafhankelijke installatie faalde | Prompt, bronversie, bouwscreenshot en foutmelding bewaard | Portable installatie en functionele controle |
| 002 | Codex lokaal + GitHub Actions + Safari | Repareren, testen en publiceren | Build/tests/deploy geslaagd; live gebruikersflows gecontroleerd | Foutenscreenshot, CI-uitkomsten, desktop/mobiele screenshots, notitie na herladen en testbackup bewaard | Eigen studentreflectie en presentatie voorbereiden |

## 13 november 2026 — reparatie en publicatie

- Lovable leverde commit efe38ac738df3065674983dfe453227c589df09c op. Code bewaard in lokale/GitHub-commit 074612b.
- Onafhankelijke installatie faalde door sandboxverwijzingen in het lockfile. Het exacte resultaat is bewaard.
- De tweede prompt kon niet door Lovable worden uitgevoerd wegens ontbrekende credits. De student is geïnformeerd. Vervolgwerk is expliciet als lokale Codex-reparatie vastgelegd.
- De lokale omgeving kon geen npm-netwerktoegang krijgen. Installatie, types, tests en build zijn daarom uitgevoerd via de geautoriseerde GitHub Actions-workflow.
- De eerste CI-pogingen faalden bij pakketresolutie. Ongebruikte template/serverpakketten zijn verwijderd en npm is bijgewerkt. Daarna slaagde de schone installatie.
- Typecontrole vond nog een ontbrekende laadcomponent en testtypes; beide hersteld. De echte productcode en tests zijn vervolgens geslaagd.
- Geslaagde productiebron: d9e18d1. Run: https://github.com/Freekvrijn/schoolplanner/actions/runs/43415835596.
- Publicatie geverifieerd via succesvolle deployment, HTTP 200, 48 live lessen en Safari.
- Live URL: https://freekvanrijn.nl/schoolplanner/.
- Safari desktop en responsive 375 × 812 gecontroleerd: les openen, taak toevoegen/afvinken, notitie typen, sluiten en herladen, teruglezen, weeknavigatie en zoeken. Backupdownload gevalideerd. Alleen gemarkeerde TEST-gegevens gebruikt.
- Volledige browserimport en fysiek mobiel toetsenbord niet geverifieerd. Er zijn geen resultaten daarvoor verzonnen.
- Screenshots en concrete controle-uitkomsten staan bij docs/bewijs/iteratie-002. Zie iteratieverslag voor de volledige testtabel.

Persoonlijke reflectie: nog door student aan te vullen.
