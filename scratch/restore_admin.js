const fs = require('fs');
const path = 'admin/js/admin.js';
let content = fs.readFileSync(path, 'utf8');

// Find the marker after users section
const marker = 'async function doChangePassword()';
const parts = content.split(marker);

// Reconstruct the file with the missing functions
const missingSection = `
async function toggleUser(id) {
  try {
    const res = await api('POST', \`/users/\${id}/toggle\`);
    toast(\`User berhasil \${res.is_active ? 'diaktifkan' : 'dinonaktifkan'}\`);
    loadUsers(usrPage);
  } catch (e) { toast(e.message, 'error'); }
}

async function forceLogoutUser(id) {
  if (!confirm('Paksa logout user ini dari semua perangkat?')) return;
  try {
    await api('POST', \`/users/\${id}/force-logout\`);
    toast('User berhasil dikeluarkan');
    loadUsers(usrPage);
  } catch (e) { toast(e.message, 'error'); }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// PROFILE & NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════
async function loadNotifications() {
  try {
    const data = await api('GET', '/contacts');
    const unread = (data.data || []).filter(c => !c.is_read).length;
    const badge = document.getElementById('contactUnreadBadge');
    if (badge) badge.innerHTML = unread ? \`<span class="nav-badge">\${unread}</span>\` : '';
  } catch (e) { }
}

async function loadProfile() {
  const el = document.getElementById('profileInfo');
  if (!el) return;
  
  try {
    const res = await api('GET', '/profile');
    if (res.success) {
      Object.assign(me, res.data);
      localStorage.setItem('jf_user', JSON.stringify(me));
    }
  } catch (e) { console.error('Profile sync error', e); }

  el.innerHTML = \`
    <div style="padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem">
      <div style="display:flex; align-items:center; gap:1.5rem">
        <div style="width:70px; height:70px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:700">
          \${(me.full_name || me.username || 'A')[0].toUpperCase()}
        </div>
        <div>
          <div style="font-size:1.2rem; font-weight:700; color:var(--primary)">\${me.full_name || me.username}</div>
          <div style="color:var(--text-light); font-size:.85rem">Role: \${roleLabel(me.role)}</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:100px 1fr; gap:.5rem; font-size:.9rem; border-top:1px solid var(--gray100); padding-top:1.2rem">
        <div style="color:var(--text-light)">Username</div><div><strong>\${me.username}</strong></div>
        <div style="color:var(--text-light)">Email</div><div><strong>\${me.email}</strong></div>
        <div style="color:var(--text-light)">Telepon</div><div><strong>\${me.phone || '-'}</strong></div>
        <div style="color:var(--text-light)">Terakhir Login</div><div><strong>\${fmtDate(me.last_login)}</strong></div>
      </div>
    </div>
  \`;
}

\`;

// We also need to restore saveUser and resetUserPassword if they were deleted
// But let's first see what's left.
fs.writeFileSync('admin/js/admin.js.bak', content);
// For now, I'll just append the missing stuff before doChangePassword if it's missing
if (!content.includes('function loadProfile()')) {
    content = parts[0] + missingSection + marker + parts[1];
    fs.writeFileSync(path, content, 'utf8');
}
console.log('Restored profile functions');
