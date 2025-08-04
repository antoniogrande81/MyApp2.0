// Script automatico per aggiungere Meta Tags PWA
// Salva questo script come "add-meta-tags.js" e eseguilo con Node.js

const fs = require('fs');
const path = require('path');

// Meta tags PWA da inserire
const PWA_META_TAGS = `
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#2400C1">
    <meta name="background-color" content="#2400C1">

    <!-- Icone Standard -->
    <link rel="icon" type="image/png" sizes="16x16" href="/public/icons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/public/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/public/icons/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/public/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/public/icons/icon-512x512.png">

    <!-- iOS Support -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="MyApp">
    <link rel="apple-touch-icon" href="/public/icons/apple-touch-icon.png">

    <!-- Android Support -->
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="MyApp">
    <meta name="msapplication-TileColor" content="#2400C1">
    
    <!-- Preconnect per performance -->
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://lycrgzptkdkksukcwrld.supabase.co">
`;

// Marker per identificare dove inserire i meta tags
const META_MARKER = '<!-- PWA Meta Tags -->';

class MetaTagsInjector {
    constructor(projectPath = '.') {
        this.projectPath = projectPath;
        this.htmlFiles = [];
        this.processedFiles = [];
        this.skippedFiles = [];
    }

    // Trova tutti i file HTML nel progetto
    findHtmlFiles(dir = this.projectPath) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Salta cartelle node_modules, .git, etc.
                if (!['node_modules', '.git', '.vscode', 'dist', 'build'].includes(item)) {
                    this.findHtmlFiles(fullPath);
                }
            } else if (item.endsWith('.html')) {
                this.htmlFiles.push(fullPath);
            }
        }
    }

    // Processa un singolo file HTML
    processHtmlFile(filePath) {
        try {
            console.log(`📄 Processando: ${filePath}`);
            
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Controlla se i meta tags sono già presenti
            if (content.includes(META_MARKER) || content.includes('rel="manifest"')) {
                console.log(`⏭️  Saltato: ${filePath} (meta tags già presenti)`);
                this.skippedFiles.push(filePath);
                return;
            }

            // Trova la posizione dove inserire i meta tags
            const insertPosition = this.findInsertPosition(content);
            
            if (insertPosition === -1) {
                console.log(`⚠️  Saltato: ${filePath} (posizione non trovata)`);
                this.skippedFiles.push(filePath);
                return;
            }

            // Inserisci i meta tags
            const beforeInsert = content.substring(0, insertPosition);
            const afterInsert = content.substring(insertPosition);
            const newContent = beforeInsert + PWA_META_TAGS + '\n' + afterInsert;

            // Crea backup
            const backupPath = filePath + '.backup';
            fs.writeFileSync(backupPath, content);
            console.log(`💾 Backup creato: ${backupPath}`);

            // Scrivi il nuovo contenuto
            fs.writeFileSync(filePath, newContent);
            console.log(`✅ Aggiornato: ${filePath}`);
            
            this.processedFiles.push(filePath);

        } catch (error) {
            console.error(`❌ Errore processando ${filePath}:`, error.message);
            this.skippedFiles.push(filePath);
        }
    }

    // Trova dove inserire i meta tags
    findInsertPosition(content) {
        // Cerca dopo il title
        let titleMatch = content.match(/<title[^>]*>.*?<\/title>/i);
        if (titleMatch) {
            return titleMatch.index + titleMatch[0].length;
        }

        // Cerca dopo viewport
        let viewportMatch = content.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
        if (viewportMatch) {
            return viewportMatch.index + viewportMatch[0].length;
        }

        // Cerca dopo charset
        let charsetMatch = content.match(/<meta[^>]*charset[^>]*>/i);
        if (charsetMatch) {
            return charsetMatch.index + charsetMatch[0].length;
        }

        // Cerca dopo <head>
        let headMatch = content.match(/<head[^>]*>/i);
        if (headMatch) {
            return headMatch.index + headMatch[0].length;
        }

        return -1;
    }

    // Esegui il processo completo
    run() {
        console.log('🚀 Avvio aggiunta automatica Meta Tags PWA...\n');
        
        // Trova tutti i file HTML
        this.findHtmlFiles();
        console.log(`📁 Trovati ${this.htmlFiles.length} file HTML:\n`);
        this.htmlFiles.forEach(file => console.log(`   - ${file}`));
        console.log('');

        // Processa ogni file
        this.htmlFiles.forEach(file => this.processHtmlFile(file));

        // Report finale
        console.log('\n🎯 === REPORT FINALE ===');
        console.log(`✅ File processati: ${this.processedFiles.length}`);
        console.log(`⏭️  File saltati: ${this.skippedFiles.length}`);
        console.log(`📄 Totale file: ${this.htmlFiles.length}`);

        if (this.processedFiles.length > 0) {
            console.log('\n✅ File aggiornati:');
            this.processedFiles.forEach(file => console.log(`   ✓ ${file}`));
        }

        if (this.skippedFiles.length > 0) {
            console.log('\n⏭️ File saltati:');
            this.skippedFiles.forEach(file => console.log(`   - ${file}`));
        }

        console.log('\n💾 I file originali sono stati salvati con estensione .backup');
        console.log('📱 Ora testa la tua PWA per verificare che tutto funzioni!');
    }

    // Ripristina i backup
    restoreBackups() {
        console.log('🔄 Ripristino backup...\n');
        
        const backupFiles = [];
        this.findBackupFiles(this.projectPath, backupFiles);
        
        backupFiles.forEach(backupPath => {
            const originalPath = backupPath.replace('.backup', '');
            try {
                const backupContent = fs.readFileSync(backupPath, 'utf8');
                fs.writeFileSync(originalPath, backupContent);
                fs.unlinkSync(backupPath); // Rimuovi backup
                console.log(`✅ Ripristinato: ${originalPath}`);
            } catch (error) {
                console.error(`❌ Errore ripristinando ${originalPath}:`, error.message);
            }
        });

        console.log(`\n🎯 Ripristinati ${backupFiles.length} file`);
    }

    findBackupFiles(dir, backupFiles) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!['node_modules', '.git', '.vscode'].includes(item)) {
                    this.findBackupFiles(fullPath, backupFiles);
                }
            } else if (item.endsWith('.html.backup')) {
                backupFiles.push(fullPath);
            }
        }
    }
}

