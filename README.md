# Bernd Tore – kostenlose PWA

## Was die App macht
- gemeinsame Rangliste für Over 2,5
- Länder: Deutschland, Italien, Frankreich, Luxemburg, Portugal, Belgien, Schweiz, Österreich, Saudi-Arabien
- Ligaspiele werden automatisch aus dem gewählten Freitag–Sonntag-Zeitraum geladen
- bis zu 28 Kandidaten bekommen API-Prognosedaten
- Deep-Check der Top 6:
  - letzte 20 Spiele beider Teams
  - Over-2,5-/BTTS-Torprofil
  - H2H bis 10 Spiele
  - gemeldete Verletzungen
  - API-Prognose
- CSV-Export
- installierbar als PWA

## Kostenlos betreiben
1. Kostenloses Konto bei API-FOOTBALL / API-SPORTS erstellen.
2. API-Key in der App eingeben.
3. Den Ordner auf einen HTTPS-Webhost laden, z. B. GitHub Pages.
4. Seite auf dem Handy öffnen:
   - Android/Chrome: Menü → "Zum Startbildschirm hinzufügen" / "App installieren"
   - iPhone/Safari: Teilen → "Zum Home-Bildschirm"

## Wichtig
Die kostenlose API hat ein Tageslimit. Der Deep-Check ist deshalb absichtlich auf Top 6 begrenzt.
Der Key wird nur im localStorage des Geräts gespeichert. Auf einer rein statischen öffentlichen Seite
sollte man keinen fest eingebauten privaten API-Key veröffentlichen.

## Grenzen von Version 1
Eine statische kostenlose App kann nicht automatisch dieselbe freie Web-Recherche durchführen wie ChatGPT.
Transfers, Trainerwechsel und Nachrichten aus beliebigen Fußballseiten brauchen zusätzliche Quellen oder
einen eigenen Backend-Dienst. Die App deckt in Version 1 strukturierte Fußball-Daten ab.


## Update V2
Länder- und Ligaabdeckung anhand der drei neuen Screenshots erweitert.


## V3 – Bernd-Vollcheck
Die Top 5 Kandidaten prüfen jetzt, soweit API-Coverage vorhanden ist:
- letzte 20 Spiele
- Heim/Auswärts- und Torprofile
- Over 1.5 / 2.5 / 3.5
- BTTS
- H2H bis 10
- Verletzungen
- Sidelined
- Transfers
- Coaches
- Lineups
- Team-Saisonstatistik
- Topscorer
- Predictions

Hinweis: Freie Web-Recherche zu Pressemeldungen, Taktik und News aus beliebigen Fußballseiten benötigt
einen separaten Web-Suchdienst oder Backend. V3 kennzeichnet dies offen als "offen".


## V4 – echte Web-Recherche
Optionaler Tavily-Key:
- 2 Basic-Websuchen pro Top-3-Spiel
- aktuelle Verletzungen/Krankheiten/Sperren
- Transfers
- Trainer/Manager-News
- erwartete Aufstellungen / Team-News
- Quellenlinks und Tavily-Kurzantworten im Detailfenster

Die Web-Recherche ist absichtlich auf Top 3 begrenzt, damit der kostenlose Monatsrahmen geschont wird.
Der Tavily-Key wird nur lokal im Browser gespeichert und nicht in den App-Dateien fest eingebaut.
