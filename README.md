# Schoolplanner

Een mobile-first planner voor Freek met het echte Avans-rooster, voorbereidingstaken en aantekeningen per les. De eerste applicatie is gebouwd met [Lovable](https://lovable.dev/projects/b56cb6be-5819-4636-abd5-85fdcd50b24f). Publicatie gebeurt via GitHub Pages vanuit main.

## Gebruik

- **Vandaag:** huidige/eerstvolgende les, dagoverzicht en open voorbereiding.
- **Agenda:** dag-, week- en lijstweergave, met zoeken en vakfilter.
- **Les openen:** taken toevoegen, bewerken en afvinken, of automatisch opgeslagen aantekeningen typen.
- **Taken / Aantekeningen:** alles terugvinden, ook als een les uit de actuele bron verdwijnt.
- **Instellingen:** laatste roostersync en backup exporteren/importeren.

Je taken en aantekeningen blijven in de browser op dit apparaat. Ze worden niet naar GitHub verzonden en synchroniseren niet tussen apparaten. Via een JSON-backup kun je gegevens overzetten. De publicatie-URL en lokale preview hebben ieder hun eigen browseropslag.

## Rooster

GitHub Actions haalt de Avans ICS-agenda iedere drie uur op. De browser leest het gepubliceerde rooster.json van dezelfde site, zodat geen CORS-proxy nodig is. De knop voor vernieuwen haalt de laatst gepubliceerde versie op. GitHub kan geplande runs vertragen.

Het script verwerkt de originele UID als les-ID, Amsterdamse winter-/zomertijd, annuleringen en dubbele UID's. De opgehaalde bron bevat losse lessen zonder herhalingsregels. Bij een eventuele toekomstige RRULE neemt de parser alleen de eerste keer op en meldt dit als waarschuwing.

Als de bron tijdelijk faalt blijft een bestaande echte momentopname staan, met de oorspronkelijke bijwerkdatum en een zichtbare melding. Zonder een echte eerdere momentopname faalt de synchronisatie. De browser bewaart eerder geziene voorbije lessen. Notities en taken bewaren bovendien eigen lesmetadata. De bron zelf biedt geen volledig historisch rooster.

## Ontwikkeling

Node 22.12 of nieuwer aanbevolen. Vanuit een schone checkout:

```sh
npm ci
npm run sync:calendar
npm run dev:pages
```

De statische app staat onder /schoolplanner/, ook in de lokale preview. Voor controle:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

De uitvoer staat in dist-pages. Hashnavigatie ondersteunt GitHub Pages zonder serverroutes. De uiteindelijke Pages-app gebruikt uitsluitend de statische React-ingang. De ongewijzigde eerste Lovable-versie is terug te vinden in commit 074612b en in het Lovable-project. Ongebruikte serverframework- en templatebestanden zijn bij de publicatiereparatie verwijderd.

## Procesbewijs

Zie [proceslog](docs/proceslog.md), [projectbrief](docs/projectbrief.md) en de verslagen in [docs/iteraties](docs/iteraties). De exacte prompts, geobserveerde fouten en screenshots staan bij [het bewijs](docs/bewijs). Iteratie 001 is van Lovable; reparaties in iteratie 002 zijn lokaal door Codex uitgevoerd nadat Lovable geen credits meer had. Persoonlijke reflectie moet de student zelf aanvullen.

Screenshots en opnames moeten voor de schoolpresentatie rechtstreeks in de PowerPoint worden ingesloten. GitHub Pages is op verzoek van de student gebruikt; de lespresentatie noemt Netlify.

