<<<<<<< HEAD
// server.js - Server chatbot per MyApp sindacale
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Errore: Configurazione Supabase mancante');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware di sicurezza
app.use(helmet({
    contentSecurityPolicy: false // Necessario per Render
}));

// CORS per la tua webapp
const allowedOrigins = [
    'https://myapp2026.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorizzato dal CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 30, // 30 richieste per IP ogni 15 minuti
    message: { 
        error: 'Troppi messaggi inviati. Riprova tra 15 minuti.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware di autenticazione
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Token di autenticazione mancante',
                code: 'AUTH_MISSING'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verifica il token con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ 
                error: 'Token non valido o scaduto',
                code: 'AUTH_INVALID'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Errore autenticazione:', error);
        res.status(401).json({ 
            error: 'Errore di autenticazione',
            code: 'AUTH_ERROR'
        });
    }
}

// Funzione per pulire messaggi
function sanitizeMessage(message) {
    if (typeof message !== 'string') {
        throw new Error('Il messaggio deve essere una stringa');
    }
    
    const cleaned = message.trim();
    
    if (cleaned.length === 0) {
        throw new Error('Il messaggio non può essere vuoto');
    }
    
    if (cleaned.length > 1000) {
        throw new Error('Il messaggio è troppo lungo (max 1000 caratteri)');
    }
    
    return cleaned;
}

// System prompt per Virgilio
const SYSTEM_PROMPT = `Sei Virgilio, assistente AI del Sindacato Carabinieri (SIM). 

COMPETENZE:
- Informazioni su CCNL, contratti, stipendi, ferie, permessi
- Diritti sindacali, procedure disciplinari, ricorsi
- Normative specifiche per Carabinieri
- Progressioni di carriera, concorsi interni

STILE:
- Professionale ma cordiale
- Risposte concise (max 200 parole)
- Esempi pratici quando possibile
- Se non sai qualcosa, ammettilo e indirizza al sindacato

IMPORTANTE:
- Non fornire consigli legali specifici
- Per casi complessi, rimanda ai dirigenti sindacali
- Mantieni sempre la riservatezza
- Non chiedere dati personali sensibili`;

// Endpoint principale chat
app.post('/api/chat', chatLimiter, authenticateUser, async (req, res) => {
    try {
        const { messages, model = 'gpt-4o-mini', max_tokens = 500, temperature = 0.7 } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: 'Formato messaggi non valido',
                code: 'INVALID_MESSAGES'
            });
        }

        // Valida e pulisce i messaggi
        const cleanMessages = messages.map(msg => ({
            role: msg.role,
            content: sanitizeMessage(msg.content)
        }));

        // Verifica che l'ultimo messaggio sia dell'utente
        const lastMessage = cleanMessages[cleanMessages.length - 1];
        if (lastMessage.role !== 'user') {
            return res.status(400).json({ 
                error: 'L\'ultimo messaggio deve essere dell\'utente',
                code: 'INVALID_LAST_MESSAGE'
            });
        }

        console.log(`💬 Chat da ${req.user.email}: "${lastMessage.content.substring(0, 50)}..."`);

        // Verifica chiave OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY non configurata');
            return res.status(500).json({ 
                error: 'Servizio temporaneamente non disponibile',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        // Chiamata OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...cleanMessages
                ],
                max_tokens: max_tokens,
                temperature: temperature,
                user: req.user.id
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('❌ Errore OpenAI:', errorData);
            
            if (openaiResponse.status === 401) {
                return res.status(500).json({ 
                    error: 'Configurazione API non valida',
                    code: 'API_CONFIG_ERROR'
                });
            }
            
            return res.status(500).json({ 
                error: 'Servizio AI temporaneamente non disponibile',
                code: 'AI_SERVICE_ERROR'
            });
        }

        const data = await openaiResponse.json();

        // Salva analytics (opzionale)
        try {
            await supabase.from('chat_analytics').insert({
                user_id: req.user.id,
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                model: model,
                created_at: new Date().toISOString()
            });
        } catch (analyticsError) {
            console.error('⚠️ Errore analytics:', analyticsError.message);
            // Non bloccare la risposta
        }

        console.log(`✅ Risposta inviata (${data.usage?.total_tokens || 0} tokens)`);
        res.json(data);

    } catch (error) {
        console.error('❌ Errore chat endpoint:', error);
        
        if (error.message.includes('caratteri') || error.message.includes('vuoto')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'VALIDATION_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Errore interno del server',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'MyApp Chatbot Server',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '1.0.0'
    });
});

// Endpoint test per verificare CORS
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server chatbot MyApp funzionante!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'MyApp Chatbot Server',
        status: 'running',
        endpoints: [
            'GET /api/health - Health check',
            'POST /api/chat - Chat endpoint (auth required)',
            'GET /api/test - Test CORS'
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint non trovato',
        code: 'NOT_FOUND'
    });
});

