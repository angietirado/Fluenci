const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
}

function importPath(filePath) {
    let rel = path.relative(path.dirname(filePath), path.join(srcDir, 'config', 'api.js'));
    rel = rel.replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel.replace(/\.js$/, '');
}

function addImport(content, filePath) {
    if (content.includes('/config/api')) return content;
    const stmt = `import { API_URL, apiUrl } from '${importPath(filePath)}';`;
    const lines = content.split('\n');
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) insertAt = i + 1;
    }
    lines.splice(insertAt, 0, stmt);
    return lines.join('\n');
}

function migrate(content) {
    content = content.replace(
        /`http:\/\/localhost:5000\$\{([^}]+)\}`/g,
        (_, expr) => `\${apiUrl(${expr})}`
    );
    content = content.replace(
        /'http:\/\/localhost:5000([^']*)'/g,
        (_, p) => `\`\${API_URL}${p}\``
    );
    content = content.replace(
        /`http:\/\/localhost:5000([^`]*)`/g,
        (_, p) => `\`\${API_URL}${p}\``
    );
    return content;
}

for (const file of walk(srcDir)) {
    if (file.endsWith(`${path.sep}config${path.sep}api.js`)) continue;
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('localhost:5000')) continue;
    content = migrate(content);
    content = addImport(content, file);
    fs.writeFileSync(file, content);
    console.log('updated', path.relative(srcDir, file));
}
