# Iteratie 002 — lokale reparatie en verificatie

- Datum: 13 november 2026.
- Uitvoerder: Codex, lokaal. De appbasis blijft afkomstig van Lovable.
- Status: reparaties uitgevoerd; build en functionele verificatie volgen.
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

Wordt bijgewerkt met de werkelijk uitgevoerde GitHub Actions-resultaten en browsercontroles. Tot die tijd geen claim dat de site live of volledig getest is.

Persoonlijke reflectie: nog door student aan te vullen.
