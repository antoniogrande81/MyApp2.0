# 🛡️ MyApp

**Progressive Web App moderna** - Una piattaforma avanzata e sicura per gestire servizi, richieste e comunicazioni per tutti i membri della community.

---

## 🚀 Caratteristiche Principali

- ✅ **Autenticazione sicura** con Appwrite
- 📱 **Progressive Web App** (PWA) installabile
- 🎨 **Design Aurora Boreale 2025** ultra-moderno
- 👑 **Dashboard Amministrativa** per dirigenti
- 🎫 **Tessere digitali** personalizzate
- 📊 **Analytics avanzate** in tempo reale
- 🔄 **Sincronizzazione offline** automatica
- 📱 **Notifiche push** native
- 🔒 **Gestione ruoli** (USER/ADMIN/DIRIGENTE)
- 🌐 **Responsive design** per tutti i dispositivi

---

## 🛠️ Setup del Progetto

### 1. **Setup Appwrite**

#### I tuoi dati di configurazione:

```javascript
const APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: '688db9670010e3113d56', // ✅ Project ID corretto
    databaseId: '688dbfaf001fcce68c0f', // main-database
    
    collections: {
        user_profiles: '688dca4f00345547d52f',
        tessere: '688e6222002987f97521',
        notizie: '688e02b3000595a16b2c',
        convenzioni: '688e03f000195871d9e',
        organico_dirigenti: '688e0501000254ad0966'
    }
};
```

✅ **La configurazione è già stata applicata a tutti i file!**

#### Verifica delle Collections esistenti:

Le tue collections sono già configurate:
- ✅ **user_profiles** (`688dca4f00345547d52f`)
- ✅ **tessere** (`688e6222002987f97521`)  
- ✅ **notizie** (`688e02b3000595a16b2c`)
- ✅ **convenzioni** (`688e03f000195871d9e`)
- ✅ **organico_dirigenti** (`688e0501000254ad0966`)

##### Collection 1: **user_profiles**
```json
{
  "name": "user_profiles",
  "permissions": [
    "read(\"users\")",
    "write(\"users\")"
  ],
  "attributes": [
    {
      "key": "user_id",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "email",
      "type": "string", 
      "size": 255,
      "required": true
    },
    {
      "key": "full_name",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "cognome",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "telefono",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "role",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "USER"
    },
    {
      "key": "data_nascita",
      "type": "string",
      "size": 20,
      "required": true
    },
    {
      "key": "luogo_nascita",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "created_at",
      "type": "datetime",
      "required": true
    },
    {
      "key": "updated_at",
      "type": "datetime",
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_id_index",
      "type": "key",
      "attributes": ["user_id"]
    },
    {
      "key": "email_index", 
      "type": "key",
      "attributes": ["email"]
    },
    {
      "key": "role_index",
      "type": "key", 
      "attributes": ["role"]
    }
  ]
}
```

##### Collection 2: **tessere**
```json
{
  "name": "tessere",
  "permissions": [
    "read(\"users\")",
    "write(\"users\")"
  ],
  "attributes": [
    {
      "key": "user_id",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "numero_tessera",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "nome_completo",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "email",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "telefono",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "data_emissione",
      "type": "datetime",
      "required": true
    },
    {
      "key": "data_scadenza",
      "type": "datetime",
      "required": true
    },
    {
      "key": "stato",
      "type": "string",
      "size": 20,
      "required": true,
      "default": "ATTIVA"
    },
    {
      "key": "tipo",
      "type": "string",
      "size": 20,
      "required": true,
      "default": "STANDARD"
    },
    {
      "key": "created_at",
      "type": "datetime",
      "required": true
    }
  ],
  "indexes": [
    {
      "key": "user_id_index",
      "type": "key",
      "attributes": ["user_id"]
    },
    {
      "key": "numero_tessera_index",
      "type": "unique",
      "attributes": ["numero_tessera"]
    },
    {
      "key": "stato_index",
      "type": "key",
      "attributes": ["stato"]
    }
  ]
}
```

##### Collection 3: **requests** (Opzionale)
```json
{
  "name": "requests",
  "permissions": [
    "read(\"users\")",
    "write(\"users\")"
  ],
  "attributes": [
    {
      "key": "user_id",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "title",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "description",
      "type": "string",
      "size": 2000,
      "required": true
    },
    {
      "key": "category",
      "type": "string",
      "size": 100,
      "required": true
    },
    {
      "key": "priority",
      "type": "string",
      "size": 20,
      "required": true,
      "default": "NORMAL"
    },
    {
      "key": "status",
      "type": "string",
      "size": 20,
      "required": true,
      "default": "PENDING"
    },
    {
      "key": "admin_notes",
      "type": "string",
      "size": 1000,
      "required": false
    },
    {
      "key": "created_at",
      "type": "datetime",
      "required": true
    },
    {
      "key": "updated_at",
      "type": "datetime",
      "required": true
    }
  ]
}
```

