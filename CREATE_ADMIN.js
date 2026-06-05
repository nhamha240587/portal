#!/usr/bin/env node

/**
 * Script để tạo admin account
 *
 * Cách dùng:
 *   node CREATE_ADMIN.js
 *
 * Sau đó copy hash được in ra và thay vào SQL query
 */

const bcrypt = require('bcrypt');

const ADMIN_PASSWORD = 'password123'; // Change this to desired password
const ADMIN_EMAIL = 'admin@hacofood.vn';
const ADMIN_NAME = 'Bếp Cô Hạ';

console.log('Creating admin account...\n');

bcrypt.hash(ADMIN_PASSWORD, 10).then(hash => {
  console.log('Hash password:', hash);
  console.log('\nSQL Query to run:\n');
  console.log(`
INSERT INTO staff (name, email, password_hash, role, status, created_at)
VALUES (
  '${ADMIN_NAME}',
  '${ADMIN_EMAIL}',
  '${hash}',
  'admin',
  'active',
  NOW()
);
  `);
  console.log('\nOR use psql:\n');
  console.log(`
psql -U postgres -d hacofood -c "INSERT INTO staff (name, email, password_hash, role, status, created_at) VALUES ('${ADMIN_NAME}', '${ADMIN_EMAIL}', '${hash}', 'admin', 'active', NOW());"
  `);
  console.log('\nLogin credentials:');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('\nChange PASSWORD variable in this script to set different password.');
}).catch(err => {
  console.error('Error hashing password:', err);
  process.exit(1);
});
