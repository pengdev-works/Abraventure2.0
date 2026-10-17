import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';

async function testGoogleAuth() {
  console.log('Testing Google Tourist Auth Logic...');
  const testEmail = 'google_tourist_test_' + Date.now() + '@gmail.com';
  const testFullName = 'Google Test Tourist';

  try {
    // 1. Simulate loginGoogleTourist creation
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertRes = await client.query(
        `INSERT INTO user_accounts (email, password_hash, role, full_name, status)
         VALUES ($1, $2, 'TOURIST', $3, 'APPROVED')
         RETURNING id, email, role, full_name, status`,
        [testEmail, 'dummy_hash', testFullName]
      );

      const user = insertRes.rows[0];
      console.log('✅ Created user:', user.email, 'Role:', user.role);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name, status: user.status },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Verified JWT token for user:', decoded.email, 'Role:', decoded.role);

      // Clean up test user
      await client.query('DELETE FROM user_accounts WHERE id = $1', [user.id]);
      await client.query('COMMIT');
      console.log('✅ Cleaned up test user successfully');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    console.log('🎉 Google Auth test passed!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testGoogleAuth();
