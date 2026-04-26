const fs = require('fs');
const path = 'admin/js/admin.js';
let content = fs.readFileSync(path, 'utf8');

// The file is messy. I will try to find the anchor points and clean it up.
const lines = content.split('\n');

// Find the last good line of openUserModal
let endOfOpenUserModal = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("passGroup.style.display = 'block';")) {
        endOfOpenUserModal = i;
        break;
    }
}

if (endOfOpenUserModal !== -1) {
    const head = lines.slice(0, endOfOpenUserModal + 1).join('\n') + '\n  }\n  openModal(\'modalUser\');\n}\n';
    
    // Missing functions
    const usersFunctions = `
async function saveUser() {
  const username = getVal('uUsername'), role = getVal('uRole'), email = getVal('uEmail'),
    full_name = getVal('uName'), phone = getVal('uPhone'), password = getVal('uPassword'),
    is_active = document.getElementById('uActive').checked ? 1 : 0;

  if (!email || !role || (!currentEditUserId && (!username || !password))) {
    toast('Field wajib (*) harus diisi', 'warning'); return;
  }

  const body = { role, email, full_name, phone, is_active };
  if (!currentEditUserId) {
    body.username = username;
    body.password = password;
  }

  try {
    const method = currentEditUserId ? 'PUT' : 'POST';
    const url = currentEditUserId ? \`/users/\${currentEditUserId}\` : '/users';
    await api(method, url, body);
    toast(\`User berhasil \${currentEditUserId ? 'diupdate' : 'dibuat'}\`);
    closeModal('modalUser');
    loadUsers(usrPage);
  } catch (e) { toast(e.message, 'error'); }
}

async function resetUserPassword(id) {
  const nw = prompt('Masukkan password baru (min 8 karakter):');
  if (!nw) return;
  if (nw.length < 8) { toast('Password minimal 8 karakter', 'warning'); return; }
  try {
    await api('POST', \`/users/\${id}/reset-password\`, { new_password: nw });
    toast('Password berhasil direset');
  } catch (e) { toast(e.message, 'error'); }
}

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
`;

    const profileSection = `
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
`;

    // Find doChangePassword
    let startOfDoChangePassword = -1;
    for (let i = endOfOpenUserModal; i < lines.length; i++) {
        if (lines[i].includes('async function doChangePassword()')) {
            startOfDoChangePassword = i;
            break;
        }
    }

    if (startOfDoChangePassword !== -1) {
        const tail = lines.slice(startOfDoChangePassword).join('\n');
        const newContent = head + usersFunctions + profileSection + tail;
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Final fix applied');
    }
}
