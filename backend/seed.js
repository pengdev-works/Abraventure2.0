import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const municipalities = [
  { name: 'Bangued', description: 'The capital municipality of Abra, known for its Victoria Park and San Lorenzo Climaco Shrine.' },
  { name: 'Boliney', description: 'Home to majestic mountains and hot springs, rich in cultural tribal traditions.' },
  { name: 'Bucay', description: 'Historical municipality hosting the ruins of the first Spanish provincial capitol.' },
  { name: 'Bucloc', description: 'A scenic highland town featuring traditional terraces and cultural communities.' },
  { name: 'Daguioman', description: 'A remote mountainous municipality known for pristine rivers and upland agriculture.' },
  { name: 'Danglas', description: 'Famous for its pine forests and agricultural farms, offering calm nature trails.' },
  { name: 'Dolores', description: 'Well-known for the historical Libtec Crystal Cave and sprawling agricultural fields.' },
  { name: 'La Paz', description: 'Known for traditional loom weaving (Abel) and agricultural rice production.' },
  { name: 'Lacub', description: 'Surrounded by pine-clad mountains, offering rugged hiking and historical caves.' },
  { name: 'Lagangilang', description: 'Center for education and agricultural experiments, hosting scenic riverbanks.' },
  { name: 'Lagayan', description: 'Home to the Lusuac Dam and various natural swimming spots.' },
  { name: 'Langiden', description: 'Lies along the Abra River, known for bamboo crafts and fishing.' },
  { name: 'Licuan-Baay', description: 'Gateway to the highland gold rush area and home to scenic mountain passes.' },
  { name: 'Luba', description: 'Famous for the historical Luba-Tubo hanging bridge and pristine mountain views.' },
  { name: 'Malibcong', description: 'Famous for the Boliney-Malibcong pine forests and clean headwaters.' },
  { name: 'Manabo', description: 'Known for its historical irrigation canals and agricultural rice bowls.' },
  { name: 'Peñarrubia', description: 'A close neighbor of Bangued, proud of its rich Tingguian heritage.' },
  { name: 'Pidigan', description: 'Known for its historical brick church, agricultural farms, and local sweets.' },
  { name: 'Pilar', description: 'Home of the historic Bolbolo waterfalls and agricultural landscapes.' },
  { name: 'Sallapadan', description: 'Known for the scenic Sallapadan river and warm upland hospitality.' },
  { name: 'San Isidro', description: 'An agricultural hub producing rice, tobacco, and high-value crops.' },
  { name: 'San Juan', description: 'An educational center in the northern part of Abra, hosting historical markers.' },
  { name: 'San Quintin', description: 'The gateway municipality to Abra from Ilocos Sur, hosting the Tangadan Tunnel.' },
  { name: 'Tayum', description: 'Famous for its colonial-era brick houses and the majestic Santa Catalina de Alejandria Church.' },
  { name: 'Tineg', description: 'Home to the famous Kaparkan Falls (Mulawin Falls) and massive forest reserves.' },
  { name: 'Tubo', description: 'The southernmost town of Abra, bordered by high peaks and famous for traditional culture.' },
  { name: 'Villaviciosa', description: 'Known for the Kimkimay Lake and agricultural farms.' }
];

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // 1. Run Schema DDL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Initializing schema...');
    await pool.query(schemaSql);
    console.log('Schema initialized successfully.');

    // 2. Seed Municipalities
    console.log('Seeding municipalities...');
    for (const m of municipalities) {
      await pool.query(
        `INSERT INTO municipalities (name, description, featured_image_url) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [m.name, m.description, `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=90`]
      );
    }
    console.log('Municipalities seeded successfully.');

    // 3. Seed Provincial DOT Admin
    console.log('Seeding Provincial DOT Admin...');
    const email = 'provincial@dot.abra.gov.ph';
    const existingAdmin = await pool.query('SELECT * FROM user_accounts WHERE email = $1', [email]);

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await pool.query(
        `INSERT INTO user_accounts (email, password_hash, role, full_name, phone_number, status)
         VALUES ($1, $2, 'PROVINCIAL_DOT', 'Abra Provincial Tourism Office', '0917-123-4567', 'APPROVED')`,
        [email, passwordHash]
      );
      console.log('Provincial DOT Admin account created (provincial@dot.abra.gov.ph / password123)');
    } else {
      console.log('Provincial DOT Admin account already exists.');
    }

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seed();
