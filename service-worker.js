// ====================================
// SERVICE WORKER COMPLETAMENTE VUOTO
// MyApp Sindacato Carabinieri - v2.0
// ====================================

console.log('🧹 SW: Service Worker PULITO caricato - MyApp v2.0');
console.log('📝 SW: Modalità pass-through - NESSUNA cache attiva');

// ✅ VERSIONE
const SW_VERSION = '2.0';
const SW_NAME = 'myapp-clean-sw';

// 🚫 NESSUNA CACHE - TUTTO PASSA AL NETWORK
self.addEventListener('fetch', event => {
    // Semplicemente lascia passare tutte le richieste
    // Non facciamo NIENTE - nessuna cache, nessun problema
    console.log('🌐 SW: Pass-through request:', event.request.url);
});

// 📦 INSTALL EVENT
self.addEventListener('install', event => {
    console.log('🔧 SW: Install v' + SW_VERSION);
    
    // Skip waiting per attivare immediatamente
    self.skipWaiting();
});

// 🔄 ACTIVATE EVENT  
self.addEventListener('activate', event => {
    console.log('⚡ SW: Activate v' + SW_VERSION);
    
    event.waitUntil(
        // Elimina tutte le cache vecchie
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    console.log('🧹 SW: Eliminazione cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('✅ SW: Tutte le cache eliminate');
            // Prendi controllo di tutti i client
            return self.clients.claim();
        }).then(() => {
            console.log('👑 SW: Controllo clients acquisito');
        })
    );
});

// 📱 MESSAGE EVENT (per comunicazione con le pagine)
self.addEventListener('message', event => {
    console.log('📨 SW: Messaggio ricevuto:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⏭️ SW: Skip waiting richiesto');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION',
            version: SW_VERSION
        });
    }
});

// 🚫 ERROR HANDLING
self.addEventListener('error', event => {
    console.error('❌ SW: Errore Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ SW: Promise non gestita:', event.reason);
});

console.log('✅ SW: Service Worker pulito configurato');
console.log('🎯 SW: Ready - Nessuna cache, nessun problema!');