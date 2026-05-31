# Videocall

Eine dezentrale, serverlose Peer-to-Peer (P2P) WebRTC-Anwendung für Video- und Audioübertragungen. Die Anwendung nutzt das Nostr-Netzwerk via Trystero für ein vollkommen serverloses Signaling und sichert Räume über kryptografische BIP39-Wortkombinationen ab.

## Features & Funktionalität

Die Anwendung unterscheidet zwischen zwei Rollen, die vollautomatisch ausgehandelt werden:

1. **Receiver (Empfänger):**
   * Beim Öffnen der Basis-Anwendung wird ein neuer Raum generiert.
   * Es werden 4 zufällige Pairing-Wörter aus der BIP39-Englisch-Wortliste erzeugt.
   * Die Anwendung erstellt einen direkten Einladungslink sowie einen QR-Code zur schnellen Kopplung.
   * Sobald sich ein Sender verbindet, öffnet sich ein Overlay zur Bestätigung des Anrufs.

2. **Sender (Übertragender):**
   * Kann dem Raum beitreten.
   * Bietet drei Koppelungsmethoden:
     * **Direkt-URL:** Aufruf des generierten Einladungslinks (`?room=...`) per manueller Eingabe oder durch Scannen des QR-Codes mit der Smartphone-eigenen Kamera-App und anschließender Öffnung des im QR-Code hinterlegten Links. 
     * **Manuelle Eingabe:** Klicken auf "I want to call" und Eingabe der 4 Pairing-Wörter mit unterstützter Autovervollständigung der BIP39-Wortliste.
     * **QR-Code-Scanner:** Direktes Scannen des Receiver-Bildschirms über den integrierten QR-Code-Scanner.

---

## Voraussetzungen (Requirements)

Um die Anwendung lokal auszuführen und die Test-Suiten zu starten, werden folgende Komponenten benötigt:

* **Node.js**: Version 20 oder höher empfohlen.
* **NPM**: Paketmanager (wird standardmäßig mit Node.js ausgeliefert).
* **Moderne Webbrowser**: Chrome, Chromium, Firefox oder Safari mit vollständiger WebRTC- und Medien-Unterstützung (Kamera/Mikrofon).
* **Playwright-Browser**: Speziell Chromium für die automatisierten E2E-Tests.

## Lokale Ausführung

1. **Abhängigkeiten installieren**:
```bash
npm install
```

2. **Entwicklungsserver starten**:
```bash
npm run dev
```
Die Anwendung ist anschließend standardmäßig unter `http://localhost:5173/videocall/` erreichbar.

## Production Build

1. **Abhängigkeiten installieren**:
```bash
npm install
```

2. **Produktions-Build erstellen**:
```bash
npm run build
npm run preview
```
Die Anwendung ist anschließend standardmäßig unter `http://localhost:5173/videocall/` erreichbar.

## Tests ausführen

Das Projekt verwendet **Playwright** für umfassende Ende-zu-Ende-Tests (E2E). Die Test-Suite deckt sowohl den reinen Signaling-Verbindungsaufbau über alle drei Koppelungswege ab als auch die mathematische Integritätsprüfung der echten Video- und Audioübertragung.


1. **Abhängigkeiten installieren**:
```bash
npm install
```

2. **Playwright-Browser installieren**:
```bash
npx playwright install chromium
```

3**Tests im Headless-Modus ausführen**:

```bash
npx playwright test

```

### Test-Struktur

* `tests/helpers.js`: Geteilte Setup-Logik zur Initialisierung des Receivers und Klick-Automatisierung.
* `tests/connection-manual.spec.js`: Testet die manuelle Eingabe der BIP39-Wörter.
* `tests/connection-url.spec.js`: Testet den automatischen Handshake beim Direktaufruf via Query-Parameter.
* `tests/connection-scan.spec.js`: Testet den integrierten QR-Scanner mittels Kamera-Streams.
* `tests/media-transmission.spec.js`: Injiziert einen synthetischen Medienstream und verifiziert mittels Frequenzanalyse und Pixel-Delta-Bewegungserkennung, ob Video und Audio Übertragungen stattfinden.

### Alternative Verifizierung
Alternativ kann die Applikation über das Deployment auf Github-Pages sowie die Testausführung mittels des Workflows verifiziert werden. 