// Funzione principale
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const projectPath = args[1] || '.';

    const injector = new MetaTagsInjector(projectPath);

    switch (command) {
        case 'restore':
            injector.restoreBackups();
            break;
        case 'help':
            showHelp();
            break;
        default:
            injector.run();
            break;
    }
}

function showHelp() {
    console.log(`
🔧 SCRIPT AUTO META TAGS PWA

UTILIZZO:
   node add-meta-tags.js [comando] [percorso]

COMANDI:
   (nessuno)    - Aggiungi meta tags a tutti i file HTML
   restore      - Ripristina i backup (annulla modifiche)
   help         - Mostra questo aiuto

ESEMPI:
   node add-meta-tags.js
   node add-meta-tags.js . 
   node add-meta-tags.js restore
   node add-meta-tags.js ./public

COSA FA:
   ✅ Trova tutti i file .html nel progetto
   ✅ Aggiunge i meta tags PWA nella posizione corretta
   ✅ Crea backup automatici (.html.backup)
   ✅ Salta file già processati
   ✅ Report dettagliato delle modifiche

SICUREZZA:
   🛡️ Crea sempre backup prima di modificare
   🛡️ Salta file già con meta tags PWA
   🛡️ Comando 'restore' per annullare tutto
`);
}

// Esegui lo script se chiamato direttamente
if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Errore:', error.message);
        process.exit(1);
    }
}

module.exports = MetaTagsInjector;