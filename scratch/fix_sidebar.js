const fs = require('fs');
const path = 'admin/js/admin.js';
let content = fs.readFileSync(path, 'utf8');

const target = 'el.innerHTML = `<span class="nav-icon">${item.icon}</span> ${item.label}`;';
const replacement = 'el.innerHTML = `<span class="nav-icon">${item.icon}</span> ${item.label}${item.page === \'contacts\' ? \'<span id="contactUnreadBadge"></span>\' : \'\'}`;';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed sidebar item badge');
} else {
    console.log('Target not found');
    // Try a more flexible search
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('el.innerHTML =') && lines[i].includes('item.icon') && lines[i].includes('item.label')) {
            lines[i] = lines[i].replace(/el\.innerHTML\s*=\s*`[\s\S]*?`;/, replacement);
            found = true;
            break;
        }
    }
    if (found) {
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log('Fixed sidebar item badge (flexible search)');
    } else {
        console.log('Flexible search also failed');
    }
}
