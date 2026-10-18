import fs from 'fs';
import path from 'path';

// Clean numeric chart data for Canva Chart (No currency symbols or text in number columns)
const chartData = [
  ["Expense Item", "Scenario A (LGU In-House)", "Scenario B (Student SLA)"],
  ["Frontend (Vercel Pro)", 14040, 14040],
  ["Backend API (Render)", 4914, 4914],
  ["Database (PostgreSQL)", 4914, 4914],
  ["Custom Domain & SSL", 819, 819],
  ["Technical Support & SLA", 0, 60000],
  ["Setup & Staff Training", 0, 3000],
  ["15% Contingency Reserve", 3703, 13153]
];

const csvRows = chartData.map(row => row.join(',')).join('\n');
const filePath = path.resolve('./public/AbraVenture_Canva_Chart_Data.csv');
fs.writeFileSync(filePath, csvRows, 'utf8');
console.log('✅ Generated Canva Chart CSV at:', filePath);
