// ================================
// CONFIGURAZIONE SUPABASE MyApp v3.0
// ================================

const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk';

// ================================
// VARIABILI GLOBALI
// ================================

let supabase = null;
let currentStep = 1;
let formData = {};

// ================================
// INIZIALIZZAZIONE
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione MyApp v3.0...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    function checkSupabase() {
        attempts++;
        console.log('🔍 Tentativo ' + attempts + ': controllo Supabase...');
        
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log('✅ Supabase trovato, inizializzazione...');
            initializeSupabase();
            initializeForm();
            setupEventListeners();
            setupPasswordValidation();
        } else if (attempts < maxAttempts) {
            console.log('⏳ Supabase non ancora disponibile, riprovo...');
            setTimeout(checkSupabase, 200);
        } else {
            console.error('❌ Impossibile caricare Supabase dopo ' + maxAttempts + ' tentativi');
            showError('Errore di caricamento. Ricarica la pagina.');
        }
    }
    
    checkSupabase();
});

function initializeSupabase() {
    try {
        console.log('🔧 Inizializzazione Supabase...');
        console.log('📍 URL:', SUPABASE_URL);
        
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client creato con successo');
        } else {
            throw new Error('window.supabase.createClient non disponibile');
        }
    } catch (error) {
        console.error('❌ Errore inizializzazione Supabase:', error);
        showError('Errore di configurazione del servizio. Ricarica la pagina.');
    }
}

function initializeForm() {
    currentStep = 1;
    formData = {};
    showStep(1);
    updateStepIndicator();
    console.log('✅ Form inizializzato - Step corrente:', currentStep);
}

function setupEventListeners() {
    // Aggiungi event listeners per i pulsanti
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function getElementValue(elementId, trimValue = true) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn('Elemento non trovato:', elementId);
        return '';
    }
    return trimValue ? element.value.trim() : element.value;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    clearOtherMessages('error');
    console.error('❌ Errore:', message);
}

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successElement && successText) {
        successText.textContent = message;
        successElement.classList.remove('hidden');
    }
    
    clearOtherMessages('success');
    console.log('✅ Successo:', message);
}

function showInfo(message) {
    const infoElement = document.getElementById('infoMessage');
    const infoText = document.getElementById('infoText');
    
    if (infoElement && infoText) {
        infoText.textContent = message;
        infoElement.classList.remove('hidden');
    }
    
    clearOtherMessages('info');
    console.log('ℹ️ Info:', message);
}

function clearMessages() {
    const messages = ['errorMessage', 'successMessage', 'infoMessage'];
    messages.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function clearOtherMessages(keep) {
    const allMessages = {
        'error': 'errorMessage',
        'success': 'successMessage',
        'info': 'infoMessage'
    };
    
    for (const type in allMessages) {
        if (type !== keep) {
            const element = document.getElementById(allMessages[type]);
            if (element) {
                element.classList.add('hidden');
            }
        }
    }
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
        inputElement.classList.remove('valid');
    }
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
        inputElement.classList.add('valid');
    }
}

function showLoading() {
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="loading-spinner"></span>Registrazione in corso...';
    }
}

function hideLoading() {
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '🚀 Completa Registrazione';
    }
}

// ================================
// GESTIONE STEP DEL FORM
// ================================

function showStep(step) {
    console.log('🔄 Cambio step da ' + currentStep + ' a ' + step);
    
    // Nascondi tutti gli step
    const stepForms = document.querySelectorAll('.step-form');
    for (let i = 0; i < stepForms.length; i++) {
        stepForms[i].classList.add('hidden');
    }
    
    // Mostra lo step corrente
    const stepElement = document.getElementById('step' + step + 'Form');
    if (stepElement) {
        stepElement.classList.remove('hidden');
        currentStep = step;
        updateStepIndicator();
        updateStepLabel();
        
        // Aggiorna il riepilogo se siamo al terzo step
        if (step === 3) {
            updateSummary();
        }
        
        console.log('✅ Step ' + step + ' mostrato correttamente');
    } else {
        console.error('❌ Elemento step non trovato: step' + step + 'Form');
    }
}