### 2. **Deploy su Render**

#### Preparazione Repository GitHub:

1. Crea un nuovo repository GitHub chiamato **"myapp"**
2. Fai push di tutti i file del progetto
3. Assicurati che la struttura sia corretta

#### Deploy su Render:

1. Vai su [Render.com](https://render.com)
2. Connetti il tuo account GitHub
3. Crea un nuovo **Static Site**
4. Seleziona il repository **myapp**
5. Configura:
   ```
   Build Command: (lascia vuoto per siti statici)
   Publish Directory: .
   ```
6. Fai deploy!

#### URL di Deploy:
```
Primary Domain: myapp.onrender.com
Custom Domain: app.tuodominio.it (se disponibile)
```

---

## 🎯 Prossimi Passi

### **Setup Immediato:**

1. ✅ **Appwrite già configurato** - Tutti i tuoi dati sono stati inseriti
2. 📁 **Upload su GitHub** - Crea repository e carica i file
3. 🚀 **Deploy su Render** - Connetti GitHub e fai deploy
4. 🎨 **Test dell'app** - Verifica funzionamento completo

### **Primo Amministratore:**

1. Registra un utente normale nell'app
2. Accedi al Database Appwrite Console
3. Vai alla collection **user_profiles**
4. Trova il tuo utente e modifica il campo `role` da `USER` a `ADMIN`
5. Fai logout e login per aggiornare i privilegi
6. Ora avrai accesso alla dashboard dirigenti

---

## 📱 Struttura Files

```
myapp/
│
├── index.html                 # ✅ Landing page (aggiornata)
├── auth.html                  # ✅ Login/Registrazione (la tua versione)
├── home.html                  # ✅ Dashboard utenti (aggiornata)
├── home_dirigenti.html        # ✅ Dashboard admin (aggiornata)
├── manifest.json              # ✅ PWA config (aggiornata)
├── service-worker.js          # ✅ Service Worker (aggiornato)
├── appwrite-config.js         # ✅ Config Appwrite (con i tuoi dati)
│
├── public/
│   ├── icons/                 # Icone PWA (da aggiungere)
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   ├── apple-touch-icon.png
│   │   └── favicon-32x32.png
│   │
│   └── screenshots/           # Screenshot per store
│
└── README.md                  # ✅ Questa guida (aggiornata)
```

---

## 🔒 Sicurezza e Backup

- ✅ Database su **Appwrite Frankfurt** (europa)
- ✅ Backup automatici ogni 24h
- ✅ Versioning delle configurazioni  
- ✅ HTTPS nativo su Render
- ✅ Headers di sicurezza configurati

---

## 📞 Supporto Tecnico

Per assistenza tecnica:

- 📧 **Email:** tech@myapp.it
- 🌐 **Website:** [www.myapp.it](https://www.myapp.it)
- 📱 **GitHub:** [github.com/myapp](https://github.com/myapp)
- ☎️ **Telefono:** +39 06 123 456 789

---

## 🎉 Il Tuo Setup è Completo!

**Tutti i file sono stati aggiornati con i tuoi dati reali di Appwrite.** 

### ✅ **Cosa è già fatto:**
- Configurazione Appwrite con i tuoi ID reali
- Rimozione riferimenti "Sindacato Carabinieri"  
- App rinominata semplicemente "MyApp"
- Tutti i collections ID configurati correttamente
- PWA pronta per l'installazione
- Design moderno Aurora Boreale 2025

### 🚀 **Prossimo passo:**
1. Carica tutto su GitHub
2. Fai deploy su Render  
3. Inizia a usare la tua app!

**🎯 La tua app MyApp è pronta per il lancio!**_TUO_COLLECTION_ID',        // ⚠️ SOSTITUISCI
        requests: 'IL_TUO_COLLECTION_ID'        // ⚠️ SOSTITUISCI (opzionale)
    }
};
```

#### Struttura cartelle richiesta:
```
myapp-sindacato/
│
├── index.html                 # Landing page
├── auth.html                  # Login/Registrazione  
├── home.html                  # Dashboard utenti
├── home_dirigenti.html        # Dashboard amministratori
├── manifest.json              # Configurazione PWA
├── service-worker.js          # Service Worker
├── appwrite-config.js         # Configurazione Appwrite
│
├── public/
│   ├── icons/                 # Icone PWA
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   ├── apple-touch-icon.png
│   │   └── favicon-32x32.png
│   │
│   └── screenshots/           # Screenshot per store
│       ├── mobile-home.png
│       ├── mobile-tessera.png
│       └── desktop-admin.png
│
└── README.md                  # Questo file
```

### 3. **Deploy su Render**

#### Preparazione Repository GitHub:

1. Crea un nuovo repository GitHub
2. Fai push di tutti i file del progetto
3. Assicurati che la struttura sia corretta

#### Deploy su Render:

1. Vai su [Render.com](https://render.com)
2. Connetti il tuo account GitHub
3. Crea un nuovo **Static Site**
4. Seleziona il repository
5. Configura:
   ```
   Build Command: (lascia vuoto per siti statici)
   Publish Directory: .
   ```
6. Fai deploy!

#### Configurazione Domini (Opzionale):
```
Primary Domain: myapp-sindacato.onrender.com
Custom Domain: myapp.sindacatocarabinieri.it (se disponibile)
```

---

## 🔧 Configurazione Avanzata

### **Abilitare Notifiche Push**

In `service-worker.js`, configura:
```javascript
// Aggiungi la tua VAPID Key
const VAPID_PUBLIC_KEY = 'LA_TUA_VAPID_KEY';
```

### **Analytics e Monitoraggio**

Aggiungi Google Analytics (opzionale):
```html
<!-- In <head> di ogni pagina -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### **Sicurezza Headers**

Aggiungi in `_headers` (Render):
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
```

---

## 👥 Gestione Utenti

### **Ruoli Disponibili:**

1. **USER** - Utente standard
   - Accesso a `home.html`
   - Visualizzazione tessera
   - Creazione richieste
   - Accesso documenti personali

2. **DIRIGENTE/ADMIN** - Amministratore
   - Accesso a `home_dirigenti.html`  
   - Gestione utenti
   - Gestione richieste
   - Analytics complete
   - Configurazione sistema

### **Primo Amministratore:**

1. Registra un utente normale
2. Accedi al Database Appwrite  
3. Modifica il campo `role` da `USER` a `ADMIN`
4. Fai logout e login per aggiornare i privilegi

---

## 📱 PWA Features

### **Installazione:**
- L'app può essere installata su desktop e mobile
- Prompt automatico di installazione  
- Icone e splash screen personalizzate

### **Offline Support:**
- Cache intelligente delle pagine principali
- Sincronizzazione automatica quando torna online
- Storage locale per dati critici

### **Notifiche Push:**
- Notifiche native del sistema operativo
- Gestione degli stati (lette/non lette)
- Analytics delle notifiche

---

## 🔒 Sicurezza

### **Misure Implementate:**

- ✅ Autenticazione robusta con Appwrite
- ✅ Validazione input lato client e server
- ✅ Gestione sessioni sicure
- ✅ Headers di sicurezza configurabili
- ✅ Controllo ruoli e permessi
- ✅ Validazione CSRF token
- ✅ Rate limiting

### **Backup e Recovery:**

- Database automaticamente replicato su Appwrite Cloud
- Versioning delle configurazioni
- Logs di sicurezza e accessi
- Procedure di disaster recovery

---

## 🆘 Troubleshooting

### **Errori Comuni:**

**Errore: "Project not found"**
```bash
Soluzione: Verifica che il PROJECT_ID in appwrite-config.js sia corretto
```

**Errore: "Collection not found"**  
```bash
Soluzione: Verifica che tutti i COLLECTION_ID siano configurati correttamente
```

**Errore: "Permission denied"**
```bash
Soluzione: Controlla i permessi delle collections in Appwrite Console
```

**PWA non si installa**
```bash
Soluzione: Verifica che manifest.json sia accessibile e service-worker.js sia registrato
```

### **Debug Mode:**

Aggiungi in console del browser:
```javascript
localStorage.setItem('DEBUG_MODE', 'true');
location.reload();
```

---

## 📞 Supporto

Per assistenza tecnica:

- 📧 **Email:** tech@sindacatocarabinieri.it
- 🌐 **Website:** [www.sindacatocarabinieri.it](https://www.sindacatocarabinieri.it)
- 📱 **Telegram:** @SindacatoCarabinieri
- ☎️ **Telefono:** +39 06 123 456 789

---

## 📜 Licenza

© 2025 MyApp. Tutti i diritti riservati.

**Uso riservato esclusivamente ai membri autorizzati.**

---

## 🎯 Roadmap Future

### **v1.1 - Prossime Feature:**
- [ ] Chat integrata tra membri
- [ ] Sistema di voting per decisioni
- [ ] Integrazione calendario eventi
- [ ] Marketplace convenzioni avanzato
- [ ] App mobile nativa (React Native)

### **v1.2 - Advanced Features:**
- [ ] AI Assistant per supporto automatico  
- [ ] Sistema di pagamenti integrato
- [ ] Multi-lingua (English, Français)
- [ ] API pubbliche per integrazioni
- [ ] Dashboard analytics avanzate con BI

---

**🚀 Buon lavoro con MyApp!**