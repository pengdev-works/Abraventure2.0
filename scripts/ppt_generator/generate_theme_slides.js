const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function generateAbraventurePresentation() {
  const pptx = new pptxgen();

  // Widescreen 16:9 (13.33 x 7.5 inches)
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Abraventure Team & Provincial Tourism Office of Abra';
  pptx.company = 'Abraventure Integrated Tourism Platform';
  pptx.title = 'Abraventure - Project Presentation & Proposal';

  // ─── COLOR PALETTE (From the Uploaded Visual Theme) ─────────
  const C_FOREST = '1B3B22';       // Deep forest green (Brand primary, header, headings)
  const C_FOREST_DARK = '112616';  // Deepest forest tone for contrast
  const C_OLIVE = '4D6B43';        // Natural olive/sage green (card borders, accents)
  const C_SAGE_LIGHT = 'E3ECE0';   // Light sage card fill (Key Features container)
  const C_SAGE_TINT = 'EDF3EB';    // Subtle sage background tint
  const C_CREAM = 'FAF8F3';        // Warm off-white background
  const C_WHITE = 'FFFFFF';        // Crisp card background
  const C_GOLD = 'C88E3B';         // Warm amber/gold for sun, stars, and underlines
  const C_GOLD_LIGHT = 'DFAC5E';   // Soft gold accent
  const C_TEXT = '1C2B1E';         // Primary body text
  const C_MUTED = '4E5B4F';        // Muted secondary text
  const C_BORDER_LIGHT = 'D5E0D2'; // Soft subtle borders

  // Image assets
  const logoPath = path.resolve(__dirname, '../../frontend/public/abraventure-logo.png');
  const sunsetPath = path.resolve(__dirname, '../../frontend/public/uploads/apao-rolling-hills-sunset.jpg');
  const churchPath = path.resolve(__dirname, '../../frontend/public/uploads/tayum-baroque-church.jpg');
  const fallsPath = path.resolve(__dirname, '../../frontend/public/uploads/kaparkan-falls.jpg');
  const weavingPath = path.resolve(__dirname, '../../frontend/public/uploads/abel-weaving-tingguian.jpg');
  const emeraldPath = path.resolve(__dirname, '../../frontend/public/uploads/kaparkan-travertine-emerald.jpg');

  const hasLogo = fs.existsSync(logoPath);
  const hasSunset = fs.existsSync(sunsetPath);
  const hasChurch = fs.existsSync(churchPath);
  const hasFalls = fs.existsSync(fallsPath);
  const hasWeaving = fs.existsSync(weavingPath);
  const hasEmerald = fs.existsSync(emeraldPath);

  // Helper: Standard Slide Header & Footer for consistent theme
  const addSlideTemplateHeader = (slide, category, title) => {
    // Top decorative bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.33, h: 0.1,
      fill: { color: C_FOREST }
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0.1, w: 13.33, h: 0.03,
      fill: { color: C_GOLD }
    });

    // Small Logo top-right
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 11.8, y: 0.3, w: 1.1, h: 0.65
      });
    }

    // Category / Eyebrow pill badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.35, w: Math.max(1.8, category.length * 0.11), h: 0.32,
      rectRadius: 0.16,
      fill: { color: C_SAGE_LIGHT },
      line: { color: C_OLIVE, width: 1 }
    });
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.38, w: Math.max(1.8, category.length * 0.11), h: 0.26,
      fontSize: 8, bold: true, color: C_FOREST,
      fontFace: 'Segoe UI', align: 'center', charSpacing: 1.5
    });

    // Main Title
    slide.addText(title, {
      x: 0.8, y: 0.72, w: 10.5, h: 0.65,
      fontSize: 22, bold: true, color: C_FOREST,
      fontFace: 'Georgia'
    });

    // Gold underline
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 1.4, w: 1.8, h: 0,
      line: { color: C_GOLD, width: 2.5 }
    });

    // Slide Footer
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 7.0, w: 11.73, h: 0,
      line: { color: C_BORDER_LIGHT, width: 1 }
    });
    slide.addText('ABRAVENTURE · INTEGRATED TOURISM PLATFORM · PROVINCE OF ABRA', {
      x: 0.8, y: 7.06, w: 8.0, h: 0.25,
      fontSize: 8, color: C_MUTED, fontFace: 'Segoe UI', charSpacing: 1
    });
    slide.addText('EXPLORE • EXPERIENCE • PRESERVE', {
      x: 8.5, y: 7.06, w: 4.0, h: 0.25,
      fontSize: 8, color: C_GOLD, fontFace: 'Segoe UI', align: 'right', bold: true, charSpacing: 1
    });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 1: TITLE SLIDE
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };

    // Decorative background curve / container on right side with scenic photo
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.2, y: 0.5, w: 5.6, h: 6.5,
      rectRadius: 0.25,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 2 }
    });

    if (hasSunset) {
      slide.addImage({
        path: sunsetPath,
        x: 7.35, y: 0.65, w: 5.3, h: 4.1
      });
    }

    // Mini overlay polaroid on right
    if (hasChurch) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 6.5, y: 4.1, w: 3.2, h: 2.7,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.5 }
      });
      slide.addImage({
        path: churchPath,
        x: 6.65, y: 4.25, w: 2.9, h: 1.95
      });
      slide.addText('Historic Tayum Baroque Church', {
        x: 6.65, y: 6.25, w: 2.9, h: 0.4,
        fontSize: 9, italic: true, color: C_MUTED, fontFace: 'Georgia', align: 'center'
      });
    }

    // Right side caption box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 9.8, y: 5.0, w: 2.8, h: 1.7,
      rectRadius: 0.15,
      fill: { color: C_SAGE_LIGHT },
      line: { color: C_OLIVE, width: 1.2 }
    });
    slide.addText('Discover Abra,\nDigitally ☀', {
      x: 9.9, y: 5.15, w: 2.6, h: 0.8,
      fontSize: 16, bold: true, color: C_FOREST, fontFace: 'Georgia', align: 'center'
    });
    slide.addText('Connecting 27 Municipalities to the World', {
      x: 9.9, y: 5.95, w: 2.6, h: 0.65,
      fontSize: 9, color: C_MUTED, fontFace: 'Segoe UI', align: 'center'
    });

    // Left Content Area
    // Logo
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 0.8, y: 0.8, w: 2.4, h: 1.3
      });
    } else {
      slide.addText('🏔️ ABRAVENTURE', {
        x: 0.8, y: 0.8, w: 5.5, h: 0.8,
        fontSize: 28, bold: true, color: C_FOREST, fontFace: 'Georgia'
      });
    }

    slide.addText('EXPLORE  •  EXPERIENCE  •  PRESERVE', {
      x: 0.8, y: 2.2, w: 5.5, h: 0.35,
      fontSize: 11, bold: true, color: C_GOLD, fontFace: 'Segoe UI', charSpacing: 3
    });

    // Tagline Pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.7, w: 4.8, h: 0.4,
      rectRadius: 0.2,
      fill: { color: C_SAGE_LIGHT },
      line: { color: C_OLIVE, width: 1 }
    });
    slide.addText('CENTRALIZED TOURISM & HOMESTAY MANAGEMENT PLATFORM', {
      x: 0.9, y: 2.75, w: 4.6, h: 0.3,
      fontSize: 8.5, bold: true, color: C_FOREST, fontFace: 'Segoe UI', align: 'center', charSpacing: 0.8
    });

    // Main Presentation Heading
    slide.addText('Comprehensive Project Proposal & System Architecture', {
      x: 0.8, y: 3.3, w: 5.6, h: 1.4,
      fontSize: 27, bold: true, color: C_FOREST, fontFace: 'Georgia', lineSpacing: 32
    });

    // Accent line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 4.8, w: 2.5, h: 0,
      line: { color: C_GOLD, width: 3 }
    });

    // Presentation Metadata Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 5.1, w: 5.4, h: 1.7,
      rectRadius: 0.12,
      fill: { color: C_WHITE },
      line: { color: C_BORDER_LIGHT, width: 1 }
    });

    slide.addText([
      { text: 'Prepared For: ', options: { bold: true, color: C_FOREST, fontSize: 10 } },
      { text: 'Provincial Government of Abra · Tourism Office (DOT-CAR)\n', options: { color: C_TEXT, fontSize: 10 } },
      { text: 'Target Scope: ', options: { bold: true, color: C_FOREST, fontSize: 10 } },
      { text: '27 Municipalities, Accredited Homestays & Tour Guides\n', options: { color: C_TEXT, fontSize: 10 } },
      { text: 'Platform: ', options: { bold: true, color: C_FOREST, fontSize: 10 } },
      { text: 'Abraventure Integrated Web & Mobile Tourism Ecosystem', options: { color: C_TEXT, fontSize: 10 } }
    ], {
      x: 1.0, y: 5.25, w: 5.0, h: 1.4,
      fontFace: 'Segoe UI', lineSpacing: 18
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 2: PROJECT SUMMARY (EXACT VISUAL REPLICA OF UPLOADED PICTURE)
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };

    // 1. Top Logo Header (Brand)
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 0.6, y: 0.25, w: 2.2, h: 1.15
      });
    }

    slide.addText([
      { text: 'ABRAVENTURE\n', options: { bold: true, color: C_FOREST, fontSize: 18, fontFace: 'Georgia', charSpacing: 1.5 } },
      { text: 'EXPLORE  •  EXPERIENCE  •  PRESERVE', options: { bold: true, color: C_MUTED, fontSize: 7.5, fontFace: 'Segoe UI', charSpacing: 2.5 } }
    ], {
      x: 2.4, y: 0.45, w: 4.5, h: 0.8
    });

    // Top-Right Slogan: "Discover Abra, Digitally"
    slide.addText('Discover\nAbra, Digitally ☀', {
      x: 9.8, y: 0.25, w: 3.0, h: 0.9,
      fontSize: 18, bold: true, color: C_FOREST, fontFace: 'Georgia', align: 'right'
    });

    // 2. Right Side: Scenic Collage
    // Upper Scenic Photo
    if (hasSunset) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 8.8, y: 1.25, w: 4.0, h: 2.5,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.5 }
      });
      slide.addImage({
        path: sunsetPath,
        x: 8.9, y: 1.35, w: 3.8, h: 2.3
      });
    }

    // Lower Overlapping Photos
    if (hasChurch) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 10.2, y: 3.5, w: 2.6, h: 2.0,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.5 }
      });
      slide.addImage({
        path: churchPath,
        x: 10.3, y: 3.6, w: 2.4, h: 1.8
      });
    }

    if (hasWeaving) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 8.4, y: 4.2, w: 2.3, h: 1.8,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.5 }
      });
      slide.addImage({
        path: weavingPath,
        x: 8.5, y: 4.3, w: 2.1, h: 1.6
      });
    }

    // 3. Main Project Summary Card (Container with Olive Green Border)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: 1.45, w: 7.8, h: 3.3,
      rectRadius: 0.2,
      fill: { color: C_WHITE },
      line: { color: C_OLIVE, width: 2.5 }
    });

    // Heading inside card: Leaf icon + "Project Summary"
    slide.addText('🌿  Project Summary', {
      x: 0.9, y: 1.65, w: 6.0, h: 0.55,
      fontSize: 22, bold: true, color: C_FOREST, fontFace: 'Georgia'
    });

    // Amber Underline Accent
    slide.addShape(pptx.ShapeType.line, {
      x: 1.4, y: 2.22, w: 2.0, h: 0,
      line: { color: C_GOLD, width: 3 }
    });

    // Card Body Paragraphs (Exact matching copy from user picture)
    slide.addText([
      { text: 'ABRAVENTURE', options: { bold: true, color: C_FOREST } },
      { text: ' is a centralized web-based tourism information and homestay management system designed to improve tourism information accessibility and coordination in the Province of Abra.\n\n', options: { color: C_TEXT } },
      { text: 'The platform integrates tourist attractions, accredited tour guides, and certified homestay accommodations into one digital system.\n\n', options: { color: C_TEXT } },
      { text: 'It enables tourists to explore destinations, view tourism services, and send booking inquiries while allowing administrators to manage tourism information and registered service providers.', options: { color: C_TEXT } }
    ], {
      x: 0.9, y: 2.35, w: 7.2, h: 2.2,
      fontSize: 11.5, fontFace: 'Segoe UI', lineSpacing: 18
    });

    // 4. Bottom Card: "Key Features" Sub-Container
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: 4.95, w: 9.8, h: 1.95,
      rectRadius: 0.18,
      fill: { color: C_SAGE_LIGHT },
      line: { color: C_OLIVE, width: 1.5 }
    });

    // "★ Key Features" Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9, y: 4.8, w: 2.3, h: 0.4,
      rectRadius: 0.15,
      fill: { color: C_FOREST },
      line: { color: C_OLIVE, width: 1 }
    });
    slide.addText('★  Key Features', {
      x: 0.9, y: 4.85, w: 2.3, h: 0.3,
      fontSize: 11, bold: true, color: C_WHITE, fontFace: 'Segoe UI', align: 'center'
    });

    // 4 Key Feature Items (Icons in circles + descriptive text)
    const features = [
      {
        icon: '🗺️',
        title: 'Centralized tourism\ninformation',
        circleColor: C_FOREST,
        textColor: C_FOREST
      },
      {
        icon: '🧭',
        title: 'Tour guide and\nhomestay listings',
        circleColor: C_GOLD,
        textColor: C_FOREST
      },
      {
        icon: '📅',
        title: 'Booking inquiry\nand communication',
        circleColor: C_FOREST,
        textColor: C_FOREST
      },
      {
        icon: '⚙️',
        title: 'Administrative\nmanagement dashboard',
        circleColor: C_OLIVE,
        textColor: C_FOREST
      }
    ];

    features.forEach((feat, idx) => {
      const itemX = 1.0 + (idx * 2.35);

      // Icon circle
      slide.addShape(pptx.ShapeType.ellipse, {
        x: itemX + 0.6, y: 5.3, w: 0.85, h: 0.85,
        fill: { color: feat.circleColor },
        line: { color: C_WHITE, width: 2 }
      });
      slide.addText(feat.icon, {
        x: itemX + 0.6, y: 5.4, w: 0.85, h: 0.7,
        fontSize: 18, align: 'center'
      });

      // Text label
      slide.addText(feat.title, {
        x: itemX, y: 6.2, w: 2.1, h: 0.6,
        fontSize: 10.5, bold: true, color: C_FOREST,
        fontFace: 'Segoe UI', align: 'center', lineSpacing: 14
      });
    });

    // Delicate bottom leaf doodle / footer
    slide.addText('Province of Abra · Cordillera Administrative Region · 27 Municipalities', {
      x: 0.6, y: 7.08, w: 12.0, h: 0.25,
      fontSize: 8.5, color: C_MUTED, fontFace: 'Segoe UI', charSpacing: 1
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 3: PROJECT BACKGROUND
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addSlideTemplateHeader(slide, 'Context & Motivation', 'Project Background & Strategic Need');

    // Left Column: The Problem & Status Quo (4 Cards)
    slide.addText('CURRENT CHALLENGES IN ABRA PROVINCIAL TOURISM', {
      x: 0.8, y: 1.6, w: 6.0, h: 0.3,
      fontSize: 10, bold: true, color: C_OLIVE, fontFace: 'Segoe UI', charSpacing: 1.5
    });

    const challenges = [
      {
        num: '01',
        title: 'Information Fragmentation',
        desc: 'Tourism details, operating hours, and rates across Abra’s 27 municipalities are scattered across unofficial social media pages, leading to inaccurate tourist info and lost opportunities.'
      },
      {
        num: '02',
        title: 'Unregulated & Unverified Stays',
        desc: 'Homestays lack a standardized digital accreditation mechanism. Tourists face uncertainty regarding safety, sanitary permits, and transparent room pricing.'
      },
      {
        num: '03',
        title: 'Coordination & Booking Bottlenecks',
        desc: 'No centralized system for booking local tour guides or submitting proof of payment, resulting in manual phone calls, scheduling conflicts, and unrecorded local commerce.'
      },
      {
        num: '04',
        title: 'Data & Governance Gaps',
        desc: 'Municipal tourism desks lack real-time visitor analytics, centralized complaint logging, and streamlined reporting mechanisms to the Provincial Tourism Office.'
      }
    ];

    challenges.forEach((ch, idx) => {
      const cy = 1.95 + (idx * 1.15);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: cy, w: 6.2, h: 1.05,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1 }
      });

      // Number pill
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.0, y: cy + 0.15, w: 0.55, h: 0.4,
        rectRadius: 0.08,
        fill: { color: C_FOREST },
        line: { color: C_GOLD, width: 1 }
      });
      slide.addText(ch.num, {
        x: 1.0, y: cy + 0.18, w: 0.55, h: 0.35,
        fontSize: 9, bold: true, color: C_GOLD_LIGHT, fontFace: 'Segoe UI', align: 'center'
      });

      slide.addText(ch.title, {
        x: 1.65, y: cy + 0.12, w: 5.2, h: 0.3,
        fontSize: 12, bold: true, color: C_FOREST, fontFace: 'Georgia'
      });
      slide.addText(ch.desc, {
        x: 1.65, y: cy + 0.42, w: 5.2, h: 0.58,
        fontSize: 9.5, color: C_TEXT, fontFace: 'Segoe UI', lineSpacing: 13
      });
    });

    // Right Column: The Strategic Solution Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.3, y: 1.95, w: 5.2, h: 4.5,
      rectRadius: 0.15,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1.8 }
    });

    slide.addText('🌿 THE STRATEGIC SOLUTION', {
      x: 7.6, y: 2.2, w: 4.6, h: 0.35,
      fontSize: 12, bold: true, color: C_GOLD, fontFace: 'Segoe UI', charSpacing: 1.5
    });

    slide.addText('A Unified Digital Tourism & Governance Gateway', {
      x: 7.6, y: 2.6, w: 4.6, h: 0.8,
      fontSize: 19, bold: true, color: C_WHITE, fontFace: 'Georgia'
    });

    slide.addShape(pptx.ShapeType.line, {
      x: 7.6, y: 3.45, w: 2.0, h: 0,
      line: { color: C_GOLD, width: 2 }
    });

    slide.addText([
      { text: 'In accordance with Republic Act No. 9593 (Tourism Act of 2009) and the National Tourism Development Plan, Abraventure provides an integrated digital ecosystem connecting:\n\n', options: { color: C_CREAM, fontSize: 10.5 } },
      { text: '• 27 Municipalities of Abra under one standardized GIS map\n', options: { color: C_WHITE, bold: true, fontSize: 10.5 } },
      { text: '• Verified Homestays with digital DOT accreditation verification\n', options: { color: C_WHITE, bold: true, fontSize: 10.5 } },
      { text: '• Accredited Tour Guides with structured booking channels\n', options: { color: C_WHITE, bold: true, fontSize: 10.5 } },
      { text: '• Provincial & Municipal Desks with real-time visitor intelligence and automated official PDF/Excel report exports.', options: { color: C_CREAM, fontSize: 10.5 } }
    ], {
      x: 7.6, y: 3.65, w: 4.6, h: 2.5,
      fontFace: 'Segoe UI', lineSpacing: 17
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 4: SCOPE
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addSlideTemplateHeader(slide, 'System Boundaries', 'Project Scope & Functional Modules');

    // Left Column: In-Scope Core Capabilities (Large Container)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.6, w: 7.8, h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_OLIVE, width: 1.8 }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.1, y: 1.8, w: 2.2, h: 0.35,
      rectRadius: 0.12,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1 }
    });
    slide.addText('✓  IN-SCOPE DELIVERABLES', {
      x: 1.1, y: 1.85, w: 2.2, h: 0.25,
      fontSize: 9, bold: true, color: C_WHITE, fontFace: 'Segoe UI', align: 'center', charSpacing: 1
    });

    const inScopeModules = [
      {
        title: '🌍 Tourist Discovery & GIS Mapping',
        desc: 'Interactive 27-municipality GeoJSON boundary map, attraction directories, cultural events, travel tips, and multi-day itinerary planner.'
      },
      {
        title: '🏡 Homestay Management System',
        desc: 'Listing management, room inventories, pricing tiers, guest inquiry messaging, and digital proof-of-payment (GCash/Bank) uploads.'
      },
      {
        title: '🧭 Tour Guide Accreditation Registry',
        desc: 'Verified guide directories, spoken dialects, custom tour packages, transparent guide rates, and availability calendars.'
      },
      {
        title: '🏛️ Municipal & Provincial Governance Portals',
        desc: 'Role-based dashboards for 27 LGUs: accreditation endorsements, attraction management, and real-time visitor analytics.'
      },
      {
        title: '🛡️ 15-Point Enterprise Security & Audit',
        desc: 'Isolated portal authentication, SQL injection defense, XSS sanitization, rate limiting, and immutable activity audit logs.'
      },
      {
        title: '📊 Official Reporting & Grievance Desk',
        desc: 'Automated 1-click PDF & Excel report exports and a direct tourist-to-LGU grievance and incident ticketing channel.'
      }
    ];

    inScopeModules.forEach((mod, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const mx = 1.1 + (col * 3.7);
      const my = 2.3 + (row * 1.3);

      slide.addText(mod.title, {
        x: mx, y: my, w: 3.5, h: 0.35,
        fontSize: 11, bold: true, color: C_FOREST, fontFace: 'Georgia'
      });
      slide.addText(mod.desc, {
        x: mx, y: my + 0.35, w: 3.5, h: 0.85,
        fontSize: 9, color: C_TEXT, fontFace: 'Segoe UI', lineSpacing: 13
      });
    });

    // Right Column: Out-of-Scope & Future Phase Roadmap
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.8, y: 1.6, w: 3.7, h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_SAGE_TINT },
      line: { color: C_BORDER_LIGHT, width: 1.5 }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 9.1, y: 1.8, w: 2.2, h: 0.35,
      rectRadius: 0.12,
      fill: { color: C_GOLD },
      line: { color: C_FOREST, width: 1 }
    });
    slide.addText('✦  PHASE 2 ROADMAP', {
      x: 9.1, y: 1.85, w: 2.2, h: 0.25,
      fontSize: 9, bold: true, color: C_FOREST_DARK, fontFace: 'Segoe UI', align: 'center', charSpacing: 1
    });

    slide.addText('Items Out of Current Scope\n(Scheduled for Future Iterations)', {
      x: 9.1, y: 2.3, w: 3.2, h: 0.65,
      fontSize: 11, bold: true, color: C_FOREST, fontFace: 'Georgia'
    });

    const outScopeItems = [
      {
        tag: 'Phase 2.1',
        title: 'Direct Credit Card Escrow Gateway',
        desc: 'Integration of third-party merchant payment gateways (system currently verifies direct GCash & bank transfer receipts).'
      },
      {
        tag: 'Phase 2.2',
        title: 'Native App Store Builds (iOS/Android)',
        desc: 'Distribution through Google Play & Apple App Store (system is currently an optimized, mobile-first Progressive Web App).'
      },
      {
        tag: 'Phase 2.3',
        title: 'Autonomous Drone GIS Telemetry',
        desc: 'Real-time LiDAR / drone-based topographic surveillance.'
      }
    ];

    outScopeItems.forEach((item, idx) => {
      const oy = 3.0 + (idx * 1.15);

      slide.addText(`• ${item.title}`, {
        x: 9.1, y: oy, w: 3.1, h: 0.3,
        fontSize: 10, bold: true, color: C_FOREST, fontFace: 'Segoe UI'
      });
      slide.addText(item.desc, {
        x: 9.3, y: oy + 0.3, w: 2.9, h: 0.75,
        fontSize: 8.5, color: C_MUTED, fontFace: 'Segoe UI', lineSpacing: 12
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 5: MARKET OPPORTUNITY & TARGET AUDIENCE
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addSlideTemplateHeader(slide, 'Market Dynamics', 'Market Opportunity & Target Stakeholders');

    // Top: Market Drivers (3 metric summary cards)
    const drivers = [
      {
        stat: '+48%',
        title: 'Ecotourism Influx Growth',
        desc: 'Surge in domestic and international eco-trekkers visiting CAR waterfalls, rolling hills, and cultural festivals.'
      },
      {
        stat: '27 LGUs',
        title: 'Unified Provincial Footprint',
        desc: 'Full coverage of all 27 Abra municipalities with standardized accreditation and tourism governance.'
      },
      {
        stat: '0% Comm.',
        title: 'Direct Community Benefit',
        desc: 'Direct booking and communication prevents heavy OTA commission deductions, empowering local homestay families.'
      }
    ];

    drivers.forEach((d, i) => {
      const dx = 0.8 + (i * 3.95);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: dx, y: 1.6, w: 3.8, h: 1.4,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_OLIVE, width: 1.2 }
      });

      slide.addText(d.stat, {
        x: dx + 0.25, y: 1.75, w: 1.3, h: 0.5,
        fontSize: 19, bold: true, color: C_GOLD, fontFace: 'Georgia'
      });
      slide.addText(d.title, {
        x: dx + 1.6, y: 1.75, w: 2.0, h: 0.45,
        fontSize: 11, bold: true, color: C_FOREST, fontFace: 'Georgia'
      });
      slide.addText(d.desc, {
        x: dx + 0.25, y: 2.3, w: 3.3, h: 0.6,
        fontSize: 8.5, color: C_MUTED, fontFace: 'Segoe UI', lineSpacing: 12
      });
    });

    // Bottom: 4 Key Target Audiences
    slide.addText('PRIMARY USER ROLES & TARGET AUDIENCE MATRIX', {
      x: 0.8, y: 3.15, w: 6.0, h: 0.3,
      fontSize: 10, bold: true, color: C_OLIVE, fontFace: 'Segoe UI', charSpacing: 1.5
    });

    const audiences = [
      {
        icon: '🎒',
        name: 'Eco-Tourists & Travelers',
        role: 'Domestic & International Visitors',
        benefits: '• Discover verified cultural & nature spots\n• Direct booking of certified homestays\n• Transparent pricing & itinerary builder\n• Direct grievance channel for safety'
      },
      {
        icon: '🏡',
        name: 'Homestay Operators',
        role: 'Local Residents & Indigenous Hosts',
        benefits: '• Free digital room inventory listing\n• Direct guest messaging & payment receipts\n• Streamlined LGU accreditation renewal\n• Retention of 100% of booking revenue'
      },
      {
        icon: '🧭',
        name: 'Accredited Tour Guides',
        role: 'DOT-Certified Local Experts',
        benefits: '• Verified digital credentials & badge\n• Custom tour package marketplace\n• Spoken dialects & languages showcase\n• Direct scheduling without middlemen'
      },
      {
        icon: '🏛️',
        name: 'LGU Tourism Officers',
        role: 'Municipal & Provincial Desks',
        benefits: '• Master compliance & permit monitoring\n• Real-time visitor influx analytics\n• 1-click official PDF & Excel report exports\n• Swift tourist complaint resolution desk'
      }
    ];

    audiences.forEach((aud, i) => {
      const ax = 0.8 + (i * 2.95);
      const ay = 3.5;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: ax, y: ay, w: 2.8, h: 3.15,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.2 }
      });

      // Top color notch
      slide.addShape(pptx.ShapeType.roundRect, {
        x: ax, y: ay, w: 2.8, h: 0.1,
        rectRadius: 0.05,
        fill: { color: i % 2 === 0 ? C_FOREST : C_GOLD }
      });

      // Icon & Name
      slide.addText(aud.icon, {
        x: ax + 0.2, y: ay + 0.2, w: 0.6, h: 0.45,
        fontSize: 18
      });
      slide.addText(aud.name, {
        x: ax + 0.8, y: ay + 0.2, w: 1.8, h: 0.45,
        fontSize: 11, bold: true, color: C_FOREST, fontFace: 'Georgia'
      });

      slide.addText(aud.role, {
        x: ax + 0.2, y: ay + 0.7, w: 2.4, h: 0.35,
        fontSize: 8.5, bold: true, color: C_GOLD, fontFace: 'Segoe UI'
      });

      slide.addShape(pptx.ShapeType.line, {
        x: ax + 0.2, y: ay + 1.05, w: 2.4, h: 0,
        line: { color: C_BORDER_LIGHT, width: 1 }
      });

      slide.addText(aud.benefits, {
        x: ax + 0.2, y: ay + 1.15, w: 2.4, h: 1.85,
        fontSize: 8.5, color: C_TEXT, fontFace: 'Segoe UI', lineSpacing: 13
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 6: PROJECT METHODOLOGY & TIMELINE
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addSlideTemplateHeader(slide, 'Execution Plan', 'Project Methodology & Implementation Timeline');

    // Top: Agile Framework Banner
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.6, w: 11.73, h: 0.8,
      rectRadius: 0.1,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1.5 }
    });

    slide.addText('AGILE SCRUM METHODOLOGY WITH MULTI-STAKEHOLDER GOVERNANCE', {
      x: 1.1, y: 1.72, w: 7.5, h: 0.25,
      fontSize: 10, bold: true, color: C_GOLD, fontFace: 'Segoe UI', charSpacing: 1.2
    });
    slide.addText('Iterative bi-weekly sprints, continuous LGU feedback, strict security controls, and collaborative municipal onboarding.', {
      x: 1.1, y: 1.98, w: 11.0, h: 0.32,
      fontSize: 9.5, color: C_CREAM, fontFace: 'Segoe UI'
    });

    // 5-Phase Timeline Roadmaps (Horizontal Cards)
    const phases = [
      {
        num: 'PHASE 01',
        time: 'Weeks 1 – 3',
        title: 'Discovery & System Design',
        items: [
          '• 27 LGUs stakeholder consultations',
          '• PostgreSQL schema & API design',
          '• Cultural identity UI/UX system'
        ]
      },
      {
        num: 'PHASE 02',
        time: 'Weeks 4 – 7',
        title: 'Core Platform Engineering',
        items: [
          '• Public portal & 27 LGU GIS map',
          '• Homestay & Guide listings',
          '• Direct inquiry & messaging pipelines'
        ]
      },
      {
        num: 'PHASE 03',
        time: 'Weeks 8 – 10',
        title: 'Governance & Analytics',
        items: [
          '• Municipal & Provincial dashboards',
          '• Automated PDF/Excel report engines',
          '• Compliance & grievance ticketing'
        ]
      },
      {
        num: 'PHASE 04',
        time: 'Weeks 11 – 12',
        title: 'Security & UAT Audit',
        items: [
          '• 23-point security test suite run',
          '• User acceptance testing with LGUs',
          '• Performance & load testing'
        ]
      },
      {
        num: 'PHASE 05',
        time: 'Week 13+',
        title: 'Launch & Provincial Rollout',
        items: [
          '• Production server & domain deploy',
          '• Homestay host onboarding session',
          '• Provincial DOT official launch'
        ]
      }
    ];

    phases.forEach((p, idx) => {
      const px = 0.8 + (idx * 2.37);
      const py = 2.65;
      const pw = 2.25;
      const ph = 3.9;

      // Card
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px, y: py, w: pw, h: ph,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER_LIGHT, width: 1.2 }
      });

      // Top Notch
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px, y: py, w: pw, h: 0.1,
        rectRadius: 0.05,
        fill: { color: idx === 4 ? C_GOLD : C_FOREST }
      });

      // Phase badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px + 0.15, y: py + 0.25, w: pw - 0.3, h: 0.32,
        rectRadius: 0.08,
        fill: { color: C_SAGE_LIGHT },
        line: { color: C_OLIVE, width: 1 }
      });
      slide.addText(p.num, {
        x: px + 0.15, y: py + 0.28, w: pw - 0.3, h: 0.25,
        fontSize: 8.5, bold: true, color: C_FOREST, fontFace: 'Segoe UI', align: 'center', charSpacing: 1
      });

      // Timeline duration
      slide.addText(p.time, {
        x: px + 0.15, y: py + 0.65, w: pw - 0.3, h: 0.25,
        fontSize: 9, bold: true, color: C_GOLD, fontFace: 'Segoe UI', align: 'center'
      });

      // Title
      slide.addText(p.title, {
        x: px + 0.15, y: py + 0.95, w: pw - 0.3, h: 0.6,
        fontSize: 11, bold: true, color: C_FOREST, fontFace: 'Georgia', align: 'center'
      });

      slide.addShape(pptx.ShapeType.line, {
        x: px + 0.25, y: py + 1.6, w: pw - 0.5, h: 0,
        line: { color: C_BORDER_LIGHT, width: 1 }
      });

      // Bullet points
      slide.addText(p.items.join('\n\n'), {
        x: px + 0.15, y: py + 1.75, w: pw - 0.3, h: 1.95,
        fontSize: 8.5, color: C_TEXT, fontFace: 'Segoe UI', lineSpacing: 13
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SLIDE 7: BUDGET AND PRICING (INCLUDE DOMAIN & MAINTENANCE)
  // ════════════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addSlideTemplateHeader(slide, 'Investment & Financial Plan', 'Budget and Pricing (Including Domain & Maintenance)');

    // Left Column: Detailed Budget Breakdown Table
    slide.addText('PROJECT COST ESTIMATION & SERVICE BREAKDOWN', {
      x: 0.8, y: 1.55, w: 7.0, h: 0.25,
      fontSize: 9.5, bold: true, color: C_OLIVE, fontFace: 'Segoe UI', charSpacing: 1.2
    });

    const budgetTableRows = [
      [
        { text: 'Category', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 9.5, fontFace: 'Segoe UI' } },
        { text: 'Specification & Scope of Deliverables', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 9.5, fontFace: 'Segoe UI' } },
        { text: 'Billing Type', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 9.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: 'Est. Price (PHP)', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 9.5, fontFace: 'Segoe UI', align: 'right' } }
      ],
      [
        { text: '1. Core System\nDevelopment', options: { bold: true, color: C_FOREST, fontSize: 9, fontFace: 'Georgia' } },
        { text: 'Full-stack platform engineering (React 18 + Node.js + PostgreSQL), 27 Municipalities GIS map, Homestay/Guide modules, dual auth portals & 15-point security hardening.', options: { color: C_TEXT, fontSize: 8.5, fontFace: 'Segoe UI' } },
        { text: 'One-Time', options: { bold: true, color: C_OLIVE, fontSize: 8.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: '₱ 280,000', options: { bold: true, color: C_FOREST, fontSize: 9.5, fontFace: 'Segoe UI', align: 'right' } }
      ],
      [
        { text: '2. Custom Domain\nRegistration', options: { bold: true, color: C_FOREST, fontSize: 9, fontFace: 'Georgia' } },
        { text: 'Official domain registration (e.g., abraventure.ph / abraventure.com / .gov.ph setup), DNS routing, Cloudflare CDN integration, and Wildcard SSL certificate.', options: { color: C_TEXT, fontSize: 8.5, fontFace: 'Segoe UI' } },
        { text: 'Annual\n(1st Yr Incl.)', options: { color: C_MUTED, fontSize: 8.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: '₱ 3,500 / yr', options: { bold: true, color: C_FOREST, fontSize: 9.5, fontFace: 'Segoe UI', align: 'right' } }
      ],
      [
        { text: '3. Cloud Hosting &\nDatabase Infra', options: { bold: true, color: C_FOREST, fontSize: 9, fontFace: 'Georgia' } },
        { text: 'High-availability Node.js production server, managed serverless PostgreSQL database (Neon/AWS), asset CDN storage (Cloudinary), and automated daily backup routines.', options: { color: C_TEXT, fontSize: 8.5, fontFace: 'Segoe UI' } },
        { text: 'Annual\n(1st Yr Incl.)', options: { color: C_MUTED, fontSize: 8.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: '₱ 24,000 / yr', options: { bold: true, color: C_FOREST, fontSize: 9.5, fontFace: 'Segoe UI', align: 'right' } }
      ],
      [
        { text: '4. Ongoing Maintenance\n& SLA Support', options: { bold: true, color: C_FOREST, fontSize: 9, fontFace: 'Georgia' } },
        { text: 'System health monitoring, security patches & dependency updates, database optimization, bug fixes, helpdesk support, and Municipal officer technical assistance.', options: { color: C_TEXT, fontSize: 8.5, fontFace: 'Segoe UI' } },
        { text: 'Annual SLA\nAgreement', options: { color: C_MUTED, fontSize: 8.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: '₱ 45,000 / yr', options: { bold: true, color: C_FOREST, fontSize: 9.5, fontFace: 'Segoe UI', align: 'right' } }
      ],
      [
        { text: 'TOTAL INITIAL\nINVESTMENT', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 9.5, fontFace: 'Georgia' } },
        { text: 'Complete Enterprise Platform + Custom Domain + 1 Full Year Cloud Hosting & Maintenance SLA', options: { bold: true, color: C_WHITE, fill: { color: C_FOREST }, fontSize: 8.5, fontFace: 'Segoe UI' } },
        { text: 'Year 1 All-In', options: { bold: true, color: C_GOLD_LIGHT, fill: { color: C_FOREST }, fontSize: 8.5, fontFace: 'Segoe UI', align: 'center' } },
        { text: '₱ 352,500', options: { bold: true, color: C_GOLD_LIGHT, fill: { color: C_FOREST }, fontSize: 11, fontFace: 'Georgia', align: 'right' } }
      ]
    ];

    slide.addTable(budgetTableRows, {
      x: 0.8, y: 1.85, w: 7.7, h: 4.8,
      colW: [1.6, 3.8, 1.0, 1.3],
      border: { pt: 0.5, color: C_BORDER_LIGHT },
      fill: { color: C_WHITE }
    });

    // Right Column: Summary & Value Proposition Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.8, y: 1.85, w: 3.7, h: 4.8,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_OLIVE, width: 2 }
    });

    // Gold Top Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 9.1, y: 2.1, w: 3.1, h: 0.38,
      rectRadius: 0.1,
      fill: { color: C_SAGE_LIGHT },
      line: { color: C_OLIVE, width: 1 }
    });
    slide.addText('FINANCIAL TERMS & ROI', {
      x: 9.1, y: 2.15, w: 3.1, h: 0.28,
      fontSize: 8.5, bold: true, color: C_FOREST, fontFace: 'Segoe UI', align: 'center', charSpacing: 1
    });

    slide.addText('High Impact, Sustainable Investment', {
      x: 9.1, y: 2.6, w: 3.1, h: 0.55,
      fontSize: 13, bold: true, color: C_FOREST, fontFace: 'Georgia'
    });

    const paymentTerms = [
      {
        title: 'Milestone-Based Payment',
        desc: '• 30% Upon Project Mobilization\n• 40% Upon Beta / UAT Milestone\n• 30% Upon Final Deployment & Sign-off'
      },
      {
        title: 'Long-Term Cost Efficiency',
        desc: 'Subsequent years cost only ₱72,500/year for all 27 municipalities combined (Domain, Hosting, and 12-Month SLA Support).'
      },
      {
        title: 'Local Economic ROI',
        desc: 'Centralized tourism visibility increases tourist foot traffic, homestay revenue, and municipal revenue capture without third-party OTA fees.'
      }
    ];

    paymentTerms.forEach((term, idx) => {
      const ty = 3.25 + (idx * 1.1);

      slide.addText(term.title, {
        x: 9.1, y: ty, w: 3.1, h: 0.28,
        fontSize: 9.5, bold: true, color: C_GOLD, fontFace: 'Segoe UI'
      });
      slide.addText(term.desc, {
        x: 9.1, y: ty + 0.28, w: 3.1, h: 0.75,
        fontSize: 8.5, color: C_TEXT, fontFace: 'Segoe UI', lineSpacing: 12
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SAVE PPTX FILE
  // ════════════════════════════════════════════════════════════════════════════
  const outputPath = path.resolve(__dirname, '../../Abraventure_Presentation_Template.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Presentation generated successfully at: ${outputPath}`);
}

generateAbraventurePresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
