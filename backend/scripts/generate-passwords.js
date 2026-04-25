/**
 * generate-passwords.js
 * Jalankan sekali untuk generate bcrypt hash password default
 * Usage: node scripts/generate-passwords.js
 */

'use strict';

const bcrypt = require('bcryptjs');

const accounts = [
  { username: 'superadmin',  password: 'SuperAdmin@2024!',  role: 'superadmin' },
  { username: 'gudang01',    password: 'Gudang@2024!',      role: 'admin_gudang' },
  { username: 'website01',   password: 'Website@2024!',     role: 'admin_website' },
  { username: 'marketing01', password: 'Marketing@2024!',   role: 'marketing' },
];

async function main() {
  console.log('\n=== Jogja Furniture — Password Hash Generator ===\n');
  console.log('Gunakan hash berikut untuk UPDATE di database_v2.sql\n');

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 12);
    console.log(`-- ${acc.role}: ${acc.username}`);
    console.log(`-- Password: ${acc.password}`);
    console.log(`-- Hash    : ${hash}`);
    console.log(`UPDATE admin_users SET password='${hash}' WHERE username='${acc.username}';\n`);
  }

  console.log('\n⚠️  PENTING: Ganti semua password setelah pertama kali login!');
  console.log('   Gunakan Admin Panel → Profile → Ganti Password\n');
}

main().catch(console.error);
