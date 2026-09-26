/**
 * Password Reset Utility — Abraventure
 * Run: node tests/resetTouristPassword.mjs
 * 
 * Resets the password for tourist@gmail.com to: Tourist@2026
 */
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const TARGET_EMAIL = 'tourist@gmail.com';
const NEW_PASSWORD = 'Tourist@2026'; // Meets policy: uppercase, lowercase, number, special char

async function resetPassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, salt);

    const result = await pool.query(
      `UPDATE user_accounts SET password_hash = $1, updated_at = NOW()
       WHERE LOWER(email) = $2
       RETURNING id, email, role, status`,
      [passwordHash, TARGET_EMAIL.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.error(`❌ No account found with email: ${TARGET_EMAIL}`);
    } else {
      const u = result.rows[0];
      console.log(`\n✅ Password reset successfully!`);
      console.log(`   Email   : ${u.email}`);
      console.log(`   Role    : ${u.role}`);
      console.log(`   Status  : ${u.status}`);
      console.log(`   Password: ${NEW_PASSWORD}`);
      console.log(`\n   You can now log in with these credentials at the Tourist Login page.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