function updateStepIndicator() {
    const steps = ['step1', 'step2', 'step3'];
    const lines = ['line1', 'line2'];
    
    for (let i = 0; i < steps.length; i++) {
        const stepElement = document.getElementById(steps[i]);
        const stepNumber = i + 1;
        
        if (stepElement) {
            if (stepNumber < currentStep) {
                stepElement.className = 'step-circle completed';
                stepElement.innerHTML = '✓';
            } else if (stepNumber === currentStep) {
                stepElement.className = 'step-circle active';
                stepElement.innerHTML = stepNumber;
            } else {
                stepElement.className = 'step-circle';
                stepElement.innerHTML = stepNumber;
            }
        }
    }
    
    for (let i = 0; i < lines.length; i++) {
        const lineElement = document.getElementById(lines[i]);
        if (lineElement) {
            if (i + 1 < currentStep) {
                lineElement.classList.add('completed');
            } else {
                lineElement.classList.remove('completed');
            }
        }
    }
}

function updateStepLabel() {
    const labels = {
        1: 'Dati Personali',
        2: 'Password e Sicurezza',
        3: 'Privacy e Conferma'
    };
    
    const labelElement = document.getElementById('stepLabel');
    if (labelElement) {
        labelElement.textContent = labels[currentStep];
    }
}

function updateSummary() {
    const summaryElements = {
        summaryNome: formData.nome || '-',
        summaryCognome: formData.cognome || '-',
        summaryEmail: formData.email || '-',
        summaryDataNascita: formData.data_nascita ? new Date(formData.data_nascita).toLocaleDateString('it-IT') : '-',
        summaryLuogoNascita: formData.luogo_nascita || '-',
        summaryCellulare: formData.cellulare || '-'
    };
    
    for (const elementId in summaryElements) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = summaryElements[elementId];
        }
    }
}

function nextStep() {
    console.log('▶️ Tentativo di andare al prossimo step. Step corrente:', currentStep);
    
    if (validateCurrentStep()) {
        if (currentStep < 3) {
            saveCurrentStepData();
            showStep(currentStep + 1);
        } else {
            console.log('🚀 Avvio registrazione...');
            handleRegistration();
        }
    } else {
        console.log('❌ Validazione fallita per step', currentStep);
    }
}

function prevStep() {
    console.log('◀️ Tornando al step precedente. Step corrente:', currentStep);
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// ================================
// VALIDAZIONE
// ================================

function validateCurrentStep() {
    console.log('🔍 Validazione step', currentStep);
    clearMessages();
    
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            console.error('❌ Step non valido:', currentStep);
            return false;
    }
}

function validateStep1() {
    let isValid = true;
    
    // Validazione Nome
    const nome = getElementValue('nome');
    if (!nome) {
        showFieldError('nome', 'Il nome è obbligatorio');
        isValid = false;
    } else if (nome.length < 2) {
        showFieldError('nome', 'Il nome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('nome');
    }
    
    // Validazione Cognome
    const cognome = getElementValue('cognome');
    if (!cognome) {
        showFieldError('cognome', 'Il cognome è obbligatorio');
        isValid = false;
    } else if (cognome.length < 2) {
        showFieldError('cognome', 'Il cognome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('cognome');
    }
    
    // Validazione Email
    const email = getElementValue('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError('email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showFieldError('email', 'Inserisci un\'email valida');
        isValid = false;
    } else {
        clearFieldError('email');
    }
    
    // Validazione Data di Nascita
    const data_nascita = getElementValue('data_nascita');
    if (!data_nascita) {
        showFieldError('data_nascita', 'La data di nascita è obbligatoria');
        isValid = false;
    } else if (!validateAge(data_nascita)) {
        showFieldError('data_nascita', 'Devi avere almeno 16 anni per registrarti');
        isValid = false;
    } else {
        clearFieldError('data_nascita');
    }
    
    // Validazione Luogo di Nascita
    const luogo_nascita = getElementValue('luogo_nascita');
    if (!luogo_nascita) {
        showFieldError('luogo_nascita', 'Il luogo di nascita è obbligatorio');
        isValid = false;
    } else if (luogo_nascita.length < 2) {
        showFieldError('luogo_nascita', 'Il luogo di nascita deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('luogo_nascita');
    }
    
    // Validazione Cellulare
    const cellulare = getElementValue('cellulare');
    if (!cellulare) {
        showFieldError('cellulare', 'Il cellulare è obbligatorio');
        isValid = false;
    } else if (!validatePhone(cellulare)) {
        showFieldError('cellulare', 'Inserisci un numero di cellulare valido');
        isValid = false;
    } else {
        clearFieldError('cellulare');
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    const password = getElementValue('password', false);
    const confirmPassword = getElementValue('confirmPassword', false);
    
    if (!password) {
        showFieldError('password', 'La password è obbligatoria');
        isValid = false;
    } else if (!isPasswordStrong(password)) {
        showFieldError('password', 'La password non soddisfa i requisiti di sicurezza');
        isValid = false;
    } else {
        clearFieldError('password');
    }
    
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Conferma la password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Le password non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmPassword');
    }
    
    return isValid;
}

function validateStep3() {
    const privacy_accepted = document.getElementById('privacy_accepted');
    
    if (!privacy_accepted || !privacy_accepted.checked) {
        showError('Devi accettare i termini e condizioni per procedere');
        return false;
    }
    
    return true;
}

// ================================
// FUNZIONI DI VALIDAZIONE SPECIFICHE
// ================================

function validateAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 16;
}

function validatePhone(phone) {
    // Rimuove spazi, trattini e parentesi
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Verifica formato italiano o internazionale
    const phoneRegex = /^(\+39|0039|39)?[0-9]{9,10}$/;
    return phoneRegex.test(cleanPhone);
}

function isPasswordStrong(password) {
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    return requirements.length && requirements.upper && requirements.lower && requirements.number;
}

// ================================
// GESTIONE PASSWORD
// ================================

function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            updatePasswordRequirements(this.value);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });
    }
}

