import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Exchange rate
const USD_TO_PHP = 58.50;

// Scenario A: Provincial LGU Ownership
// Scenario B: Student Proponents SLA/Retained Operation

const scenarioA_Data = [
  ["CATEGORY", "ITEM & SPECIFICATION", "PROVIDER / SOURCE", "BILLING CYCLE", "COST (USD)", "COST (PHP @ 58.50)", "ANNUAL TOTAL (PHP)", "NOTES / COVERAGE"],
  // Infrastructure Recurring
  ["Hosting & Compute", "Vercel Pro (Frontend Hosting & Edge CDN)", "Vercel Inc. (vercel.com/pricing)", "Monthly", 20.00, 20.00 * USD_TO_PHP, 20.00 * USD_TO_PHP * 12, "1 TB bandwidth, 99.99% SLA, commercial LGU compliance, global edge caching"],
  ["Hosting & Compute", "Render Starter Web Service (Node.js API)", "Render Services Inc. (render.com/pricing)", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "Always-on (zero cold start), 512 MB RAM, 0.5 vCPU, automated TLS/SSL"],
  ["Database & Storage", "Render Managed PostgreSQL (Basic/Starter)", "Render Services Inc. (render.com/pricing)", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "Persistent storage (up to 10 GB), point-in-time recovery, automated daily backups"],
  ["Domain & Security", "Custom Domain (.com registration & DNS)", "Porkbun / Namecheap / Registrar", "Annual", 14.00, 14.00 * USD_TO_PHP, 14.00 * USD_TO_PHP, "Includes WHOIS privacy protection, DNSSEC, and automated Let's Encrypt SSL"],
  ["Media & Notifications", "Cloudinary (Media CDN) & Resend (Transactional Email)", "Cloudinary & Resend Free Tiers", "Monthly", 0.00, 0.00, 0.00, "25 credits Cloudinary (homestay photos), 3,000 emails/mo (booking alerts)"],
  // Labor & Operations
  ["Operations & Support", "In-House IT / Tourism Officer Maintenance Allocation", "Provincial LGU Staff / Organic Personnel", "Monthly", 0.00, 0.00, 0.00, "Absorbed under existing Provincial Government IT / Tourism personnel regular payroll"],
  ["Setup & Migration", "Initial Production Deployment & Server Configuration", "Student Capstone Team (Pro Bono)", "One-Time", 0.00, 0.00, 0.00, "Zero-cash student capstone handover and technical knowledge transfer (pro bono)"]
];

const scenarioB_Data = [
  ["CATEGORY", "ITEM & SPECIFICATION", "PROVIDER / SOURCE", "BILLING CYCLE", "COST (USD)", "COST (PHP @ 58.50)", "ANNUAL TOTAL (PHP)", "NOTES / COVERAGE"],
  // Infrastructure Recurring
  ["Hosting & Compute", "Vercel Pro (Frontend Hosting & Edge CDN)", "Vercel Inc. (vercel.com/pricing)", "Monthly", 20.00, 20.00 * USD_TO_PHP, 20.00 * USD_TO_PHP * 12, "Commercial production tier, team access, custom domain SSL"],
  ["Hosting & Compute", "Render Starter Web Service (Node.js API)", "Render Services Inc. (render.com/pricing)", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "Always-on runtime, zero sleep mode, automated continuous deployment from Git"],
  ["Database & Storage", "Render Managed PostgreSQL (Basic/Starter)", "Render Services Inc. (render.com/pricing)", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "Persistent PostgreSQL, daily automated offsite snapshots, disaster recovery"],
  ["Domain & Security", "Custom Domain (.com registration & renewal)", "Porkbun / Namecheap", "Annual", 14.00, 14.00 * USD_TO_PHP, 14.00 * USD_TO_PHP, "Official domain name with free annual SSL renewal & privacy protection"],
  ["Media & Notifications", "Cloudinary & Resend / Brevo Notifications", "Cloudinary / Resend API", "Monthly", 0.00, 0.00, 0.00, "Standard tier within free operational allowances"],
  // Student Support Retainer
  ["Technical Support & SLA", "Student Technical Support Retainer & Bug-Fix SLA", "Capstone Developer Team (3 Proponents)", "Monthly", 85.47, 5000.00, 60000.00, "₱5,000/mo team honorarium for scheduled patching, DB optimization, audit log monitoring, DOT user support"],
  ["Setup & Migration", "Initial Production Deployment & LGU Staff Training", "Capstone Developer Team", "One-Time", 51.28, 3000.00, 3000.00, "One-time training workshop & documentation handover for Municipal & Provincial tourism officers"]
];

