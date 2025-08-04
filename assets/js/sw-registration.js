/**
 * Service Worker Registration & Management
 * Gestisce registrazione, aggiornamenti e comunicazione con SW
 */

class ServiceWorkerManager {
    constructor() {
        this.swRegistration = null;
        this.updateAvailable = false;
        this.refreshing = false;
        
        this.init();
    }

    async init() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SW] Service Worker not supported');
            return;
        }

        try {
            await this.registerServiceWorker();
            this.setupUpdateHandling();
            this.setupMessageHandling();
        } catch (error) {
            console.error('[SW] Initialization failed:', error);
        }
    }

    async registerServiceWorker() {
        try {
            console.log('[SW] Registering Service Worker...');
            
            this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/',
                updateViaCache: 'none' // Always check for updates
            });

            console.log('[SW] Service Worker registered successfully:', this.swRegistration.scope);

            // Check for updates immediately
            this.swRegistration.addEventListener('updatefound', () => {
                this.handleUpdateFound();
            });

            // If there's already an active SW, check for updates
            if (this.swRegistration.active) {
                this.checkForUpdates();
            }

        } catch (error) {
            console.error('[SW] Service Worker registration failed:', error);
        }
    }

    setupUpdateHandling() {
        // Listen for controlling SW changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (this.refreshing) return;
            console.log('[SW] New Service Worker took control');
            this.refreshing = true;
            window.location.reload();
        });

        // Check for updates periodically (every 5 minutes)
        setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);

        // Check for updates when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    setupMessageHandling() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleSWMessage(event.data);
        });
    }

    handleUpdateFound() {
        const newWorker = this.swRegistration.installing;
        
        if (!newWorker) return;

        console.log('[SW] New Service Worker installing...');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New update available
                    console.log('[SW] New content available');
                    this.updateAvailable = true;
                    this.showUpdatePrompt();
                } else {
                    // First install
                    console.log('[SW] Content cached for offline use');
                    this.showOfflineReady();
                }
            }
        });
    }

    handleSWMessage(data) {
        console.log('[SW] Message from Service Worker:', data);

        switch (data.type) {
            case 'UPDATE_AVAILABLE':
                this.showUpdatePrompt();
                break;
                
            case 'CACHE_UPDATED':
                this.showCacheUpdated();
                break;
                
            case 'OFFLINE_READY':
                this.showOfflineReady();
                break;
                
            case 'VERSION_INFO':
                console.log('[SW] Service Worker version:', data.version);
                break;
        }
    }

    async checkForUpdates() {
        if (!this.swRegistration) return;

        try {
            await this.swRegistration.update();
        } catch (error) {
            console.error('[SW] Update check failed:', error);
        }
    }

    async skipWaiting() {
        if (!this.swRegistration?.waiting) return;

        console.log('[SW] Skipping waiting...');
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    showUpdatePrompt() {
        // Don't show if already showing or if disabled
        if (document.getElementById('sw-update-prompt') || 
            localStorage.getItem('sw-updates-disabled') === 'true') {
            return;
        }

        const promptHTML = `
            <div id="sw-update-prompt" class="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg z-50 max-w-md mx-auto transform translate-y-full transition-transform duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-sm">Nuova versione disponibile</h3>
                            <p class="text-xs opacity-90">Aggiornamenti e miglioramenti</p>
                        </div>
                    </div>
                    <button id="sw-update-close" class="text-white opacity-70 hover:opacity-100 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="flex space-x-2">
                    <button id="sw-update-install" class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                        🔄 Aggiorna ora
                    </button>
                    <button id="sw-update-later" class="px-4 py-2 text-white opacity-70 hover:opacity-100 text-sm transition-opacity">
                        Più tardi
                    </button>
                </div>
                <div class="mt-2">
                    <label class="flex items-center space-x-2 text-xs opacity-75">
                        <input type="checkbox" id="sw-updates-disable" class="rounded">
                        <span>Non mostrare più aggiornamenti automatici</span>
                    </label>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', promptHTML);

        const prompt = document.getElementById('sw-update-prompt');
        const installBtn = document.getElementById('sw-update-install');
        const laterBtn = document.getElementById('sw-update-later');
        const closeBtn = document.getElementById('sw-update-close');
        const disableCheckbox = document.getElementById('sw-updates-disable');

        // Show prompt
        setTimeout(() => {
            prompt.classList.remove('translate-y-full');
        }, 100);

        // Install update
        installBtn.addEventListener('click', async () => {
            installBtn.disabled = true;
            installBtn.innerHTML = '<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"></div> Aggiornando...';
            
            await this.skipWaiting();
            this.hideUpdatePrompt();
        });

        // Later
        laterBtn.addEventListener('click', () => {
            this.hideUpdatePrompt();
        });

        // Close
        closeBtn.addEventListener('click', () => {
            this.hideUpdatePrompt();
        });

        // Disable future updates
        disableCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('sw-updates-disabled', 'true');
            } else {
                localStorage.removeItem('sw-updates-disabled');
            }
        });

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                this.hideUpdatePrompt();
            }
        }, 30000);
    }

    hideUpdatePrompt() {
        const prompt = document.getElementById('sw-update-prompt');
        if (prompt) {
            prompt.classList.add('translate-y-full');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    showOfflineReady() {
        this.showToast('📱 App pronta per uso offline!', 'success');
    }

    showCacheUpdated() {
        this.showToast('✅ Contenuti aggiornati', 'info');
    }

    showToast(message, type = 'info') {
        const toastHTML = `
            <div id="sw-toast-${Date.now()}" class="fixed top-4 left-4 right-4 p-3 rounded-lg shadow-lg z-50 max-w-md mx-auto transform -translate-y-full transition-transform duration-300 ${this.getToastClasses(type)}">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">${message}</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toast = document.body.lastElementChild;

        // Show toast
        setTimeout(() => {
            toast.classList.remove('-translate-y-full');
        }, 100);

        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.add('-translate-y-full');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    getToastClasses(type) {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-black';
            default:
                return 'bg-blue-500 text-white';
        }
    }

    // Public API methods
    async sendMessage(message) {
        if (!navigator.serviceWorker.controller) return;
        
        navigator.serviceWorker.controller.postMessage(message);
    }

    async getVersion() {
        return new Promise((resolve) => {
            if (!navigator.serviceWorker.controller) {
                resolve(null);
                return;
            }

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.version);
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_VERSION' },
                [messageChannel.port2]
            );
        });
    }

    async cacheUrls(urls) {
        await this.sendMessage({
            type: 'CACHE_URLS',
            urls: urls
        });
    }

    async clearCache() {
        await this.sendMessage({
            type: 'CLEAR_CACHE'
        });
        
        this.showToast('🗑️ Cache pulita', 'info');
    }

    // Connection monitoring
    setupConnectionMonitoring() {
        const updateOnlineStatus = () => {
            const status = navigator.onLine ? 'online' : 'offline';
            document.body.dataset.connectionStatus = status;
            
            if (navigator.onLine) {
                this.showToast('🌐 Connessione ripristinata', 'success');
                // Sync any pending data
                this.sendMessage({ type: 'SYNC_PENDING' });
            } else {
                this.showToast('📴 Modalità offline attivata', 'warning');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial status
        updateOnlineStatus();
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        // Monitor cache hit rates
        let cacheHits = 0;
        let cacheMisses = 0;

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;
                
                // Check if served from cache (heuristic)
                if (duration < 50) {
                    cacheHits++;
                } else {
                    cacheMisses++;
                }

                return response;
            } catch (error) {
                cacheMisses++;
                throw error;
            }
        };

        // Log cache performance every 5 minutes
        setInterval(() => {
            const total = cacheHits + cacheMisses;
            if (total > 0) {
                const hitRate = (cacheHits / total * 100).toFixed(1);
                console.log(`[SW] Cache hit rate: ${hitRate}% (${cacheHits}/${total})`);
                
                // Reset counters
                cacheHits = 0;
                cacheMisses = 0;
            }
        }, 5 * 60 * 1000);
    }

    // Enable/disable update notifications
    setUpdateNotifications(enabled) {
        if (enabled) {
            localStorage.removeItem('sw-updates-disabled');
        } else {
            localStorage.setItem('sw-updates-disabled', 'true');
        }
    }

    // Get registration info
    getRegistrationInfo() {
        if (!this.swRegistration) return null;

        return {
            scope: this.swRegistration.scope,
            updateViaCache: this.swRegistration.updateViaCache,
            active: !!this.swRegistration.active,
            waiting: !!this.swRegistration.waiting,
            installing: !!this.swRegistration.installing,
            updateAvailable: this.updateAvailable
        };
    }
}

// Initialize Service Worker Manager
let swManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        swManager = new ServiceWorkerManager();
    });
} else {
    swManager = new ServiceWorkerManager();
}

// Export for global use
window.ServiceWorkerManager = ServiceWorkerManager;
window.swManager = swManager;