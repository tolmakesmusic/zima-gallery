# Galerie für ZimaOS

Foto- und Videogalerie im Stil der iPhone-Fotos-App: Mediathek, Sammlung (Alben, Favoriten, Rückblick, Medienarten, Labels), Import mit Import-Labels und Einstellungen.

## Speicherorte (bleiben bei jedem Update erhalten)

| Host-Ordner | Inhalt |
|---|---|
| `/DATA/Gallery/Mediathek/JJJJ/MM/` | Fotos & Videos ohne Album, nach Aufnahmedatum |
| `/DATA/Gallery/Alben/2026-04-03 Band Konzert 3/` | Alben nach Schema `Datum Label Name` |
| `/DATA/Gallery/.papierkorb/` | „Zuletzt gelöscht“ |
| `/DATA/AppData/zima-gallery/` | Datenbank, Vorschaubilder, Label-Logos |

Die App selbst enthält keine Daten. Ein neues Image ersetzt nur den Programmcode.

## Installation (Variante A: direkt auf dem Server bauen)

1. Ordner per SMB oder `scp` auf den Server kopieren, z. B. nach `/DATA/AppData/zima-gallery-src`.
2. Per SSH einloggen und bauen:
   ```sh
   cd /DATA/AppData/zima-gallery-src
   docker build -t zima-gallery:latest .
   ```
3. In ZimaOS: App Store → **+** (Benutzerdefinierte App) → **Import** → Inhalt von `docker-compose.yml` einfügen → Installieren.
4. Aufrufen unter `http://<server-ip>:8095`.

**Update:** neue Dateien in den Quellordner kopieren und `./update.sh` ausführen.

## Installation (Variante B: über GitHub, empfohlen für Updates)

1. Projekt als GitHub-Repository hochladen.
2. Tag setzen (`git tag v1.0.0 && git push --tags`) – der Workflow baut automatisch Images für amd64 und arm64.
3. In `docker-compose.yml` `image:` auf `ghcr.io/<dein-name>/zima-gallery:latest` ändern (Paket auf GitHub ggf. auf „public“ stellen) und in ZimaOS importieren.

**Update:** neuen Tag pushen, dann in ZimaOS bei der App auf „Aktualisieren“/neu starten.

## Bereits vorhandene Fotos übernehmen

Fotos per Datei-Manager nach `/DATA/Gallery/Mediathek` oder in einen Album-Ordner unter `/DATA/Gallery/Alben` kopieren, dann **Einstellungen → Bibliothek → Scannen**.

## Bedienung

- **Auswählen**: Button oben oder lange auf ein Foto tippen. Umschalt-Klick wählt einen Bereich.
- **Lightbox**: Wischen/Pfeiltasten blättern, nach unten wischen oder Esc schließt, F/Leertaste = Favorit, Doppelklick zoomt.
- **Datum-Erkennung**: EXIF → Video-Metadaten → Dateiname (z. B. `IMG-20220101-WA0001`, Snapchat-Exporte) → Änderungsdatum der Datei.
- **Duplikate** werden beim Import automatisch übersprungen.