const costSummaryData = [
  ["METRIC / COMPONENT", "SCENARIO A (PROVINCIAL OWNERSHIP)", "SCENARIO B (STUDENT SLA RETAINER)", "BASIS & FORMULA"],
  ["Monthly Cloud Infrastructure (USD)", "$34.00", "$34.00", "Vercel Pro ($20) + Render API ($7) + Render DB ($7)"],
  ["Monthly Cloud Infrastructure (PHP)", "₱1,989.00", "₱1,989.00", "$34.00 × ₱58.50"],
  ["Annualized Cloud Infrastructure (PHP)", "₱23,868.00", "₱23,868.00", "₱1,989.00 × 12 months"],
  ["Annual Domain Registration (PHP)", "₱819.00", "₱819.00", "$14.00 / year × ₱58.50"],
  ["Annual Technical Support / Retainer (PHP)", "₱0.00 (In-House Staff)", "₱60,000.00", "₱5,000.00 / month × 12 months"],
  ["One-Time Setup & Training (PHP)", "₱0.00 (Pro Bono Handover)", "₱3,000.00", "One-time technical documentation & LGU training"],
  ["SUBTOTAL: Year 1 Direct Expenses (PHP)", "₱24,687.00", "₱87,687.00", "Infrastructure + Domain + Labor/Retainer + Setup"],
  ["Contingency Reserve (15%)", "₱3,703.05", "₱13,153.05", "15% buffer for FX swings, bank fees, and bandwidth spikes"],
  ["TOTAL YEAR 1 BUDGET (PHP)", "₱28,390.05", "₱100,840.05", "Subtotal + 15% Contingency Reserve"],
  ["TOTAL YEAR 1 BUDGET (USD)", "$485.30", "$1,723.76", "Total (PHP) ÷ ₱58.50"],
  ["", "", "", ""],
  ["SUCCEEDING YEARS ANNUAL OPERATING BUDGET", "SCENARIO A", "SCENARIO B", ""],
  ["Annual Infrastructure & Domain (PHP)", "₱24,687.00", "₱24,687.00", "Recurring hosting ($34/mo) + domain renewal ($14/yr)"],
  ["Annual Technical Support / SLA (PHP)", "₱0.00", "₱60,000.00", "Recurring technical support"],
  ["Annual Contingency Reserve (15%)", "₱3,703.05", "₱12,703.05", "15% of annual recurring costs"],
  ["TOTAL SUCCEEDING YEARS ANNUAL BUDGET (PHP)", "₱28,390.05", "₱97,390.05", "Annual Subtotal + 15% Contingency"]
];

const wb = XLSX.utils.book_new();

const wsSummary = XLSX.utils.aoa_to_sheet(costSummaryData);
const wsScenarioA = XLSX.utils.aoa_to_sheet(scenarioA_Data);
const wsScenarioB = XLSX.utils.aoa_to_sheet(scenarioB_Data);

XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");
XLSX.utils.book_append_sheet(wb, wsScenarioA, "Scenario A - LGU In-House");
XLSX.utils.book_append_sheet(wb, wsScenarioB, "Scenario B - Student SLA");

// Write Excel workbook
const excelPath = path.resolve('./public/AbraVenture_Deployment_Budget_Proposal.xlsx');
XLSX.writeFile(wb, excelPath);
console.log('✅ Generated Excel file at:', excelPath);

// Write Canva-Compatible CSV
const canvaCsvData = [
  ["Budget Category", "Scenario A (LGU In-House)", "Scenario B (Student SLA)", "Billing Terms"],
  ["Frontend Hosting (Vercel Pro)", "₱14,040.00", "₱14,040.00", "₱1,170.00 / month ($20)"],
  ["Backend API (Render Starter)", "₱4,914.00", "₱4,914.00", "₱409.50 / month ($7)"],
  ["Database (Render Managed PostgreSQL)", "₱4,914.00", "₱4,914.00", "₱409.50 / month ($7)"],
  ["Domain Name (.com) & SSL", "₱819.00", "₱819.00", "₱819.00 / year ($14)"],
  ["Technical Support & Maintenance", "₱0.00 (In-House)", "₱60,000.00", "₱5,000.00 / month"],
  ["One-Time Setup & LGU Training", "₱0.00 (Pro Bono)", "₱3,000.00", "One-time cost"],
  ["Subtotal (Direct Expenses)", "₱24,687.00", "₱87,687.00", "Year 1 Base"],
  ["15% Contingency Reserve", "₱3,703.05", "₱13,153.05", "Buffer for FX & Bandwidth"],
  ["TOTAL YEAR 1 BUDGET (PHP)", "₱28,390.05", "₱100,840.05", "Official Proposal Total"],
  ["Succeeding Years (Annual PHP)", "₱28,390.05 / year", "₱97,390.05 / year", "Subsequent Annual Cost"]
];

const csvContent = canvaCsvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
const csvPath = path.resolve('./public/AbraVenture_Canva_Budget_Summary.csv');
fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log('✅ Generated Canva CSV at:', csvPath);
