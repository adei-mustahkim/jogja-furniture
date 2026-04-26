const fs = require('fs');
const path = 'admin/js/admin.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines = lines.map(line => {
    if (line.includes('â•')) return '// ' + '-'.repeat(100);
    return line;
});
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Cleanup done');
