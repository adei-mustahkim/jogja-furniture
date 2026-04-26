const fs = require('fs');
const path = 'admin/js/admin.js';
let content = fs.readFileSync(path, 'utf8');

const profileHeader = '// ══════════════════════════════════════════════════════════════════════════════════════════════════\n// PROFILE & NOTIFICATIONS\n// ══════════════════════════════════════════════════════════════════════════════════════════════════';

const newNotifSystem = `
async function loadNotifications() {
  try {
    // 1. General Staff Notifications (accessible by all roles)
    const notifRes = await api('GET', '/notifications');
    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) {
      notifBadge.textContent = notifRes.unread || 0;
      notifBadge.style.display = notifRes.unread > 0 ? 'block' : 'none';
    }

    // 2. Contact/Message Inbox Badge (only for Website Admin/Superadmin)
    if (['superadmin', 'admin_website'].includes(me.role)) {
      const contactRes = await api('GET', '/contacts');
      const unreadContacts = (contactRes.data || []).filter(c => !c.is_read).length;
      const contactBadge = document.getElementById('contactUnreadBadge');
      if (contactBadge) {
        contactBadge.innerHTML = unreadContacts ? \`<span class="nav-badge">\${unreadContacts}</span>\` : '';
      }
    }
  } catch (e) {
    console.error('Failed to load notifications:', e.message);
  }
}

let notifData = [];
function toggleNotifDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const isShow = dd.classList.toggle('show');
  if (isShow) {
    renderNotifs();
    // Close dropdown when clicking outside
    const closer = () => { dd.classList.remove('show'); document.removeEventListener('click', closer); };
    document.addEventListener('click', closer);
  }
}

function closeNotifDropdown() {
  document.getElementById('notifDropdown')?.classList.remove('show');
}

async function renderNotifs() {
  const listEl = document.getElementById('notifListDropdown');
  if (!listEl) return;
  
  try {
    const res = await api('GET', '/notifications');
    notifData = res.data || [];
    
    if (!notifData.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-light)">Tidak ada notifikasi</div>';
      return;
    }

    listEl.innerHTML = notifData.map(n => \`
      <div class="notif-item \${n.is_read ? '' : 'unread'}" onclick="handleNotifClick('\${n.id}', '\${n.link}')">
        <div class="notif-title">\${n.title}</div>
        <div class="notif-msg">\${n.message}</div>
        <div class="notif-time">\${fmtDate(n.created_at)}</div>
      </div>
    \`).join('');
  } catch (e) {
    listEl.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--danger)">Gagal memuat notifikasi</div>';
  }
}

async function handleNotifClick(id, link) {
  try {
    await api('PUT', \`/notifications/\${id}/read\`);
    loadNotifications(); // Refresh badge
    if (link) {
      if (link.startsWith('/admin/panel.html')) {
        const page = link.split('#')[1];
        if (page) navigateTo(page);
      } else {
        window.location.href = link;
      }
    }
  } catch (e) { }
}

async function markAllRead() {
  try {
    await api('PUT', '/notifications/read-all');
    toast('Semua notifikasi ditandai dibaca');
    loadNotifications();
    renderNotifs();
  } catch (e) { toast(e.message, 'error'); }
}
`;

// Replace everything between the profile header and loadProfile
const regex = /\/\/ ═══════════════[\s\S]*?async function loadProfile\(\)/;
content = content.replace(regex, profileHeader + newNotifSystem + '\nasync function loadProfile()');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed notification system and restored loadNotifications');
