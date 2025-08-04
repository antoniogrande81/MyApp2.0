// ====================================
// SISTEMA POPOLAMENTO AUTOMATICO TABELLE
// ====================================

// 1. AGGIORNA IL TUO registration.js
// Aggiungi questa funzione nel tuo registration.js

async function handleRegistration() {
    try {
        // Registrazione auth (quella che già funziona)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: 'https://myapp2026.onrender.com/conferma.html',
                data: {
                    // Salva i dati nei metadata per recuperarli dopo
                    nome: formData.nome,
                    cognome: formData.cognome,
                    dataNascita: formData.dataNascita,
                    luogoNascita: formData.luogoNascita,
                    codiceFiscale: formData.codiceFiscale,
                    telefono: formData.telefono,
                    indirizzo: formData.indirizzo,
                    citta: formData.citta,
                    cap: formData.cap,
                    provincia: formData.provincia
                }
            }
        });

        if (authError) throw authError;

        console.log('✅ Registrazione auth completata, email di conferma inviata');
        
        // Non creare ancora le tabelle - aspettiamo la conferma email
        showSuccess('Registrazione completata! Controlla la tua email per confermare l\'account.');
        
    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        showError('Errore durante la registrazione: ' + error.message);
    }
}

// ====================================
// 2. CREA UN NUOVO FILE: conferma.js
// ====================================

// Questo script va nella pagina conferma.html
class ConfermaHandler {
    constructor() {
        this.supabase = window.supabase.createClient(
            'https://lycrgzptkdkksukcwrld.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTE1NjYsImV4cCI6MjA0ODYyNzU2Nn0.YoxL1lwBjwdAqOiKMzKx9xmwBOmnbUHWoSRWD5yJTpI'
        );
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Controllo sessione utente...');
            
            // Verifica se l'utente è loggato
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Errore sessione:', error);
                return;
            }

            if (session && session.user) {
                console.log('✅ Utente confermato:', session.user.email);
                
                // Ora crea le tabelle collegate
                await this.createUserData(session.user);
            } else {
                console.log('⏳ Aspettando conferma email...');
                this.showWaitingMessage();
            }
            
        } catch (error) {
            console.error('❌ Errore inizializzazione:', error);
        }
    }

    async createUserData(user) {
        try {
            console.log('🚀 Creazione dati utente per:', user.email);
            
            const userData = user.user_metadata;
            
            // 1. Crea il profilo utente
            await this.createProfile(user.id, userData);
            
            // 2. Crea la tessera
            await this.createTessera(user.id, userData);
            
            // 3. Eventuali altre tabelle...
            
            this.showSuccessMessage();
            
            // Redirect alla dashboard dopo 3 secondi
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 3000);
            
        } catch (error) {
            console.error('❌ Errore creazione dati:', error);
            this.showErrorMessage(error.message);
        }
    }

    async createProfile(userId, userData) {
        try {
            // Prima aggiungi la colonna user_id alla tabella profiles se non esiste
            const profileData = {
                user_id: userId,
                nome: userData.nome,
                cognome: userData.cognome,
                email: userData.email || '',
                telefono: userData.telefono || '',
                data_nascita: userData.dataNascita,
                luogo_nascita: userData.luogoNascita,
                codice_fiscale: userData.codiceFiscale,
                indirizzo: userData.indirizzo || '',
                citta: userData.citta || '',
                cap: userData.cap || '',
                provincia: userData.provincia || '',
                ruolo: 'ISCRITTO',
                stato: 'ATTIVO',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('profiles')
                .insert([profileData])
                .select();

            if (error) throw error;
            
            console.log('✅ Profilo creato:', data);
            
        } catch (error) {
            console.error('❌ Errore creazione profilo:', error);
            throw error;
        }
    }

    async createTessera(userId, userData) {
        try {
            const numeroTessera = this.generateNumeroTessera();
            
            const tesseraData = {
                user_id: userId, // Assicurati che questa colonna esista
                numero_tessera: numeroTessera,
                nome: userData.nome,
                cognome: userData.cognome,
                data_nascita: userData.dataNascita,
                luogo_nascita: userData.luogoNascita,
                codice_fiscale: userData.codiceFiscale,
                data_emissione: new Date().toISOString().split('T')[0],
                data_scadenza: this.getDataScadenza(),
                stato: 'ATTIVA',
                tipo_tessera: 'STANDARD',
                qr_code_data: this.generateQRData(numeroTessera),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('tessere')
                .insert([tesseraData])
                .select();

            if (error) throw error;
            
            console.log('✅ Tessera creata:', data);
            
        } catch (error) {
            console.error('❌ Errore creazione tessera:', error);
            throw error;
        }
    }

    generateNumeroTessera() {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `TESS-${year}-${random}`;
    }

    getDataScadenza() {
        const now = new Date();
        const scadenza = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        return scadenza.toISOString().split('T')[0];
    }

    generateQRData(numeroTessera) {
        return JSON.stringify({
            tessera: numeroTessera,
            timestamp: Date.now(),
            type: 'tessera_sindacale'
        });
    }

    showWaitingMessage() {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div class="text-center p-8">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Aspettando conferma email...</h2>
                    <p class="text-gray-600">Controlla la tua casella email e clicca sul link di conferma.</p>
                </div>
            </div>
        `;
    }

    showSuccessMessage() {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <div class="text-center p-8">
                    <div class="text-6xl mb-4">✅</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Account Confermato!</h2>
                    <p class="text-gray-600 mb-4">I tuoi dati sono stati configurati correttamente.</p>
                    <p class="text-sm text-gray-500">Sarai reindirizzato alla dashboard...</p>
                </div>
            </div>
        `;
    }

    showErrorMessage(message) {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div class="text-center p-8">
                    <div class="text-6xl mb-4">❌</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Errore</h2>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="window.location.href='/registrazione.html'" 
                            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Torna alla Registrazione
                    </button>
                </div>
            </div>
        `;
    }
}

// Inizializza quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    new ConfermaHandler();
});

// ====================================
// 3. SQL PER PREPARARE LE TABELLE
// ====================================

/*
-- Aggiungi le colonne user_id se non esistono

-- Per la tabella profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Per la tabella tessere (se non l'hai già aggiunta)
ALTER TABLE public.tessere 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Riabilita RLS in modo sicuro
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tessere ENABLE ROW LEVEL SECURITY;

-- Policy semplici e sicure
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tessera" ON public.tessere
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert tessere" ON public.tessere
    FOR INSERT WITH CHECK (true);
*/
