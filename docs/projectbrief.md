# Schoolplanner — projectbrief

## Briefing student

Een website bouwen **met Lovable**, mobile first, om schoolzaken te regelen. Lessen ophalen uit de opgegeven Avans-agenda. Per les aantekeningen kunnen maken en bij aankomende lessen vastleggen wat vooraf gedaan moet worden. Alles op main van Freekvrijn/schoolplanner publiceren met GitHub Pages.

De letterlijke opdracht staat ook in [de eerste verzonden prompt](bewijs/iteratie-001/prompt.txt).

## MVP en acceptatiecriteria

| Onderdeel | Criterium |
| --- | --- |
| Agenda | Echte lessen met correcte Amsterdamse datum/tijd en lokaal; dag/weeknavigatie en zoeken |
| Voorbereiding | Per les meerdere taken toevoegen, bewerken, verwijderen en afvinken; overzicht open/afgerond |
| Notities | Per les tekst invoeren, automatisch opslaan en na herladen terugvinden |
| Stabiele koppeling | Originele UID koppelt gegevens aan lessen; lesmetadata blijft bij persoonlijke gegevens bewaard |
| Mobiel | Bruikbaar op 375 px met onderste navigatie en leesbare lesdetails |
| Backup | Gegevens exporteren en na validatie/bevestiging importeren; foutieve import verandert huidige gegevens niet |
| Publicatie | Statische app onder /schoolplanner/, werkend via GitHub Pages vanaf main |
| Bewijs | Echte prompts, fouten, tests, versies en screenshots vastgelegd; geen verzonnen studentreflectie |

## Gekozen aanpak door assistent

- De externe agenda heeft geen browser-CORS-header. Een GitHub Action haalt ICS op en publiceert JSON naast de app.
- Rooster ongeveer iedere drie uur verversen, laatste bronupdate zichtbaar maken.
- Taken/notities lokaal in de browser; export/import voor backup. Geen account of gegevenssynchronisatie tussen apparaten in deze MVP.
- Geen database, AI-koppeling of andere nieuwe functionaliteit zonder vervolgopdracht.
- GitHub Pages volgens expliciete gebruikersinstructie, hoewel de lespresentatie Netlify noemt. Een afwijkende afspraak met de docent is niet bevestigd.

## Vragen en afbakening

De student gaf onderwerp, gegevensbron, kernfuncties, mobiele voorkeur en publicatiebestemming. Routinekeuzes over vormgeving en technische inrichting zijn door de assistent gemaakt. Persoonlijke voorkeuren of leerervaringen zijn niet namens de student ingevuld.
