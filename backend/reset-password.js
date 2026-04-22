const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function reset() {
  const hash = await bcrypt.hash('Admin1234!', 10);
  await db.query('UPDATE admin_users SET password=? WHERE username=?', [hash, 'superadmin']);
  console.log('✅ Password superadmin berhasil direset ke: Admin1234!');
  process.exit(0);
}
reset();
