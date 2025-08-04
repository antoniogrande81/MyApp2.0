#!/usr/bin/env node
// 🚀 Script Node.js per aggiornare tutti i file HTML - MyApp

const fs = require('fs');
const path = require('path');

console.log('🔄 Aggiornamento file HTML MyApp...\n');

// Funzione ricorsiva per trovare tutti i file HTML
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Funzione per determinare il percorso CSS relativo
function getCssPath(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (relativePath.includes('app' + path.sep)) {
        return '../style.css';
    } else if (relativePath.includes('public' + path.sep)) {
        return './style.css';
    } else {
        return './public/style.css';
    }
}

// Funzione per aggiornare un singolo file
function updateHtmlFile(filePath) {
    console.log(`📝 Aggiornando: ${filePath}`);
    
    // Leggi il contenuto del file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Backup
    fs.writeFileSync(filePath + '.backup', content);
    
    // Rimuovi CDN Tailwind
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/g, '');
    
    // Rimuovi configurazione Tailwind (multilinea)
    content = content.replace(/<script>\s*tailwind\.config = \{[\s\S]*?\}\s*<\/script>\s*/g, '');
    
    // Determina il percorso CSS
    const cssPath = getCssPath(filePath);
    
    // Aggiungi il link al CSS compilato
    const cssLink = `\n\n    <!-- Tailwind CSS Compilato -->\n    <link href="${cssPath}" rel="stylesheet">`;
    content = content.replace('</title>', '</title>' + cssLink);
    
    // Scrivi il file aggiornato
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ Aggiornato: ${filePath}`);
}

// Main execution
try {
    const htmlFiles = findHtmlFiles(process.cwd());
    
    if (htmlFiles.length === 0) {
        console.log('❌ Nessun file HTML trovato!');
        process.exit(1);
    }
    
    console.log(`🔍 Trovati ${htmlFiles.length} file HTML:`);
    htmlFiles.forEach(file => console.log(`   - ${file}`));
    console.log();
    
    // Aggiorna tutti i file
    htmlFiles.forEach(updateHtmlFile);
    
    console.log('\n🎉 Tutti i file HTML sono stati aggiornati!');
    console.log('📁 I backup sono salvati come [nome_file].html.backup');
    console.log('\n🔍 Verifica i cambiamenti con:');
    console.log('   diff index.html index.html.backup');
    console.log('\n🗑️  Per rimuovere i backup:');
    console.log('   find . -name "*.backup" -delete');
    
} catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
}