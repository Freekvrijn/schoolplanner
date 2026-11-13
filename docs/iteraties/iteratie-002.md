# Iteratie 002 — lokale reparatie en verificatie

- Datum: 13 november 2026.
- Uitvoerder: Codex, lokaal. De appbasis blijft afkomstig van Lovable.
- Status: gerepareerd, getest en gepubliceerd.
- Beginsituatie: Lovable-versie efe38ac738df3065674983dfe453227c589df09c, lokaal bewaard als 074612b.

## Aanleiding en prompt

De onafhankelijke installatie faalde en codecontrole vond onvoldoende validatie bij backups. De [vervolgprompt](../bewijs/iteratie-002/prompt.txt) is aan de Lovable-tool aangeboden, maar door ontbrekende credits **niet uitgevoerd**. [Toolstatus en vervolgkeuze](../bewijs/iteratie-002/status.txt).

De gebruiker is hierover geïnformeerd en vroeg of credits kopen nodig is. Antwoord: niet om lokaal te repareren, testen en publiceren. De lokale reparatie mag niet als een tweede Lovable-bouw worden gepresenteerd.

## Uitgevoerde wijzigingen

- Niet-portable sandboxlock verwijderd. GitHub Actions genereert eenmalig een schone npm-lock en bewaart die op main.
- Echte kalenderdatumvalidatie en controles op dubbele taak-ID's/ontbrekende lesmetadata toegevoegd.
- Backup-import schakelt pas over naar de nieuwe gegevens nadat opslaan lukt.
- Betekenisvolle parser-, backup- en gebruikersflowtests en een afzonderlijke typecheck voor de statische app toegevoegd.
- Eigen SVG favicon en passende documentatie toegevoegd.
- Publicatie controleert installatie, synchronisatie, types, tests en build.

## Verificatie

Productieversie: d9e18d1d330405202f1822be7abd8a18cccf172f. [GitHub Actions-run](https://github.com/Freekvrijn/schoolplanner/actions/runs/43415835596) heeft een geslaagde build én deployment. De uitkomsten zijn tevens bewaard in [ci-resultaat.json](../bewijs/iteratie-002/ci-resultaat.json).

| Controle | Verwacht | Werkelijk resultaat |
| --- | --- | --- |
| Portable installatie | Geen sandboxverwijzingen; npm ci slaagt | Nieuwe lock met 282 pakketten, geen sandboxlinks; npm ci geslaagd in GitHub Actions |
| Typecontrole | Geen TypeScript-fouten in planner/tests | Geslaagd, na herstel van ontbrekende laadweergave en testtypes |
| Automatische tests | Parser, datums, backupvalidatie, quota en bewaren bij direct sluiten | npm test geslaagd; zie testbestanden in src/test |
| Productiebuild en Pages-deploy | Statische uitvoer onder /schoolplanner/ | Beide geslaagd |
| Onafhankelijke tijdvergelijking | Alle originele start- en eindtijden correct | 48 lessen gecontroleerd met Python datetime/zoneinfo; alle tijden kloppen |
| Live rooster | Echte JSON vanaf dezelfde site | 48 echte lessen; bronupdate 13 november 2026 om 12:17 lokale tijd |
| Safari desktop | Leesbaar overzicht en werkend lespaneel | Geobserveerd; screenshot bewaard |
| Taak bewaren | Toevoegen en afvinken blijft na herladen behouden | Geobserveerd met duidelijk gemarkeerde testtaak |
| Aantekening bewaren | Tekst blijft na direct sluiten/herladen behouden | Exacte testtekst teruggelezen, status Opgeslagen; screenshot bewaard |
| Safari responsive 375 × 812 | Mobiele indeling met bruikbare navigatie | Geobserveerd; geen zichtbare horizontale overflow; screenshot bewaard |
| Mobiele agenda | Volgende week toont komende echte lessen; zoeken filtert | Week 47 geopend, Skillslab-zoekopdracht verbergt andere vakken |
| Backupdownload | JSON bevat taak, notitie en lesmetadata | Gedownload bestand apart gelezen en gevalideerd: één testtaak, één testnotitie |

De backup-import is op schema-/opslagniveau automatisch getest. Een volledige import via de Safari-bestandskiezer is niet afgerond en wordt niet als geslaagde browsertest opgevoerd. Een fysiek mobiel toestel en een echt mobiel schermtoetsenbord zijn niet getest.

## Bewijs en publicatie

- [Installatiefout in eerste GitHub-run](../bewijs/iteratie-002/01-github-installatiefout.png).
- [Live desktop](../bewijs/iteratie-002/02-live-desktop.png).
- [Notitie na herladen](../bewijs/iteratie-002/03-notitie-na-herladen.png).
- [Live mobiel op 375 px](../bewijs/iteratie-002/04-live-mobiel-375.png).
- [Onafhankelijke agendavergelijking](../bewijs/iteratie-002/agenda-controle.txt).
- [Gedownloade backup met uitsluitend testgegevens](../bewijs/iteratie-002/backup-testgegevens.json).

Live URL: https://freekvanrijn.nl/schoolplanner/. Dit domein volgt uit de bestaande GitHub Pages-domeininstelling van de gebruiker. Er is geen nieuw domein aangemaakt. Taken en notities worden uitsluitend in de browser bewaard, niet in de publieke repo. De TEST-items zijn handmatig aangemaakt tijdens de controle en staan alleen in de gebruikte Safari-opslag; zij zijn geen standaardgegevens in de applicatie.

## Evaluatie

De eerste gegenereerde code bleek nog niet direct publiceerbaar. Onafhankelijk installeren en testen maakte de niet-portable lock, npm-resolutiefout en typeproblemen zichtbaar. De gekozen oplossing gebruikt alleen de benodigde statische pakketten en een gecontroleerde npm-versie. De tijdelijke schrijfrechten van de lockfile-reparatieworkflow zijn na generatie teruggebracht naar contents:read. Publicatie loopt nu pas door wanneer synchronisatie, types, tests en build slagen.

Roosterverversing loopt gepland iedere drie uur en kan door GitHub vertraagd worden. Er is nog geen geplande run afgewacht; de eerste handmatig door push gestarte run is wel volledig geverifieerd. De persoonlijke reflectie en een vergelijking met andere tools blijven werk voor de student/groep.

Persoonlijke reflectie: nog door student aan te vullen.
