// =====================================================
// CONFIGURAZIONE APPWRITE CENTRALIZZATA - MyApp v2.0
// =====================================================

console.log('🔧 Caricamento configurazione Appwrite centralizzata...');

// 🌐 CONFIGURAZIONE PRINCIPALE
const APPWRITE_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: '688db9670010e3113d56',
    databaseId: '688dbfaf001fcce68c0f',
    
    // 📁 COLLECTIONS (i tuoi ID reali)
    collections: {
        user_profiles: '688dca4f00345547d52f',
        tessere: '688e6222002987f97521',
        notizie: '688e02b3000595a16b2c',
        convenzioni: '688e03f000195871d9e',
        organico_dirigenti: '688e0501000254ad0966',
        richieste: '688e6222002987f97521' // Placeholder
    },
    
    // 🗂️ STORAGE BUCKETS (da configurare se necessari)
    buckets: {
        documents: 'documents-bucket',
        images: 'images-bucket',
        tessere: 'tessere-bucket'
    }
};

// 🚀 CLIENT GLOBALI
let appwriteClient = null;
let appwriteAccount = null;
let appwriteDatabases = null;
let appwriteStorage = null;

// 🔧 INIZIALIZZAZIONE
function initializeAppwrite() {
    try {
        if (typeof Appwrite === 'undefined') {
            console.error('❌ Appwrite SDK non disponibile');
            return false;
        }
        
        const { Client, Account, Databases, Storage } = Appwrite;
        
        // Inizializza client
        appwriteClient = new Client()
            .setEndpoint(APPWRITE_CONFIG.endpoint)
            .setProject(APPWRITE_CONFIG.projectId);
        
        // Inizializza servizi
        appwriteAccount = new Account(appwriteClient);
        appwriteDatabases = new Databases(appwriteClient);
        appwriteStorage = new Storage(appwriteClient);
        
        console.log('✅ Appwrite inizializzato:', {
            endpoint: APPWRITE_CONFIG.endpoint,
            project: APPWRITE_CONFIG.projectId,
            database: APPWRITE_CONFIG.databaseId
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore inizializzazione Appwrite:', error);
        return false;
    }
}

// 👤 USER MANAGER CENTRALIZZATO
const AppwriteUserManager = {
    // Get current user
    getCurrentUser: async () => {
        try {
            return await appwriteAccount.get();
        } catch (error) {
            console.error('❌ Errore recupero utente:', error);
            throw error;
        }
    },

    // Get user profile
    getUserProfile: async (userId) => {
        try {
            const { Query } = Appwrite;
            const response = await appwriteDatabases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.user_profiles,
                [Query.equal('user_id', userId)]
            );
            
            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error('❌ Errore caricamento profilo:', error);
            throw error;
        }
    },

    // Get user tessera
    getUserTessera: async (userId) => {
        try {
            const { Query } = Appwrite;
            const response = await appwriteDatabases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tessere,
                [Query.equal('user_id', userId)]
            );
            
            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error('❌ Errore caricamento tessera:', error);
            throw error;
        }
    },

    // Create user profile
    createUserProfile: async (userData, userId) => {
        try {
            const { ID } = Appwrite;
            
            const profileData = {
                user_id: userId,
                email: userData.email,
                full_name: `${userData.nome} ${userData.cognome || ''}`.trim(),
                cognome: userData.cognome || '',
                telefono: userData.telefono || '',
                role: 'USER',
                data_nascita: userData.data_nascita || '',
                luogo_nascita: userData.luogo_nascita || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            return await appwriteDatabases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.user_profiles,
                ID.unique(),
                profileData
            );
        } catch (error) {
            console.error('❌ Errore creazione profilo:', error);
            throw error;
        }
    },

    // Create tessera
    createTessera: async (userId, profileData) => {
        try {
            const { ID } = Appwrite;
            
            const year = new Date().getFullYear();
            const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            
            const tesseraData = {
                user_id: userId,
                numero_tessera: `MA${year}${random}`,
                nome_completo: profileData.full_name,
                email: profileData.email,
                telefono: profileData.telefono,
                data_emissione: new Date().toISOString(),
                data_scadenza: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                stato: 'ATTIVA',
                tipo: 'STANDARD',
                created_at: new Date().toISOString()
            };
            
            return await appwriteDatabases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tessere,
                ID.unique(),
                tesseraData
            );
        } catch (error) {
            console.error('❌ Errore creazione tessera:', error);
            throw error;
        }
    },

    // Login
    login: async (email, password) => {
        try {
            return await appwriteAccount.createEmailPasswordSession(email, password);
        } catch (error) {
            console.error('❌ Errore login:', error);
            throw error;
        }
    },

    // Register
    register: async (userData) => {
        try {
            const { ID } = Appwrite;
            
            // Create account
            const user = await appwriteAccount.create(
                ID.unique(),
                userData.email,
                userData.password,
                `${userData.nome} ${userData.cognome || ''}`
            );
            
            // Auto login
            await appwriteAccount.createEmailPasswordSession(userData.email, userData.password);
            
            // Create profile
            const profile = await AppwriteUserManager.createUserProfile(userData, user.$id);
            
            // Create tessera
            const tessera = await AppwriteUserManager.createTessera(user.$id, profile);
            
            return { user, profile, tessera };
        } catch (error) {
            console.error('❌ Errore registrazione:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            await appwriteAccount.deleteSession('current');
        } catch (error) {
            console.error('❌ Errore logout:', error);
            throw error;
        }
    },

    // Check admin role
    isAdmin: async (userId) => {
        try {
            const profile = await AppwriteUserManager.getUserProfile(userId);
            const role = profile?.role?.toUpperCase();
            return role === 'ADMIN' || role === 'DIRIGENTE';
        } catch (error) {
            console.error('❌ Errore verifica admin:', error);
            return false;
        }
    }
};

