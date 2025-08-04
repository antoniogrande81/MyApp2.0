// js/navigation.js - Sistema di navigazione condiviso per MyApp

// Configurazione Supabase condivisa
export const SUPABASE_CONFIG = {
  url: 'https://lycrgzptkdkksukcwrld.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk'
};

// Configurazione pagine e routing
export const APP_ROUTES = {
  // Pagine pubbliche
  PUBLIC: {
    home: '/index.html',
    login: '/login.html',
    register: '/registrazione.html',
    convenzioni: '/convenzioni.html',
    dirigenti: '/elenco-dirigenti.html',
    contatti: '/contatti.html',
    privacy: '/privacy.html',
    servizi: '/servizi.html'
  },
  // Pagine riservate (autenticazione richiesta)
  PROTECTED: {
    tessera: '/app/tessera.html',
    profilo: '/app/profilo.html',
    dirigenti: '/app/dirigenti.html',
    turni: '/app/turni.html',
    virgilio: '/app/virgilio.html',
    notifiche: '/app/notifiche.html',
    admin: '/app/admin.html'
  }
};

// Utility per gestione autenticazione
export class AuthManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  // Verifica se l'utente è autenticato
  async isAuthenticated() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      return { isAuth: !!user, user, error };
    } catch (error) {
      return { isAuth: false, user: null, error };
    }
  }

  // Redirect a login se non autenticato
  async requireAuth() {
    const { isAuth, user } = await this.isAuthenticated();
    if (!isAuth) {
      window.location.href = APP_ROUTES.PUBLIC.login;
      return null;
    }
    return user;
  }

  // Logout
  async logout() {
    try {
      await this.supabase.auth.signOut();
      window.location.href = APP_ROUTES.PUBLIC.home;
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = APP_ROUTES.PUBLIC.home;
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      return { profile: data, error };
    } catch (error) {
      return { profile: null, error };
    }
  }
}

// Utility per gestione UI condivisa
export class UIManager {
  // Mostra loading
  static showLoading(message = 'Caricamento...') {
    const loading = document.getElementById('loading');
    if (loading) {
      const messageEl = loading.querySelector('p');
      if (messageEl) messageEl.textContent = message;
      loading.classList.remove('hidden');
    }
  }

  // Nascondi loading
  static hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  // Mostra errore
  static showError(message) {
    UIManager.hideLoading();
    alert(`Errore: ${message}`);
    console.error('Error:', message);
  }

  // Mostra successo
  static showSuccess(message, duration = 3000) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
      successEl.textContent = message;
      successEl.style.display = 'block';
      setTimeout(() => {
        successEl.style.display = 'none';
      }, duration);
    } else {
      // Fallback con alert
      alert(`✅ ${message}`);
    }
  }

  // Aggiorna active state nella navigazione
  static updateActiveNavigation(currentPath) {
    document.querySelectorAll('nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('text-primary', 'font-semibold');
        link.classList.remove('text-gray-600');
      } else {
        link.classList.remove('text-primary', 'font-semibold');
        link.classList.add('text-gray-600');
      }
    });
  }
}

// Sistema di notifiche condiviso
export class NotificationManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  // Richiedi permessi notifiche
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Mostra notifica locale
  showLocalNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  }

  // Segna notifica come letta
  async markAsRead(notificationId) {
    try {
      const { error } = await this.supabase
        .from('notifiche')
        .update({ letta: true })
        .eq('id', notificationId);
      
      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
}

// Utility per gestione cache
export class CacheManager {
  static set(key, data, expiry = 3600000) { // 1 ora di default
    const item = {
      data,
      expiry: Date.now() + expiry
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  }

  static get(key) {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  static remove(key) {
    sessionStorage.removeItem(key);
  }

  static clear() {
    sessionStorage.clear();
  }
}

// Utility per validazione form
export class FormValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validateRequired(value) {
    return value && value.trim().length > 0;
  }

  static validateMinLength(value, minLength) {
    return value && value.length >= minLength;
  }

  static showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  static clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }
}

// Registra Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Inizializza app
export function initializeApp() {
  // Registra service worker
  registerServiceWorker();
  
  // Aggiorna active navigation
  UIManager.updateActiveNavigation(window.location.pathname);
  
  // Setup logout globale
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        const authManager = new AuthManager(supabase);
        await authManager.logout();
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = APP_ROUTES.PUBLIC.home;
      }
    }
  });
}