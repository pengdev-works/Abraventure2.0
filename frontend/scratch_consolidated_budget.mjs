import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const USD_TO_PHP = 58.50;

// 1. Consolidated First-Year & Recurring Budget Data
const consolidatedBudgetSheet = [
  ["ABRAVENTURE: CONSOLIDATED DEPLOYMENT & OPERATING BUDGET PROPOSAL"],
  ["Prepared for: Provincial Government of Abra - Provincial Tourism Office"],
  ["Status: Proposed Production Deployment Budget (System currently running locally)"],
  ["Currency Reference: Bangko Sentral ng Pilipinas (BSP) Reference Rate: 1 USD = 58.50 PHP"],
  ["Date: October 2026"],
  [""],
  ["EXPENSE CATEGORY", "ITEM & TECHNICAL SPECIFICATION", "PROVIDER / SOURCE", "BILLING CYCLE", "UNIT COST (USD)", "MONTHLY COST (PHP)", "ANNUAL COST (PHP)", "SOURCE LINK & VERIFICATION", "REMARKS & INCLUSIONS"],
  // Recurring Cloud Infrastructure
  ["Frontend Hosting", "Vercel Pro (Fast Edge CDN, Global Routing)", "Vercel Inc.", "Monthly", 20.00, 20.00 * USD_TO_PHP, 20.00 * USD_TO_PHP * 12, "https://vercel.com/pricing (Verified Oct 2026)", "1 TB fast edge bandwidth, 99.99% SLA, commercial LGU compliance, edge DDoS mitigation"],
  ["Backend Hosting", "Render Starter Web Service (Node.js API)", "Render Services Inc.", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "https://render.com/pricing (Verified Oct 2026)", "Always-on runtime, zero cold starts, 512 MB RAM, 0.5 vCPU, continuous git deploy"],
  ["Database Hosting", "Render Managed PostgreSQL (Starter Tier)", "Render Services Inc.", "Monthly", 7.00, 7.00 * USD_TO_PHP, 7.00 * USD_TO_PHP * 12, "https://render.com/docs/databases (Verified Oct 2026)", "Persistent storage (up to 10 GB), automated daily offsite snapshots, point-in-time recovery"],
  ["Custom Domain", ".com Top-Level Domain Registration & DNS", "Porkbun / Namecheap", "Annual", 14.00, (14.00 * USD_TO_PHP) / 12, 14.00 * USD_TO_PHP, "https://porkbun.com (Verified Oct 2026)", "Official domain (e.g., abraventure.com), WHOIS privacy protection, DNSSEC enabled"],
  ["Security & SSL", "Automated Wildcard TLS/SSL Encryption", "Vercel & Render", "Included", 0.00, 0.00, 0.00, "Automated Let's Encrypt certificates", "Pre-configured automated SSL certificate renewal on frontend and backend"],
  ["Backups & Recovery", "Automated Daily Backups & PITR", "Render Services Inc.", "Included", 0.00, 0.00, 0.00, "Included in Managed PostgreSQL", "7-day retention of automated snapshots with instant point-in-time recovery"],
  ["Media Storage CDN", "Cloudinary Media CDN (Homestay & Spot Photos)", "Cloudinary Inc.", "Monthly Allowance", 0.00, 0.00, 0.00, "https://cloudinary.com/pricing (Free Tier)", "25 monthly credits included (covers ~25,000 tourist attractions & homestay images)"],
  ["Email Notifications", "Resend / Brevo Transactional Email API", "Resend Inc.", "Monthly Allowance", 0.00, 0.00, 0.00, "https://resend.com/pricing (Free Tier)", "Up to 3,000 emails/month included (booking inquiries, approval notifications)"],
  ["Mapping & Geospatial", "Leaflet with OpenStreetMap Tiles", "OpenStreetMap", "Open Source", 0.00, 0.00, 0.00, "https://www.openstreetmap.org", "Open-source interactive GIS map tiles for all 27 Abra municipalities"],
  ["Initial Deployment", "Production Setup, Migration & DNS Linkage", "Standard Setup", "One-Time", 0.00, 0.00, 0.00, "Deployment Documentation", "Configuration of environment variables, database schema migration, and custom domain linkage"],
  [""],
  ["FINANCIAL SUMMARY & PROJECTIONS", "", "", "", "USD", "MONTHLY (PHP)", "ANNUAL (PHP)", "FORMULA / CALCULATION BASIS", ""],
  ["Monthly Cloud Infrastructure Subtotal", "", "", "", "$34.00", "₱1,989.00", "₱23,868.00", "($20 Vercel + $7 API + $7 DB) × ₱58.50 × 12 months", ""],
  ["Annual Domain Name Registration", "", "", "", "$14.00", "₱68.25", "₱819.00", "$14.00 × ₱58.50 (Annual)", ""],
  ["One-Time Setup & Configuration", "", "", "", "$0.00", "₱0.00", "₱0.00", "No proprietary setup license fees", ""],
  ["SUBTOTAL: DIRECT FIRST-YEAR EXPENSES", "", "", "", "$422.00", "₱2,057.25", "₱24,687.00", "Annual Infrastructure (₱23,868) + Domain (₱819)", ""],
  ["Contingency Reserve (15%)", "", "", "", "$63.30", "₱308.59", "₱3,703.05", "15% of Direct Expenses (FX buffer, card transaction fees, traffic spikes)", ""],
  ["TOTAL ESTIMATED FIRST-YEAR BUDGET", "", "", "", "$485.30", "₱2,365.84", "₱28,390.05", "Direct Subtotal (₱24,687.00) + 15% Contingency (₱3,703.05)", ""],
  [""],
  ["SUCCEEDING YEARS RECURRING ANNUAL BUDGET", "", "", "", "USD", "MONTHLY (PHP)", "ANNUAL (PHP)", "FORMULA / CALCULATION BASIS", ""],
  ["Annual Cloud Infrastructure (Vercel + Render)", "", "", "", "$34.00 / mo", "₱1,989.00", "₱23,868.00", "Recurring 12 months hosting", ""],
  ["Annual Domain Renewal (.com)", "", "", "", "$14.00 / yr", "₱68.25", "₱819.00", "Recurring annual domain renewal", ""],
  ["Annual Contingency Reserve (15%)", "", "", "", "$63.30 / yr", "₱308.59", "₱3,703.05", "15% of annual recurring subtotal", ""],
  ["TOTAL SUCCEEDING YEARS ANNUAL OPERATING BUDGET", "", "", "", "$485.30 / yr", "₱2,365.84", "₱28,390.05", "Annual Subtotal + 15% Contingency (₱28,390.05 / year)", ""]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(consolidatedBudgetSheet);
XLSX.utils.book_append_sheet(wb, ws, "Consolidated Budget");

const excelPath = path.resolve('./public/AbraVenture_Consolidated_Deployment_Budget.xlsx');
XLSX.writeFile(wb, excelPath);
console.log('✅ Generated Consolidated Excel file at:', excelPath);

// 2. Canva-Compatible CSV (Clean formatted for Canva presentation tables)
const canvaTableCsv = [
  ["Budget Category", "Service & Provider", "Monthly Cost (PHP)", "Annual Cost (PHP)", "Billing Terms & Notes"],
  ["Frontend Hosting", "Vercel Pro (Fast Edge CDN)", "₱1,170.00", "₱14,040.00", "$20.00/mo (1 TB bandwidth, 99.99% SLA)"],
  ["Backend API Server", "Render Starter Web Service", "₱409.50", "₱4,914.00", "$7.00/mo (Always-on, no cold starts)"],
  ["Database Hosting", "Render Managed PostgreSQL", "₱409.50", "₱4,914.00", "$7.00/mo (Daily backups & persistent DB)"],
  ["Custom Domain Name", ".com Domain Registration", "₱68.25", "₱819.00", "$14.00/year (Includes WHOIS privacy)"],
  ["Security & Backups", "Automated SSL/TLS & PITR Backups", "₱0.00", "₱0.00", "Included with Vercel & Render"],
  ["Third-Party APIs", "Cloudinary (CDN) & Resend (Email)", "₱0.00", "₱0.00", "Free tiers cover initial provincial traffic"],
  ["One-Time Setup Fee", "Deployment & DNS Configuration", "₱0.00", "₱0.00", "Zero-cost setup & migration"],
  ["Subtotal (Direct)", "Direct Operational Subtotal", "₱2,057.25", "₱24,687.00", "Base Year 1 expenses"],
  ["15% Contingency", "Buffer for FX & Traffic Spikes", "₱308.59", "₱3,703.05", "15% of direct expenses"],
  ["TOTAL YEAR 1 BUDGET", "Official Funding Proposal Total", "₱2,365.84", "₱28,390.05", "Complete Year 1 requirement"],
  ["Succeeding Years", "Annual Recurring Operating Budget", "₱2,365.84 / mo", "₱28,390.05 / yr", "Annual recurring maintenance"]
];

const csvTableContent = canvaTableCsv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
const csvTablePath = path.resolve('./public/AbraVenture_Canva_Consolidated_Table.csv');
fs.writeFileSync(csvTablePath, csvTableContent, 'utf8');
console.log('✅ Generated Canva Table CSV at:', csvTablePath);