// Error handler globale
app.use((error, req, res, next) => {
    console.error('❌ Errore globale:', error);
    res.status(500).json({ 
        error: 'Errore interno del server',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

// Avvio server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MyApp Chatbot Server avviato!`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔐 CORS: ${allowedOrigins.join(', ')}`);
    console.log(`⚡ OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configurata' : '❌ Mancante'}`);
    console.log(`💾 Supabase: ${supabaseUrl ? '✅ Connesso' : '❌ Non configurato'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM ricevuto, chiusura server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT ricevuto, chiusura server...');
    process.exit(0);
});
=======
// server.js - Server chatbot per MyApp sindacale
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Errore: Configurazione Supabase mancante');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware di sicurezza
app.use(helmet({
    contentSecurityPolicy: false // Necessario per Render
}));

// CORS per la tua webapp
const allowedOrigins = [
    'https://myapp2026.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorizzato dal CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 30, // 30 richieste per IP ogni 15 minuti
    message: { 
        error: 'Troppi messaggi inviati. Riprova tra 15 minuti.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware di autenticazione
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Token di autenticazione mancante',
                code: 'AUTH_MISSING'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verifica il token con Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ 
                error: 'Token non valido o scaduto',
                code: 'AUTH_INVALID'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Errore autenticazione:', error);
        res.status(401).json({ 
            error: 'Errore di autenticazione',
            code: 'AUTH_ERROR'
        });
    }
}

// Funzione per pulire messaggi
function sanitizeMessage(message) {
    if (typeof message !== 'string') {
        throw new Error('Il messaggio deve essere una stringa');
    }
    
    const cleaned = message.trim();
    
    if (cleaned.length === 0) {
        throw new Error('Il messaggio non può essere vuoto');
    }
    
    if (cleaned.length > 1000) {
        throw new Error('Il messaggio è troppo lungo (max 1000 caratteri)');
    }
    
    return cleaned;
}

// System prompt per Virgilio
const SYSTEM_PROMPT = `Sei Virgilio, assistente AI del Sindacato Carabinieri (SIM). 

COMPETENZE:
- Informazioni su CCNL, contratti, stipendi, ferie, permessi
- Diritti sindacali, procedure disciplinari, ricorsi
- Normative specifiche per Carabinieri
- Progressioni di carriera, concorsi interni

STILE:
- Professionale ma cordiale
- Risposte concise (max 200 parole)
- Esempi pratici quando possibile
- Se non sai qualcosa, ammettilo e indirizza al sindacato

IMPORTANTE:
- Non fornire consigli legali specifici
- Per casi complessi, rimanda ai dirigenti sindacali
- Mantieni sempre la riservatezza
- Non chiedere dati personali sensibili`;

// Endpoint principale chat
app.post('/api/chat', chatLimiter, authenticateUser, async (req, res) => {
    try {
        const { messages, model = 'gpt-4o-mini', max_tokens = 500, temperature = 0.7 } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: 'Formato messaggi non valido',
                code: 'INVALID_MESSAGES'
            });
        }

        // Valida e pulisce i messaggi
        const cleanMessages = messages.map(msg => ({
            role: msg.role,
            content: sanitizeMessage(msg.content)
        }));

        // Verifica che l'ultimo messaggio sia dell'utente
        const lastMessage = cleanMessages[cleanMessages.length - 1];
        if (lastMessage.role !== 'user') {
            return res.status(400).json({ 
                error: 'L\'ultimo messaggio deve essere dell\'utente',
                code: 'INVALID_LAST_MESSAGE'
            });
        }

        console.log(`💬 Chat da ${req.user.email}: "${lastMessage.content.substring(0, 50)}..."`);

        // Verifica chiave OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY non configurata');
            return res.status(500).json({ 
                error: 'Servizio temporaneamente non disponibile',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        // Chiamata OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...cleanMessages
                ],
                max_tokens: max_tokens,
                temperature: temperature,
                user: req.user.id
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('❌ Errore OpenAI:', errorData);
            
            if (openaiResponse.status === 401) {
                return res.status(500).json({ 
                    error: 'Configurazione API non valida',
                    code: 'API_CONFIG_ERROR'
                });
            }
            
            return res.status(500).json({ 
                error: 'Servizio AI temporaneamente non disponibile',
                code: 'AI_SERVICE_ERROR'
            });
        }

        const data = await openaiResponse.json();

        // Salva analytics (opzionale)
        try {
            await supabase.from('chat_analytics').insert({
                user_id: req.user.id,
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                model: model,
                created_at: new Date().toISOString()
            });
        } catch (analyticsError) {
            console.error('⚠️ Errore analytics:', analyticsError.message);
            // Non bloccare la risposta
        }

        console.log(`✅ Risposta inviata (${data.usage?.total_tokens || 0} tokens)`);
        res.json(data);

    } catch (error) {
        console.error('❌ Errore chat endpoint:', error);
        
        if (error.message.includes('caratteri') || error.message.includes('vuoto')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'VALIDATION_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Errore interno del server',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'MyApp Chatbot Server',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '1.0.0'
    });
});

// Endpoint test per verificare CORS
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server chatbot MyApp funzionante!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'MyApp Chatbot Server',
        status: 'running',
        endpoints: [
            'GET /api/health - Health check',
            'POST /api/chat - Chat endpoint (auth required)',
            'GET /api/test - Test CORS'
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint non trovato',
        code: 'NOT_FOUND'
    });
});

// Error handler globale
app.use((error, req, res, next) => {
    console.error('❌ Errore globale:', error);
    res.status(500).json({ 
        error: 'Errore interno del server',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

// Avvio server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MyApp Chatbot Server avviato!`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔐 CORS: ${allowedOrigins.join(', ')}`);
    console.log(`⚡ OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configurata' : '❌ Mancante'}`);
    console.log(`💾 Supabase: ${supabaseUrl ? '✅ Connesso' : '❌ Non configurato'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM ricevuto, chiusura server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT ricevuto, chiusura server...');
    process.exit(0);
});
>>>>>>> d1411ea201200f1b013f73c51a7ac06efbd69d16