function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    strengthBar.className = 'strength-bar';
    
    switch (strength.level) {
        case 0:
            strengthBar.classList.add('strength-weak');
            strengthText.textContent = 'Troppo debole';
            strengthText.style.color = '#ef4444';
            break;
        case 1:
            strengthBar.classList.add('strength-medium');
            strengthText.textContent = 'Debole';
            strengthText.style.color = '#f59e0b';
            break;
        case 2:
            strengthBar.classList.add('strength-good');
            strengthText.textContent = 'Buona';
            strengthText.style.color = '#eab308';
            break;
        case 3:
            strengthBar.classList.add('strength-strong');
            strengthText.textContent = 'Forte';
            strengthText.style.color = '#10b981';
            break;
    }
}

function updatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-upper': /[A-Z]/.test(password),
        'req-lower': /[a-z]/.test(password),
        'req-number': /\d/.test(password)
    };
    
    for (const reqId in requirements) {
        const indicator = document.querySelector('#' + reqId + ' .requirement-indicator');
        if (indicator) {
            if (requirements[reqId]) {
                indicator.classList.add('met');
            } else {
                indicator.classList.remove('met');
            }
        }
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    for (const check in checks) {
        if (checks[check]) score++;
    }
    
    let level;
    if (score < 2) level = 0;
    else if (score < 3) level = 1;
    else if (score < 4) level = 2;
    else level = 3;
    
    return { score: score, level: level, checks: checks };
}

function validatePasswordMatch() {
    const password = getElementValue('password', false);
    const confirmPassword = getElementValue('confirmPassword', false);
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPassword', 'Le password non coincidono');
    } else {
        clearFieldError('confirmPassword');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        if (button) button.textContent = '🙈';
    } else {
        input.type = 'password';
        if (button) button.textContent = '👁️';
    }
}

// ================================
// GESTIONE DATI FORM
// ================================

function saveCurrentStepData() {
    switch (currentStep) {
        case 1:
            formData.nome = getElementValue('nome');
            formData.cognome = getElementValue('cognome');
            formData.email = getElementValue('email');
            formData.data_nascita = getElementValue('data_nascita');
            formData.luogo_nascita = getElementValue('luogo_nascita');
            formData.cellulare = getElementValue('cellulare');
            break;
        case 2:
            formData.password = getElementValue('password', false);
            break;
        case 3:
            const privacyElement = document.getElementById('privacy_accepted');
            const marketingElement = document.getElementById('marketing_consent');
            formData.privacy_accepted = privacyElement ? privacyElement.checked : false;
            formData.marketing_consent = marketingElement ? marketingElement.checked : false;
            break;
    }
    console.log('💾 Dati step ' + currentStep + ' salvati:', formData);
}

// ================================
// REGISTRAZIONE UTENTE CON EMAIL CONFIRMATION
// ================================

