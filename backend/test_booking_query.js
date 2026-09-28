import pool from './config/db.js';

async function main() {
  const role = 'MUNICIPAL_DOT';
  const municipality_id = 11;

  let q = `
    SELECT tpb.id, tpb.booking_reference, tpb.status, tpb.payment_status,
           tpb.package_id AS tour_package_id,
           p.title AS package_title, p.municipality_id, p.package_type,
           creator.role AS package_creator_role,
           m.name AS municipality_name,
           CASE 
             WHEN p.package_type IN ('MULTI_MUNICIPALITY', 'PROVINCIAL') OR creator.role = 'PROVINCIAL_DOT' THEN 'PROVINCIAL'
             ELSE 'MUNICIPAL'
           END AS reviewing_authority
    FROM tour_package_bookings tpb
    JOIN packages p ON tpb.package_id = p.id
    JOIN municipalities m ON p.municipality_id = m.id
    LEFT JOIN user_accounts creator ON p.created_by = creator.id
    WHERE 1=1`;

  const params = [];
  if (role === 'MUNICIPAL_DOT') {
    params.push(municipality_id);
    q += ` AND (
      p.municipality_id = $${params.length}
      OR EXISTS (SELECT 1 FROM package_municipalities pm WHERE pm.package_id = p.id AND pm.municipality_id = $${params.length})
      OR EXISTS (SELECT 1 FROM package_items pi JOIN tourist_attractions ta ON pi.attraction_id = ta.id WHERE pi.package_id = p.id AND ta.municipality_id = $${params.length})
    )`;
  }

  const r = await pool.query(q, params);
  console.log('Results for Lagayan DOT (muni_id=11):');
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
