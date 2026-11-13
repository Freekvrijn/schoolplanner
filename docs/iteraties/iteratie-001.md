# Iteratie 001 — Lovable MVP

- Datum: 13 november 2026.
- Tool: Lovable, aangestuurd door Codex namens student.
- Lovable-versie: efe38ac738df3065674983dfe453227c589df09c.
- Lokaal bewaarde bronversie: 074612b (nog niet gepubliceerd op dat moment).
- Status: gebouwd; onafhankelijke installatiecontrole mislukt.

## Doel en prompt

Eerste mobile-first versie met echte Avans-lessen, voorbereiding en notities. [Exacte daadwerkelijk verzonden prompt](../bewijs/iteratie-001/prompt.txt).

## Uitvoering

Lovable heeft de schermen, gegevensopslag, agenda-parser, syncscript en publicatieworkflow gemaakt. De echte agenda is opgehaald en bevatte 48 lessen. Lovable heeft zelf gemeld nog geen applicatiebuild of browsertest te hebben uitgevoerd. De oorspronkelijke Lovable-omgeving gebruikt een eigen framework; daarom is daarnaast een zelfstandige Vite-ingang voor GitHub Pages gemaakt.

## Onafhankelijke controle door Codex

| Test | Verwacht | Werkelijk | Resultaat |
| --- | --- | --- | --- |
| ICS ophalen | Geldige echte lessen | 48 VEVENT-items, geen RRULE, geen annuleringen | Geslaagd |
| Schone installatie op macOS arm64 | Platformgeschikte pakketten installeren | EBADPLATFORM; lockfile bevat ../persist-sandboxverwijzingen | Mislukt |
| Functionele gebruikersflows | Taken en notities teruglezen | Nog niet uitgevoerd | Niet getest |

Bewijs: [publicatie-instelling](../bewijs/iteratie-001/01-github-pages-instelling.png), [Lovable-prompt en lopende bouw](../bewijs/iteratie-001/02-lovable-prompt-en-bouw.png), [echte installatiefout](../bewijs/iteratie-001/03-installatiefout.txt). Er is geen screenshot van een werkende eerste app-versie vastgelegd. De oorspronkelijke broncode is bewaard in Git.

## Evaluatie en vervolg

De eerste poging leverde de kernapp op, maar was nog niet publiceerbaar. De installatie-afhankelijkheid van de sandbox vereist een reparatie. Codecontrole vond daarnaast onvoldoende backup-/datumvalidatie en een import die bij opslagfouten de actieve gegevens al verving. Deze punten vormen iteratie 002.

Persoonlijke reflectie: nog door student aan te vullen.