async function handleRegistration() {
    try {
        console.log('🚀 Inizio processo di registrazione MyApp v3.0...');
        
        if (!supabase) {
            throw new Error('Supabase non inizializzato correttamente');
        }
        
        saveCurrentStepData();
        showLoading();
        
        console.log('📧 Registrazione per email:', formData.email);
        
        // 1. Registra l'utente in Supabase Auth con email confirmation
        const authResult = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                emailRedirectTo: window.location.origin + '/conferma-email.html',
                data: {
                    nome: formData.nome,
                    cognome: formData.cognome
                }
            }
        });
        
        if (authResult.error) {
            throw new Error('Errore registrazione: ' + getErrorMessage(authResult.error));
        }
        
        console.log('✅ Utente Auth registrato:', authResult.data.user?.id);
        
        // 2. Crea profilo nella tabella profiles
        if (authResult.data.user) {
            console.log('👤 Creazione profilo...');
            
            const profileData = {
                user_id: authResult.data.user.id,
                nome: formData.nome,
                cognome: formData.cognome,
                email: formData.email,
                data_nascita: formData.data_nascita,
                luogo_nascita: formData.luogo_nascita,
                cellulare: formData.cellulare,
                email_confermata: false,
                stato: 'in_attesa'
            };
            
            const profileResult = await supabase
                .from('profiles')
                .insert([profileData])
                .select();
            
            if (profileResult.error) {
                console.error('❌ Errore creazione profilo:', profileResult.error);
                // Non blocchiamo il processo, il profilo può essere creato dopo
                console.log('⚠️ Continuo senza profilo, verrà creato al momento della conferma');
            } else {
                console.log('✅ Profilo creato:', profileResult.data);
                
                // 3. Crea tessera
                if (profileResult.data && profileResult.data[0]) {
                    console.log('🎫 Generazione tessera...');
                    
                    try {
                        // Genera numero tessera
                        const { data: numeroTessera, error: numeroError } = await supabase
                            .rpc('generate_tessera_number');
                        
                        if (numeroError) {
                            console.error('❌ Errore generazione numero tessera:', numeroError);
                            throw numeroError;
                        }
                        
                        const tesseraData = {
                            user_id: authResult.data.user.id,
                            profile_id: profileResult.data[0].id,
                            numero_tessera: numeroTessera,
                            stato_tessera: 'in_attesa'
                        };
                        
                        const tesseraResult = await supabase
                            .from('tessere')
                            .insert([tesseraData])
                            .select();
                        
                        if (tesseraResult.error) {
                            console.error('❌ Errore creazione tessera:', tesseraResult.error);
                        } else {
                            console.log('✅ Tessera creata:', tesseraResult.data[0]?.numero_tessera);
                        }
                        
                    } catch (tesseraError) {
                        console.error('❌ Errore nel processo tessera:', tesseraError);
                        // Non blocchiamo, la tessera può essere creata dopo
                    }
                }
            }
        }
        
        hideLoading();
        showEmailConfirmation(formData.email);
        
        console.log('🎉 Registrazione completata con successo');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Errore durante la registrazione:', error);
        showError(error.message || 'Errore durante la registrazione. Riprova.');
    }
}

function getErrorMessage(error) {
    switch (error.message) {
        case 'User already registered':
            return 'Questo indirizzo email è già registrato';
        case 'Invalid email':
            return 'Indirizzo email non valido';
        case 'Password should be at least 6 characters':
            return 'La password deve contenere almeno 6 caratteri';
        case 'Signup is disabled':
            return 'La registrazione è temporaneamente disabilitata';
        default:
            return error.message;
    }
}

// ================================
// CONFERMA EMAIL
// ================================

function showEmailConfirmation(email) {
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('emailConfirmationSection').classList.remove('hidden');
    document.getElementById('confirmationEmail').textContent = email;
    startResendTimer();
}

async function resendConfirmationEmail() {
    try {
        showInfo('Invio email in corso...');
        
        if (!supabase) {
            throw new Error('Servizio non disponibile');
        }
        
        const result = await supabase.auth.resend({
            type: 'signup',
            email: formData.email
        });
        
        if (result.error) {
            throw result.error;
        }
        
        showSuccess('Email di conferma inviata nuovamente!');
        startResendTimer();
        
    } catch (error) {
        console.error('❌ Errore riinvio email:', error);
        showError('Errore nell\'invio dell\'email. Riprova più tardi.');
    }
}

function startResendTimer() {
    let seconds = 60;
    const resendButton = document.getElementById('resendBtn');
    const timerElement = document.getElementById('timerSeconds');
    const timerContainer = document.getElementById('resendTimer');
    
    if (resendButton) {
        resendButton.disabled = true;
        resendButton.textContent = 'Attendi...';
    }
    
    if (timerContainer) {
        timerContainer.style.display = 'block';
    }
    
    if (timerElement) {
        const timer = setInterval(() => {
            seconds--;
            timerElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(timer);
                if (resendButton) {
                    resendButton.disabled = false;
                    resendButton.textContent = '📤 Invia nuovamente l\'email';
                }
                if (timerContainer) {
                    timerContainer.style.display = 'none';
                }
            }
        }, 1000);
    }
}

// ================================
// UTILITY FUNCTIONS PER NAVIGAZIONE
// ================================

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> b0ae989e8a555024883eeeddeb87fc6d774240b4
