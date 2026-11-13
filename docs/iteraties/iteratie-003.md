# Iteratie 003 — weekraster zoals een kalender

- Datum: 13 november 2026.
- Uitvoerder: Codex, lokaal, op de bestaande Lovable-app.
- Beginsituatie: gepubliceerde productcode d9e18d1; documentatiecommit 5b4962d.
- Aanleiding: de student wil ook een weekoverzicht met dagkolommen en tijdblokken zoals Apple Kalender.
- Definitieve tijdsafbakening: 08:00–18:00 op alle zeven dagen, na correctie door de student.
- [Letterlijke opdracht en correctie](../bewijs/iteratie-003/opdracht.txt).

## Acceptatiecriteria

- Weekweergave met maandag t/m zondag naast elkaar en tijdlijnen van 08:00 t/m 18:00.
- Echte lessen op basis van begin/eindtijd positioneren; titel, tijd en lokaal tonen.
- Overlappende lessen naast elkaar plaatsen en de huidige dag/tijd markeren.
- Aanklikken opent hetzelfde lespaneel voor voorbereiding en aantekeningen.
- Op mobiel alleen het raster horizontaal kunnen schuiven, met vaste tijdkolom en dagkoppen.
- De oude weeklijst behouden als aparte optie Lijst; zoeken, vakfilters en weeknavigatie blijven werken.
- Lessen die volledig buiten het tijdvak vallen blijven via een aparte vermelding bereikbaar.

## Wijzigingen

Nieuwe WeekCalendar-component en afzonderlijke plaatsingslogica. Week toont standaard het raster; Dag, Lijst en Alles blijven beschikbaar. Bestaande notities en taken gebruiken dezelfde les-ID's en opslag.

## Verificatie

Productiebron: f18b2dcb8152c2e7bec2949ba44373c0dc22d124. [GitHub-run](https://github.com/Freekvrijn/schoolplanner/actions/runs/43417407395) heeft geslaagde typecontrole, tests, build en deployment. [Bewaarde CI-resultaten](../bewijs/iteratie-003/ci-resultaat.json).

| Controle | Werkelijk resultaat |
| --- | --- |
| Tijdvak 08:00–18:00 | Automatisch getest; begin/einde tevens live in de browser teruggezien |
| Overlap en aangrenzende lessen | Plaatsingstests geslaagd; overlappende lessen krijgen aparte kolommen |
| Lange lessen en verkeerde dag | Plaatsingstests geslaagd; volledig originele lestijden blijven behouden |
| Lespaneel vanuit raster | Automatische test geslaagd; gastcollege van vrijdag 13 november live geopend met de juiste datum, 09:30–11:00, lokaal en docenten |
| Oude weeklijst | Automatische test schakelt van Week naar Lijst en vindt dezelfde les terug |
| Echte komende lessen | Week 47 in Chrome geopend: maandag 08:30–18:00, dinsdag 09:00–11:00 en 11:00–13:00, plus woensdag/donderdag op de juiste dagen |
| Sticky dagkoppen | Live verticaal gescrold; dagkoppen en tijdkolom blijven leesbaar |
| Mobiele indeling | In Chrome Responsive op 375 × 812 bekeken; compacte navigatie en weekraster met eigen schuifgebied zichtbaar. Geen fysiek toestel getest |

Screenshots: [desktop met weekkeuze](../bewijs/iteratie-003/01-weekraster-desktop.png), [onderkant met 18:00](../bewijs/iteratie-003/02-tijdvak-tot-1800.png), [komende week met echte lesblokken](../bewijs/iteratie-003/03-komende-week.png).

Van de oude agendalijst is geen aparte screenshot vastgelegd; de vorige bronversie is bewaard in Git. De nieuwe mobiele weergave is visueel bekeken maar daarvan is geen aparte screenshot opgeslagen. De oorspronkelijke mobiele plannercontrole staat bij iteratie 002. Er is geen nieuwe Lovable-bouw uitgevoerd voor deze uitbreiding.

## Uitkomst

De gewenste kalenderindeling is live onder Agenda → Week. Het definitieve tijdvak 08:00–18:00 vervangt de aanvankelijk genoemde 09:00–17:00. De tijdblokken gebruiken dezelfde les-ID's als de lijst en openen bestaande taken/notities. Status: afgerond en gepubliceerd.

Persoonlijke reflectie: nog door student aan te vullen.
