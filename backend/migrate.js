import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const run = async () => {
  const client = await pool.connect();
  try {
    console.log('Running migration...');

    await client.query(`
      ALTER TABLE municipal_dot_profiles
        ADD COLUMN IF NOT EXISTS office_name      VARCHAR(255),
        ADD COLUMN IF NOT EXISTS contact_phone    VARCHAR(50),
        ADD COLUMN IF NOT EXISTS contact_email    VARCHAR(255),
        ADD COLUMN IF NOT EXISTS status           account_status DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ municipal_dot_profiles updated');

    await client.query(`ALTER TABLE tour_guide_profiles ALTER COLUMN price_rate SET DEFAULT 0.00;`);
    console.log('✅ tour_guide_profiles price_rate default set');

    // Add MUNICIPAL_OFFICE to requirement_target enum if missing
    const enumCheck = await client.query(`
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'MUNICIPAL_OFFICE'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'requirement_target')
    `);
    if (enumCheck.rows.length === 0) {
      await client.query(`ALTER TYPE requirement_target ADD VALUE 'MUNICIPAL_OFFICE';`);
      console.log('✅ requirement_target enum updated');
    } else {
      console.log('ℹ️  MUNICIPAL_OFFICE already in enum, skipping');
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
