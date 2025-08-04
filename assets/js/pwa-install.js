/**
 * PWA Installation Manager
 * Gestisce l'installazione dell'app come PWA con UX ottimizzata
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installButton = null;
        this.dismissButton = null;
        this.installBanner = null;
        
        this.init();
    }

    init() {
        // Check if already installed
        this.checkInstallStatus();
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', (e) => {
            console.log('[PWA] App installed successfully');
            this.onAppInstalled();
        });

        // Create install UI
        this.createInstallUI();
        
        // Check if should show install prompt
        setTimeout(() => {
            this.checkShouldShowPrompt();
        }, 5000); // Show after 5 seconds
    }

    checkInstallStatus() {
        // Check if running as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                          || window.navigator.standalone 
                          || document.referrer.includes('android-app://');

        this.isInstalled = isStandalone;
        
        if (this.isInstalled) {
            console.log('[PWA] App is running as PWA');
            document.body.classList.add('pwa-installed');
        }
    }

    checkShouldShowPrompt() {
        // Don't show if already installed
        if (this.isInstalled) return;
        
        // Don't show if user dismissed recently
        const dismissedTime = localStorage.getItem('pwa-install-dismissed');
        if (dismissedTime) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return; // Wait 7 days
        }
        
        // Don't show if user visited less than 3 times
        const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0') + 1;
        localStorage.setItem('pwa-visit-count', visitCount.toString());
        
        if (visitCount >= 3 && this.deferredPrompt) {
            this.showInstallBanner();
        }
    }

    createInstallUI() {
        // Create install banner HTML
        const bannerHTML = `
            <div id="pwa-install-banner" class="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-xl shadow-lg transform translate-y-full transition-transform duration-300 z-50 max-w-md mx-auto">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <span class="text-xl">📱</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-sm">Installa MyApp</h3>
                            <p class="text-xs opacity-90">Accesso rapido e offline</p>
                        </div>
                    </div>
                    <button id="pwa-install-close" class="text-white opacity-70 hover:opacity-100 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="flex space-x-2">
                    <button id="pwa-install-button" class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                        ⬇️ Installa
                    </button>
                    <button id="pwa-install-dismiss" class="px-4 py-2 text-white opacity-70 hover:opacity-100 text-sm transition-opacity">
                        Non ora
                    </button>
                </div>
            </div>
        `;

        // Add banner to body
        document.body.insertAdjacentHTML('beforeend', bannerHTML);

        // Get references
        this.installBanner = document.getElementById('pwa-install-banner');
        this.installButton = document.getElementById('pwa-install-button');
        this.dismissButton = document.getElementById('pwa-install-dismiss');
        const closeButton = document.getElementById('pwa-install-close');

        // Add event listeners
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installApp());
        }

        if (this.dismissButton) {
            this.dismissButton.addEventListener('click', () => this.dismissInstallPrompt());
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.dismissInstallPrompt());
        }
    }

    showInstallBanner() {
        if (!this.installBanner || this.isInstalled) return;
        
        console.log('[PWA] Showing install banner');
        
        // Show banner with animation
        this.installBanner.classList.remove('translate-y-full');
        this.installBanner.classList.add('translate-y-0');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideInstallBanner();
        }, 10000);
    }

    hideInstallBanner() {
        if (!this.installBanner) return;
        
        this.installBanner.classList.add('translate-y-full');
        this.installBanner.classList.remove('translate-y-0');
    }

    showInstallPrompt() {
        // Can show the deferred prompt
        this.showInstallBanner();
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return;
        }

        try {
            // Show install prompt
            this.deferredPrompt.prompt();

            // Wait for user choice
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('[PWA] Install prompt result:', outcome);

            if (outcome === 'accepted') {
                this.onInstallAccepted();
            } else {
                this.onInstallDismissed();
            }

        } catch (error) {
            console.error('[PWA] Install failed:', error);
        } finally {
            this.deferredPrompt = null;
            this.hideInstallBanner();
        }
    }

    dismissInstallPrompt() {
        this.hideInstallBanner();
        this.onInstallDismissed();
    }

    onInstallAccepted() {
        console.log('[PWA] User accepted install');
        
        // Track installation
        this.trackEvent('pwa_install_accepted');
        
        // Show success message
        this.showInstallSuccessMessage();
    }

    onInstallDismissed() {
        console.log('[PWA] User dismissed install');
        
        // Store dismissal time
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        
        // Track dismissal
        this.trackEvent('pwa_install_dismissed');
    }

    onAppInstalled() {
        this.isInstalled = true;
        document.body.classList.add('pwa-installed');
        
        // Hide banner if visible
        this.hideInstallBanner();
        
        // Track successful installation
        this.trackEvent('pwa_installed');
        
        // Show welcome message
        this.showWelcomeMessage();
        
        // Clear stored data
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('pwa-visit-count');
    }

    showInstallSuccessMessage() {
        const messageHTML = `
            <div id="pwa-success-message" class="fixed top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto transform -translate-y-full transition-transform duration-300">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-semibold">Installazione in corso...</h3>
                        <p class="text-sm opacity-90">MyApp sarà disponibile nella home</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', messageHTML);
        const message = document.getElementById('pwa-success-message');
        
        // Show message
        setTimeout(() => {
            message.classList.remove('-translate-y-full');
        }, 100);

        // Hide after 5 seconds
        setTimeout(() => {
            message.classList.add('-translate-y-full');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    showWelcomeMessage() {
        const messageHTML = `
            <div id="pwa-welcome-message" class="fixed top-4 left-4 right-4 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto transform -translate-y-full transition-transform duration-300">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <span class="text-xl">🎉</span>
                    </div>
                    <div>
                        <h3 class="font-bold">Benvenuto in MyApp!</h3>
                        <p class="text-sm opacity-90">App installata con successo</p>
                    </div>
                </div>
                <div class="mt-3 p-2 bg-white bg-opacity-10 rounded text-xs">
                    💡 Ora puoi accedere rapidamente da home screen anche offline!
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', messageHTML);
        const message = document.getElementById('pwa-welcome-message');
        
        // Show message
        setTimeout(() => {
            message.classList.remove('-translate-y-full');
        }, 100);

        // Hide after 8 seconds
        setTimeout(() => {
            message.classList.add('-translate-y-full');
            setTimeout(() => message.remove(), 300);
        }, 8000);
    }

    // Manual install trigger (for buttons in UI)
    createInstallButton(selector) {
        const button = document.querySelector(selector);
        if (!button) return;

        button.addEventListener('click', () => {
            if (this.deferredPrompt) {
                this.installApp();
            } else {
                this.showInstallInstructions();
            }
        });

        // Show/hide based on install status
        if (this.isInstalled) {
            button.style.display = 'none';
        }
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="text-center">
                    <h3 class="font-bold mb-3">📱 Installa MyApp su iOS</h3>
                    <div class="space-y-2 text-sm">
                        <p>1. Tocca il pulsante "Condividi" ⬆️</p>
                        <p>2. Scorri e seleziona "Aggiungi alla schermata Home" 📲</p>
                        <p>3. Tocca "Aggiungi" per completare</p>
                    </div>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="text-center">
                    <h3 class="font-bold mb-3">📱 Installa MyApp su Android</h3>
                    <div class="space-y-2 text-sm">
                        <p>1. Tocca il menu del browser (⋮)</p>
                        <p>2. Seleziona "Installa app" o "Aggiungi alla home" 📲</p>
                        <p>3. Conferma l'installazione</p>
                    </div>
                </div>
            `;
        } else {
            instructions = `
                <div class="text-center">
                    <h3 class="font-bold mb-3">💻 Installa MyApp su Desktop</h3>
                    <div class="space-y-2 text-sm">
                        <p>1. Cerca l'icona "Installa" nella barra degli indirizzi 📥</p>
                        <p>2. Clicca su "Installa MyApp"</p>
                        <p>3. L'app sarà disponibile nel menu Start</p>
                    </div>
                </div>
            `;
        }

        this.showModal(instructions);
    }

    showModal(content) {
        const modalHTML = `
            <div id="pwa-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-xl p-6 max-w-sm w-full transform scale-95 transition-transform duration-200">
                    ${content}
                    <button id="pwa-modal-close" class="mt-4 w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold">
                        Ho capito
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('pwa-modal');
        const closeBtn = document.getElementById('pwa-modal-close');

        // Show modal
        setTimeout(() => {
            modal.querySelector('.bg-white').classList.remove('scale-95');
            modal.querySelector('.bg-white').classList.add('scale-100');
        }, 50);

        // Close modal
        const closeModal = () => {
            modal.querySelector('.bg-white').classList.add('scale-95');
            setTimeout(() => modal.remove(), 200);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Update notification when app updates are available
    handleAppUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showUpdateAvailable();
            });
        }
    }

    showUpdateAvailable() {
        const updateHTML = `
            <div id="pwa-update-banner" class="fixed top-4 left-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto transform -translate-y-full transition-transform duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span class="text-lg">🔄</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-sm">Aggiornamento disponibile</h3>
                            <p class="text-xs opacity-90">Nuove funzionalità e miglioramenti</p>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button id="pwa-update-button" class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                        ⬆️ Aggiorna ora
                    </button>
                    <button id="pwa-update-dismiss" class="px-4 py-2 text-white opacity-70 hover:opacity-100 text-sm transition-opacity">
                        Più tardi
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', updateHTML);
        const banner = document.getElementById('pwa-update-banner');
        const updateBtn = document.getElementById('pwa-update-button');
        const dismissBtn = document.getElementById('pwa-update-dismiss');

        // Show banner
        setTimeout(() => {
            banner.classList.remove('-translate-y-full');
        }, 100);

        // Handle update
        updateBtn.addEventListener('click', () => {
            window.location.reload();
        });

        // Handle dismiss
        dismissBtn.addEventListener('click', () => {
            banner.classList.add('-translate-y-full');
            setTimeout(() => banner.remove(), 300);
        });

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.classList.add('-translate-y-full');
                setTimeout(() => banner.remove(), 300);
            }
        }, 15000);
    }

    // Analytics tracking
    trackEvent(eventName, properties = {}) {
        try {
            // Integrate with your analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, properties);
            }
            
            console.log('[PWA] Track event:', eventName, properties);
        } catch (error) {
            console.error('[PWA] Analytics error:', error);
        }
    }

    // Check for updates periodically
    startUpdateCheck() {
        setInterval(() => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
            }
        }, 60000); // Check every minute
    }

    // Get install stats
    getInstallStats() {
        return {
            isInstalled: this.isInstalled,
            visitCount: parseInt(localStorage.getItem('pwa-visit-count') || '0'),
            dismissedTime: localStorage.getItem('pwa-install-dismissed'),
            hasPrompt: !!this.deferredPrompt
        };
    }
}

// Initialize PWA Installer
let pwaInstaller;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaInstaller = new PWAInstaller();
    });
} else {
    pwaInstaller = new PWAInstaller();
}

// Export for global use
window.PWAInstaller = PWAInstaller;
window.pwaInstaller = pwaInstaller;