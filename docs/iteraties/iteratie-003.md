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

Nog in uitvoering. Er zijn tests toegevoegd voor tijdvak, overlap, aangrenzende lessen, afkappen van lange lessen en het openen van lesdetails vanuit het raster. Werkelijke test-/buildresultaten en screenshots worden na publicatie toegevoegd. Van de oude agendalijst is geen aparte screenshot vastgelegd; de vorige bronversie is bewaard in Git.

Persoonlijke reflectie: nog door student aan te vullen.
