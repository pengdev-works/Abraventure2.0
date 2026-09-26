import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const TEST_EMAIL = 'tourist@gmail.com'; // Known account from DB
const TEST_PASS = 'Tourist123!'; // Try common test password

async function checkAccounts() {
  try {
    // Check all tourist accounts
    const result = await pool.query(
      `SELECT id, email, role, status, 
       SUBSTRING(password_hash, 1, 20) as hash_prefix 
       FROM user_accounts WHERE role = 'TOURIST' LIMIT 10`
    );
    console.log('\n=== TOURIST ACCOUNTS ===');
    console.log('Count:', result.rows.length);
    result.rows.forEach(r => {
      console.log(`  Email: ${r.email} | Status: ${r.status} | Hash starts: ${r.hash_prefix}...`);
    });

    // Check if a specific email exists (any role)
    const emailCheck = await pool.query(
      `SELECT id, email, role, status FROM user_accounts WHERE LOWER(email) = $1`,
      [TEST_EMAIL.toLowerCase()]
    );
    console.log(`\n=== EMAIL CHECK (${TEST_EMAIL}) ===`);
    if (emailCheck.rows.length === 0) {
      console.log('  ❌ Email NOT FOUND in database');
    } else {
      const u = emailCheck.rows[0];
      console.log(`  ✅ Found: role=${u.role}, status=${u.status}`);
      
      // Test password match
      const fullUser = await pool.query(
        `SELECT password_hash FROM user_accounts WHERE LOWER(email) = $1`,
        [TEST_EMAIL.toLowerCase()]
      );
      const match = await bcrypt.compare(TEST_PASS, fullUser.rows[0].password_hash);
      console.log(`  Password match for "${TEST_PASS}": ${match ? '✅ YES' : '❌ NO'}`);
    }

  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAccounts();