// 📊 DATA MANAGER CENTRALIZZATO
const AppwriteDataManager = {
    // Get all users (admin only)
    getAllUsers: async (limit = 100) => {
        try {
            const { Query } = Appwrite;
            const response = await appwriteDatabases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.user_profiles,
                [Query.limit(limit), Query.orderDesc('created_at')]
            );
            return response.documents;
        } catch (error) {
            console.error('❌ Errore caricamento utenti:', error);
            throw error;
        }
    },

    // Get all tessere (admin only)
    getAllTessere: async (limit = 100) => {
        try {
            const { Query } = Appwrite;
            const response = await appwriteDatabases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.tessere,
                [Query.limit(limit), Query.orderDesc('created_at')]
            );
            return response.documents;
        } catch (error) {
            console.error('❌ Errore caricamento tessere:', error);
            throw error;
        }
    },

    // Create request
    createRequest: async (requestData) => {
        try {
            const { ID } = Appwrite;
            const data = {
                ...requestData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'PENDING'
            };
            
            return await appwriteDatabases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.richieste,
                ID.unique(),
                data
            );
        } catch (error) {
            console.error('❌ Errore creazione richiesta:', error);
            throw error;
        }
    },

    // Update document
    updateDocument: async (collectionId, documentId, data) => {
        try {
            return await appwriteDatabases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                collectionId,
                documentId,
                {
                    ...data,
                    updated_at: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('❌ Errore aggiornamento documento:', error);
            throw error;
        }
    }
};

// 🛠️ UTILITY FUNCTIONS
const AppwriteUtils = {
    // Format date for Italian locale
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
    },

    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    // Get initials from name
    getInitials: (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    // Safe redirect with loop prevention
    safeRedirect: (url, delay = 1500) => {
        console.log(`🔄 Redirect programmato a: ${url} tra ${delay}ms`);
        
        // Prevent loops
        if (window.isRedirecting) {
            console.warn('⚠️ Redirect già in corso, skip');
            return;
        }
        
        window.isRedirecting = true;
        
        setTimeout(() => {
            console.log(`🎯 Eseguendo redirect a: ${url}`);
            window.location.href = url;
        }, delay);
    },

    // Show toast notification
    showToast: (message, type = 'info', duration = 5000) => {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        toast.classList.add(...styles[type].split(' '));
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${icon} ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white opacity-75 hover:opacity-100">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    },

    // Check connection
    checkConnection: async () => {
        try {
            const response = await fetch(APPWRITE_CONFIG.endpoint + '/health');
            return response.ok;
        } catch (error) {
            console.error('❌ Errore connessione:', error);
            return false;
        }
    },

    // Validate email
    isValidEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate phone
    isValidPhone: (phone) => {
        return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    // Emergency cleanup
    emergencyCleanup: async () => {
        console.log('🚨 Emergency cleanup in corso...');
        
        try {
            // 1. Logout from Appwrite
            if (appwriteAccount) {
                try {
                    await appwriteAccount.deleteSession('current');
                    console.log('✅ Sessione Appwrite eliminata');
                } catch (e) {
                    console.log('ℹ️ Nessuna sessione Appwrite');
                }
            }
            
            // 2. Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // 3. Clear cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // 4. Clear Appwrite specific cookies
            const appwriteCookies = [
                'appwrite-session',
                'a_session_console',
                'a_session_console_legacy',
                'cookieFallback'
            ];
            
            appwriteCookies.forEach(cookieName => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.fra.cloud.appwrite.io`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
            // 5. Clear caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            console.log('✅ Emergency cleanup completato');
            return true;
            
        } catch (error) {
            console.error('❌ Errore emergency cleanup:', error);
            return false;
        }
    }
};

// 🚀 AUTO-INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, inizializzazione Appwrite...');
    
    if (!initializeAppwrite()) {
        console.error('❌ Impossibile inizializzare Appwrite');
        AppwriteUtils.showToast('Errore configurazione Appwrite', 'error');
    } else {
        console.log('✅ Appwrite configurato e pronto');
    }
});

// 📤 EXPORT GLOBALE
window.APPWRITE_CONFIG = APPWRITE_CONFIG;
window.AppwriteUserManager = AppwriteUserManager;
window.AppwriteDataManager = AppwriteDataManager;
window.AppwriteUtils = AppwriteUtils;

// Shortcut per facilità d'uso
window.appwrite = {
    client: () => appwriteClient,
    account: () => appwriteAccount,
    databases: () => appwriteDatabases,
    storage: () => appwriteStorage,
    config: APPWRITE_CONFIG
};

console.log('🔧 Configurazione Appwrite centralizzata caricata - MyApp v2.0');
console.log('🎯 Stato: PRONTO per autenticazione');

// 🔄 HEALTH CHECK AUTOMATICO
setTimeout(async () => {
    const isConnected = await AppwriteUtils.checkConnection();
    if (isConnected) {
        console.log('✅ Health check: Appwrite raggiungibile');
    } else {
        console.warn('⚠️ Health check: Problemi di connessione Appwrite');
    }
}, 2000);