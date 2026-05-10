# Voylix — Production Deploy auf IIS

Drei Komponenten, alle unter Domain `voylix.de`:

| URL                  | Inhalt                       | Pfad auf Server                       |
|----------------------|------------------------------|---------------------------------------|
| `voylix.de/`         | Marketing-Site (Next.js)     | IIS Site root, z.B. `C:\inetpub\wwwroot` |
| `voylix.de/app/`     | React SPA (dieses Repo)      | IIS Subfolder `C:\inetpub\wwwroot\app`   |
| `api.voylix.de/`     | .NET 8 Backend (RechnioServer) | Eigene IIS-Site (bereits vorhanden)   |

---

## 1) React SPA bauen und deployen (`voylix.de/app/`)

### Lokal bauen

```bash
cd RechinoPortal
npm ci
npm run build
```

Das erzeugt einen `dist/` Ordner mit allen Static Files. Wichtig:
- `vite.config.ts` ist auf `base: '/app/'` (nur in production mode) gesetzt.
- `App.tsx` setzt React Router auf `basename="/app"` (nur in production).
- Das vorhandene `public/web.config` wird automatisch nach `dist/` kopiert.

### Auf den Server kopieren

Den **kompletten Inhalt** von `dist/` nach `C:\inetpub\wwwroot\app\` kopieren (XCopy / FTP / RDP).

```
C:\inetpub\wwwroot\app\
├── index.html
├── web.config        ← URL-Rewrite für SPA-Routes
├── assets\           ← gebaute JS/CSS chunks
└── ...
```

### IIS-Voraussetzungen

- **URL Rewrite Module** muss installiert sein:
  https://www.iis.net/downloads/microsoft/url-rewrite
- Die App-Pool-Identity muss Lesezugriff auf `wwwroot\app` haben.
- Wenn IIS-Site SSL hat (sollte für `voylix.de` bereits aktiv sein), funktioniert HTTPS automatisch.

### Test

- `https://voylix.de/app/` → Login-Seite muss erscheinen.
- `https://voylix.de/app/dashboard` → Direkt-Aufruf darf nicht 404 werfen (URL-Rewrite kümmert sich darum).

---

## 2) Marketing-Site (`voylix.de/`)

Das Repo ist `C:\Users\User\source\repos\Voylix-Website` (Next.js 14).

**Empfohlene Variante**: Next.js als Node-Prozess laufen lassen + IIS als Reverse-Proxy.

### Variante A — Next.js Node + IIS Reverse-Proxy (empfohlen)

1. Node 20 LTS auf dem Server installieren.
2. Repo nach Server kopieren, z.B. `C:\Voylix-Website\`.
3. Production env vars setzen (`.env.production` neben `package.json`):

   ```
   NEXT_PUBLIC_API_URL=https://api.voylix.de
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

4. Build + Start:

   ```bash
   cd C:\Voylix-Website
   npm ci
   npm run build
   npm run start -- -p 3000
   ```

   Tipp: Mit **NSSM** oder **PM2** als Windows-Service laufen lassen, damit beim Reboot automatisch startet.

5. Auf der `voylix.de` IIS-Site **URL Rewrite Reverse-Proxy** anlegen, der `/` (außer `/app`) an `http://localhost:3000` weiterleitet:

   `C:\inetpub\wwwroot\web.config` (auf Site-Ebene):

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <!-- /app/* nicht weiterleiten — bleibt statisch in /app -->
           <rule name="Skip /app" stopProcessing="true">
             <match url="^app(/.*)?$" />
             <action type="None" />
           </rule>
           <!-- alles andere zur Next.js-Node-Anwendung -->
           <rule name="ReverseProxy to Next.js" stopProcessing="true">
             <match url="(.*)" />
             <action type="Rewrite" url="http://localhost:3000/{R:1}" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

   Module nötig: **URL Rewrite** + **Application Request Routing (ARR)**:
   https://www.iis.net/downloads/microsoft/application-request-routing

### Variante B — Next.js Static Export

Falls `next.config.mjs` auf `output: 'export'` umgestellt wird (Achtung: Middleware + i18n-Routing müssen angepasst werden), kann das Marketing nach Build (`npm run build`) als statische Dateien aus `out/` direkt nach `C:\inetpub\wwwroot\` deployt werden — **ohne Node**. Das `/api/contact` und `/api/chat` Routen würden dann verschwinden — das passt, weil das .NET-Backend `https://api.voylix.de/api/Contact` jetzt diese Aufgabe übernimmt.

---

## 3) .NET Backend (`api.voylix.de`)

Bereits live. Nach den heutigen Änderungen aber **Backend neu starten**:

1. `appsettings.json` auf dem Server hat jetzt eine `Smtp`-Sektion. Dort den **echten** SMTP-Pass eintragen (nicht den im Repo):

   ```json
   "Smtp": {
     "Host": "smtp.ionos.de",
     "Port": 587,
     "User": "info@voylix.de",
     "Password": "<echtes Passwort>",
     "From": "info@voylix.de",
     "FromName": "Voylix Website",
     "DefaultTo": "info@voylix.de",
     "EnableSsl": true
   }
   ```

2. `dotnet publish -c Release -o ./publish` → Inhalt nach IIS-Site `api.voylix.de` kopieren.
3. App-Pool recyceln (oder `iisreset` falls okay).

### CORS

`Program.cs` erlaubt bereits `https://voylix.de` und `https://www.voylix.de`. Falls auf andere Domains erweitert wird, dort eintragen.

### Test

```bash
curl -X POST https://api.voylix.de/api/Contact \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Hallo\"}"
```

Erwartet: `{"ok": true}` und E-Mail in `info@voylix.de`.

---

## 4) DNS / SSL

Solange alles unter `voylix.de` läuft, reicht **ein** Let's-Encrypt-Zertifikat für die Domain. Subdomains: `api.voylix.de` braucht ein eigenes Zertifikat (vermutlich schon vorhanden, weil Backend bereits live).

---

## 5) Smoke-Test nach Deploy

| Schritt | Erwartet |
|---|---|
| `https://voylix.de/` | Marketing-Landingpage |
| Login-Button im Header | Wechselt zu `https://voylix.de/app/login` |
| Login mit echten Credentials | Redirect zu `/app/dashboard` |
| Direkt-Aufruf `https://voylix.de/app/customers` | Lädt Kundenliste (kein 404) |
| Kontaktformular auf `voylix.de` ausfüllen + senden | E-Mail kommt in `info@voylix.de` an |
| `voylix.de` ohne `/app` | "Not Secure" Warnung weg (SSL aktiv) |

---

## 6) Sicherheits-Checkliste

- ⚠️ **SMTP-Passwort und OpenAI-Key wurden im Chat sichtbar** — bitte rotieren:
  - IONOS-Postfach: neues Passwort setzen → in `appsettings.json` und `.env.production` eintragen.
  - OpenAI: Key revoken auf platform.openai.com, neuen Key generieren.
- `appsettings.json` mit Secrets **nicht** in Git committen — entweder `appsettings.Production.json` mit dem echten Pass nur auf Server haben, oder Environment Variables nutzen.
- IIS Anonymous Auth ist OK für Static + Reverse-Proxy. JWT-Auth läuft im Backend selbst.
- HTTP → HTTPS Redirect in IIS aktivieren (HTTP Redirect Module).
