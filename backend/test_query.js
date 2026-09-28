import pool from './config/db.js';

async function test() {
  try {
    const res = await pool.query(`
      SELECT tpb.id, tpb.booking_reference, tpb.status, tpb.payment_status, 
             p.title, p.municipality_id, p.package_type, creator.role as creator_role,
             CASE 
               WHEN p.package_type = 'MULTI_MUNICIPALITY' OR creator.role = 'PROVINCIAL_DOT' THEN 'PROVINCIAL'
               ELSE 'MUNICIPAL'
             END AS reviewing_authority
      FROM tour_package_bookings tpb
      JOIN packages p ON tpb.package_id = p.id
      LEFT JOIN user_accounts creator ON p.created_by = creator.id
    `);
    console.log('BOOKINGS IN DB:', JSON.stringify(res.rows, null, 2));

    const pm = await pool.query('SELECT * FROM package_municipalities');
    console.log('PACKAGE_MUNICIPALITIES:', pm.rows);

    const pi = await pool.query('SELECT pi.*, ta.name as attraction_name, ta.municipality_id FROM package_items pi JOIN tourist_attractions ta ON pi.attraction_id = ta.id');
    console.log('PACKAGE_ITEMS:', pi.rows);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();
