const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createAbraventureTemplate() {
  const pptx = new pptxgen();

  // Widescreen 16:9
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Provincial Tourism Office of Abra';
  pptx.company = 'Abraventure Integrated Tourism Platform';
  pptx.title = 'Abraventure Official Presentation Template';

  // Theme Colors
  const C_FOREST = '153325';
  const C_DARK_FOREST = '0B1E15';
  const C_MID_FOREST = '1F4935';
  const C_GOLD = 'B88B2A';
  const C_LIGHT_GOLD = 'D4A942';
  const C_CREAM = 'FAF7F2';
  const C_BORDER = 'E8DFC8';
  const C_TEXT = '232120';
  const C_MUTED = '5A534E';
  const C_WHITE = 'FFFFFF';
  const C_LIGHT_CARD = 'F3EFE8';

  const logoPath = path.resolve(__dirname, '../../frontend/public/abraventure-logo.png');
  const hasLogo = fs.existsSync(logoPath);
  console.log('Logo path:', logoPath, 'exists:', hasLogo);

  // Helper for Header on Light Slides
  const addLightSlideHeader = (slide, category, title) => {
    // Header Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.12,
      fill: { color: C_FOREST }
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0.12, w: '100%', h: 0.03,
      fill: { color: C_GOLD }
    });

    // Small Logo top right
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 12.0, y: 0.35, w: 0.85, h: 0.85
      });
    }

    // Category Eyebrow
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.38, w: 9.0, h: 0.25,
      fontSize: 9, bold: true, color: C_GOLD,
      fontFace: 'Segoe UI', charSpacing: 3
    });

    // Main Title
    slide.addText(title, {
      x: 0.8, y: 0.65, w: 10.5, h: 0.65,
      fontSize: 24, bold: true, color: C_FOREST,
      fontFace: 'Georgia'
    });

    // Thin accent underline
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 1.35, w: 1.8, h: 0,
      line: { color: C_GOLD, width: 2 }
    });

    // Footer
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8, y: 7.0, w: 11.73, h: 0,
      line: { color: C_BORDER, width: 1 }
    });
    slide.addText('ABRAVENTURE · PROVINCE OF ABRA · CORDILLERA ADMINISTRATIVE REGION', {
      x: 0.8, y: 7.08, w: 8.0, h: 0.25,
      fontSize: 8, color: C_MUTED, fontFace: 'Segoe UI', charSpacing: 1
    });
    slide.addText('OFFICIAL PRESENTATION TEMPLATE', {
      x: 8.5, y: 7.08, w: 4.0, h: 0.25,
      fontSize: 8, color: C_GOLD, fontFace: 'Segoe UI', align: 'right', bold: true
    });
  };

  // ════════════════════════════════════════════════════════════
  // SLIDE 1: MASTER TITLE / COVER SLIDE (Editorial Deep Forest)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_FOREST };

    // Decorative Gold border frame
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.5, w: 12.33, h: 6.5,
      line: { color: C_GOLD, width: 1.5 },
      fill: { color: C_FOREST }
    });

    // Subtle inner corner accent
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 0.6, w: 12.13, h: 6.3,
      line: { color: '204D38', width: 1 },
      fill: { type: 'none' }
    });

    // Logo Center-Top
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 5.75, y: 1.1, w: 1.8, h: 1.8
      });
    }

    // Top Tagline
    slide.addText('PROVINCIAL TOURISM OFFICE · PROVINCE OF ABRA', {
      x: 1.0, y: 3.1, w: 11.33, h: 0.35,
      fontSize: 10, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', align: 'center', charSpacing: 4
    });

    // Main Presentation Title
    slide.addText('ABRAVENTURE', {
      x: 1.0, y: 3.5, w: 11.33, h: 0.85,
      fontSize: 42, bold: true, color: C_WHITE,
      fontFace: 'Georgia', align: 'center', charSpacing: 2
    });

    // Subtitle / Deck Descriptor
    slide.addText('Integrated Tourism, Cultural Heritage & Eco-Expedition Deck', {
      x: 1.0, y: 4.4, w: 11.33, h: 0.45,
      fontSize: 16, color: 'E2E8F0',
      fontFace: 'Georgia', italic: true, align: 'center'
    });

    // Decorative Divider with Gold Diamond
    slide.addShape(pptx.ShapeType.line, {
      x: 4.2, y: 5.1, w: 2.1, h: 0,
      line: { color: C_GOLD, width: 1.5 }
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 7.0, y: 5.1, w: 2.1, h: 0,
      line: { color: C_GOLD, width: 1.5 }
    });
    slide.addText('◆', {
      x: 6.4, y: 4.95, w: 0.5, h: 0.3,
      fontSize: 12, color: C_GOLD, align: 'center'
    });

    // Footer Meta Info (Presenter / Date / Department)
    slide.addText([
      { text: 'Prepared by: ', options: { bold: true, color: C_LIGHT_GOLD } },
      { text: '[Presenter Name / Tourism Officer]   |   ', options: { color: C_WHITE } },
      { text: 'Date: ', options: { bold: true, color: C_LIGHT_GOLD } },
      { text: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + '   |   ', options: { color: C_WHITE } },
      { text: 'Department: ', options: { bold: true, color: C_LIGHT_GOLD } },
      { text: 'Department of Tourism – CAR Regional Cluster', options: { color: C_WHITE } }
    ], {
      x: 1.0, y: 5.7, w: 11.33, h: 0.4,
      fontSize: 10, fontFace: 'Segoe UI', align: 'center'
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 2: EXECUTIVE AGENDA / TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Presentation Outline', 'Table of Contents & Agenda');

    const agendaItems = [
      { num: '01', title: 'Executive Overview', desc: 'Mandate, provincial platform scope, and regional tourism vision.' },
      { num: '02', title: 'Municipal Destinations', desc: 'Profile of 27 municipalities, natural landmarks, and cultural sites.' },
      { num: '03', title: 'Ecosystem & Accreditations', desc: 'Vetted homestays, licensed tour guides, and DOT compliance.' },
      { num: '04', title: 'Roadmap & Strategic Metrics', desc: 'Quarterly milestones, sustainable eco-targets, and next steps.' }
    ];

    agendaItems.forEach((item, i) => {
      const cardX = 0.8 + (i * 2.95);
      const cardY = 1.9;
      const cardW = 2.8;
      const cardH = 4.6;

      // Card Background
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX, y: cardY, w: cardW, h: cardH,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 }
      });

      // Gold Top Notch Accent
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX, y: cardY, w: cardW, h: 0.1,
        rectRadius: 0.05,
        fill: { color: i === 0 ? C_FOREST : C_GOLD }
      });

      // Number badge
      slide.addShape(pptx.ShapeType.ellipse, {
        x: cardX + 0.3, y: cardY + 0.4, w: 0.9, h: 0.9,
        fill: { color: i === 0 ? C_FOREST : C_LIGHT_CARD },
        line: { color: i === 0 ? C_GOLD : C_BORDER, width: 1.5 }
      });
      slide.addText(item.num, {
        x: cardX + 0.3, y: cardY + 0.55, w: 0.9, h: 0.6,
        fontSize: 16, bold: true,
        color: i === 0 ? C_LIGHT_GOLD : C_FOREST,
        fontFace: 'Georgia', align: 'center'
      });

      // Title
      slide.addText(item.title, {
        x: cardX + 0.3, y: cardY + 1.6, w: 2.2, h: 0.8,
        fontSize: 16, bold: true, color: C_FOREST,
        fontFace: 'Georgia'
      });

      // Divider
      slide.addShape(pptx.ShapeType.line, {
        x: cardX + 0.3, y: cardY + 2.5, w: 1.5, h: 0,
        line: { color: C_BORDER, width: 1 }
      });

      // Description
      slide.addText(item.desc, {
        x: cardX + 0.3, y: cardY + 2.7, w: 2.2, h: 1.4,
        fontSize: 11, color: C_MUTED, fontFace: 'Segoe UI', lineSpacing: 18
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 3: ABOUT / VISION & MISSION (Editorial Split Layout)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Platform Vision', 'Preserving Heritage, Inspiring Expeditions');

    // Left Column: Forest Accent Hero Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 4.8, h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1.5 }
    });

    slide.addText('OFFICIAL MISSION', {
      x: 1.2, y: 2.0, w: 4.0, h: 0.3,
      fontSize: 10, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', charSpacing: 3
    });

    slide.addText('"To unite the 27 municipalities of Abra under a modern, verified digital platform that empowers local communities, safeguards ancestral Cordillera ecology, and delivers unforgettable eco-cultural journeys."', {
      x: 1.2, y: 2.4, w: 4.0, h: 2.8,
      fontSize: 14, italic: true, color: C_WHITE,
      fontFace: 'Georgia', lineSpacing: 22
    });

    slide.addText('— Provincial Government of Abra (PDRRMO & Tourism Desk)', {
      x: 1.2, y: 5.6, w: 4.0, h: 0.5,
      fontSize: 9.5, color: C_LIGHT_GOLD, fontFace: 'Segoe UI', bold: true
    });

    // Right Column: Three Pillar Cards
    const pillars = [
      {
        tag: 'PILLAR 1',
        title: 'Authentic Cultural Preservation',
        body: 'Championing the indigenous Tingguian culture, Abel Iloko weavers, and heritage landmarks with respect and historical accuracy.'
      },
      {
        tag: 'PILLAR 2',
        title: 'Vetted Community Standards',
        body: '100% municipality-inspected homestays, licensed local guides, and transparent booking fees benefiting native hosts directly.'
      },
      {
        tag: 'PILLAR 3',
        title: 'Safety & Eco-Sustainability',
        body: 'Real-time provincial bulletins, emergency dispatch links, and strict Leave-No-Trace highland trail conservation.'
      }
    ];

    pillars.forEach((p, idx) => {
      const py = 1.7 + (idx * 1.68);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.0, y: py, w: 6.5, h: 1.5,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1 }
      });

      // Left bar
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.0, y: py, w: 0.12, h: 1.5,
        rectRadius: 0.05,
        fill: { color: idx === 1 ? C_GOLD : C_FOREST }
      });

      slide.addText(p.tag, {
        x: 6.3, y: py + 0.15, w: 2.0, h: 0.25,
        fontSize: 8.5, bold: true, color: C_GOLD,
        fontFace: 'Segoe UI', charSpacing: 2
      });

      slide.addText(p.title, {
        x: 6.3, y: py + 0.4, w: 5.9, h: 0.35,
        fontSize: 13, bold: true, color: C_FOREST,
        fontFace: 'Georgia'
      });

      slide.addText(p.body, {
        x: 6.3, y: py + 0.75, w: 5.9, h: 0.65,
        fontSize: 10, color: C_MUTED,
        fontFace: 'Segoe UI', lineSpacing: 14
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 4: KEY METRICS / STATS DASHBOARD
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Provincial Platform Reach', 'Impact Numbers & Tourism Footprint');

    const stats = [
      { val: '27', label: 'Municipalities', desc: 'Fully mapped with official seals and local tourism desks' },
      { val: '100%', label: 'DOT Compliance', desc: 'Verified accreditation standards for all listed providers' },
      { val: '65+', label: 'Eco-Sites & Trails', desc: 'From Kaparkan travertine falls to Don Mariano Marcos Bridge' },
      { val: '24/7', label: 'Safety Dispatch', desc: 'Connected emergency hotlines with Abra Provincial Police Desk' }
    ];

    stats.forEach((s, idx) => {
      const sx = 0.8 + (idx * 2.95);
      const sy = 1.9;
      const sw = 2.8;
      const sh = 2.4;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: sx, y: sy, w: sw, h: sh,
        rectRadius: 0.15,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 }
      });

      slide.addText(s.val, {
        x: sx + 0.2, y: sy + 0.25, w: 2.4, h: 0.85,
        fontSize: 34, bold: true, color: C_FOREST,
        fontFace: 'Georgia', align: 'center'
      });

      slide.addText(s.label.toUpperCase(), {
        x: sx + 0.2, y: sy + 1.15, w: 2.4, h: 0.3,
        fontSize: 10, bold: true, color: C_GOLD,
        fontFace: 'Segoe UI', align: 'center', charSpacing: 2
      });

      slide.addText(s.desc, {
        x: sx + 0.2, y: sy + 1.5, w: 2.4, h: 0.75,
        fontSize: 9.5, color: C_MUTED,
        fontFace: 'Segoe UI', align: 'center', lineSpacing: 14
      });
    });

    // Lower Informational Banner
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 4.6, w: 11.73, h: 2.0,
      rectRadius: 0.15,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1.2 }
    });

    slide.addText('GOVERNMENT ENDORSEMENT & SUSTAINABLE TOURISM COMMITMENT', {
      x: 1.2, y: 4.85, w: 11.0, h: 0.3,
      fontSize: 10, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', charSpacing: 3
    });

    slide.addText([
      { text: '• Verified Municipal Coordination: ', options: { bold: true, color: C_WHITE } },
      { text: 'Each municipality manages its own attractions, seasonal festivals, and certified local guides.\n', options: { color: 'E2E8F0' } },
      { text: '• High-Elevation Eco Protocols: ', options: { bold: true, color: C_WHITE } },
      { text: 'Strict registration requirements prior to entering remote wilderness corridors like Kaparkan Falls & Mount Poswey.\n', options: { color: 'E2E8F0' } },
      { text: '• Community Empowerment: ', options: { bold: true, color: C_WHITE } },
      { text: '100% of homestay booking revenue and guided trail fees circulate directly to Abra rural families.', options: { color: 'E2E8F0' } }
    ], {
      x: 1.2, y: 5.2, w: 11.0, h: 1.2,
      fontSize: 10.5, fontFace: 'Segoe UI', lineSpacing: 18
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 5: SECTION DIVIDER (Deep Emerald & Gold Emblem)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_DARK_FOREST };

    // Decorative Watermark / Inner Frame
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.5, w: 12.33, h: 6.5,
      line: { color: C_GOLD, width: 1.5 },
      fill: { type: 'none' }
    });

    // Small Emblem Logo
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 6.0, y: 1.6, w: 1.33, h: 1.33
      });
    }

    slide.addText('SECTION 02', {
      x: 1.0, y: 3.2, w: 11.33, h: 0.3,
      fontSize: 11, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', align: 'center', charSpacing: 4
    });

    slide.addText('DESTINATIONS & CULTURAL HERITAGE', {
      x: 1.0, y: 3.6, w: 11.33, h: 0.8,
      fontSize: 32, bold: true, color: C_WHITE,
      fontFace: 'Georgia', align: 'center'
    });

    slide.addShape(pptx.ShapeType.line, {
      x: 5.0, y: 4.6, w: 3.33, h: 0,
      line: { color: C_GOLD, width: 2 }
    });

    slide.addText('Spotlighting the natural wonders, highland rivers, and historic colonial towns of the Cordillera heartland.', {
      x: 2.0, y: 4.8, w: 9.33, h: 0.6,
      fontSize: 13, italic: true, color: 'CBD5E1',
      fontFace: 'Georgia', align: 'center'
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 6: DESTINATION SPOTLIGHT / 2-COLUMN SHOWCASE
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Destination Profiles', 'Flagship Municipal Attractions');

    // Left Column Card (Highlight feature)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 5.6, h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_BORDER, width: 1.2 }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.1, y: 2.0, w: 5.0, h: 2.2,
      rectRadius: 0.1,
      fill: { color: C_MID_FOREST },
      line: { color: C_GOLD, width: 1 }
    });

    slide.addText('FEATURED HIGHLAND WONDER', {
      x: 1.3, y: 2.2, w: 4.6, h: 0.25,
      fontSize: 9, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', charSpacing: 2
    });

    slide.addText('Kaparkan (Mulawin) Falls', {
      x: 1.3, y: 2.5, w: 4.6, h: 0.5,
      fontSize: 20, bold: true, color: C_WHITE,
      fontFace: 'Georgia'
    });

    slide.addText('Tineg, Abra · Multi-tiered Limestone Travertine Terraces', {
      x: 1.3, y: 3.0, w: 4.6, h: 0.35,
      fontSize: 10, italic: true, color: 'CBD5E1',
      fontFace: 'Georgia'
    });

    slide.addText('A natural geological limestone staircase with cascading mineral emerald spring pools. Accessible exclusively via accredited monster jeep transports from Bangued and monitored under seasonal registration limits.', {
      x: 1.1, y: 4.4, w: 5.0, h: 1.0,
      fontSize: 10.5, color: C_MUTED,
      fontFace: 'Segoe UI', lineSpacing: 15
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 1.1, y: 5.5, w: 5.0, h: 0.8,
      fill: { color: C_LIGHT_CARD },
      line: { color: C_BORDER, width: 1 }
    });
    slide.addText([
      { text: '• Season: ', options: { bold: true, color: C_FOREST } },
      { text: 'July to November (Monsoon months)   ', options: { color: C_MUTED } },
      { text: '• Guide: ', options: { bold: true, color: C_FOREST } },
      { text: 'Mandatory', options: { color: C_GOLD, bold: true } }
    ], {
      x: 1.2, y: 5.75, w: 4.8, h: 0.35,
      fontSize: 9.5, fontFace: 'Segoe UI'
    });

    // Right Column: Three Municipality Cards
    const spots = [
      {
        town: 'Bangued (Capital)',
        name: 'Victoria Park & Cassamata Hill',
        detail: 'Panoramic viewpoints overlooking the winding Abra River basin and Cordillera mountain silhouettes.'
      },
      {
        town: 'Tayum',
        name: 'Santa Catalina de Alejandria Church',
        detail: '19th-century National Cultural Treasure baroque church made of local brickwork and clay tiles.'
      },
      {
        town: 'Bucay',
        name: 'Old Spanish Casa Real & Penarrubia Trails',
        detail: 'Historical relics of Abra’s first colonial capital paired with ancestral Tingguian bamboo craftsmanship.'
      }
    ];

    spots.forEach((sp, idx) => {
      const sy = 1.7 + (idx * 1.68);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.8, y: sy, w: 5.73, h: 1.5,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1 }
      });

      slide.addText(sp.town.toUpperCase(), {
        x: 7.1, y: sy + 0.15, w: 4.0, h: 0.25,
        fontSize: 8.5, bold: true, color: C_GOLD,
        fontFace: 'Segoe UI', charSpacing: 2
      });

      slide.addText(sp.name, {
        x: 7.1, y: sy + 0.4, w: 5.2, h: 0.35,
        fontSize: 13, bold: true, color: C_FOREST,
        fontFace: 'Georgia'
      });

      slide.addText(sp.detail, {
        x: 7.1, y: sy + 0.75, w: 5.2, h: 0.65,
        fontSize: 10, color: C_MUTED,
        fontFace: 'Segoe UI', lineSpacing: 14
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 7: COMPARISON / SWOT / 2X2 STRATEGIC MATRIX
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Strategic Evaluation', 'Tourism Readiness & Ecosystem Matrix');

    const quadrants = [
      {
        title: 'STRENGTHS (Cordillera Authenticity)',
        color: C_FOREST,
        accent: C_GOLD,
        points: [
          'Untouched pristine river valleys and eco-trails',
          'Rich Tingguian indigenous weaving & folklore',
          'Warm local hospitality and authentic homestays'
        ]
      },
      {
        title: 'OPPORTUNITIES (Digital Acceleration)',
        color: C_FOREST,
        accent: C_GOLD,
        points: [
          'Unified Abraventure mobile-ready web portal',
          'Standardized digital accreditation & reviews',
          'Community-based tour package marketing'
        ]
      },
      {
        title: 'CONSIDERATIONS (Highland Geography)',
        color: C_MID_FOREST,
        accent: C_BORDER,
        points: [
          'Limited cell service in interior hinterlands',
          'Seasonal access during heavy torrential monsoons',
          'Strict carrying capacity needed at fragile eco-sites'
        ]
      },
      {
        title: 'ACTION DIRECTIVES (Mitigation & Governance)',
        color: C_MID_FOREST,
        accent: C_BORDER,
        points: [
          'Mandatory tourist registration & licensed guides',
          'Offline downloadable maps and travel guide cards',
          'Coordinated PDRRMO emergency dispatch desk'
        ]
      }
    ];

    quadrants.forEach((q, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const qx = 0.8 + (col * 5.95);
      const qy = 1.8 + (row * 2.5);
      const qw = 5.75;
      const qh = 2.3;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: qx, y: qy, w: qw, h: qh,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 }
      });

      // Top colored badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: qx, y: qy, w: qw, h: 0.45,
        rectRadius: 0.08,
        fill: { color: q.color }
      });

      slide.addText(q.title, {
        x: qx + 0.3, y: qy + 0.1, w: qw - 0.6, h: 0.25,
        fontSize: 9.5, bold: true, color: C_LIGHT_GOLD,
        fontFace: 'Segoe UI', charSpacing: 1.5
      });

      const bulletText = q.points.map(p => `•  ${p}`).join('\n');
      slide.addText(bulletText, {
        x: qx + 0.3, y: qy + 0.6, w: qw - 0.6, h: 1.5,
        fontSize: 10.5, color: C_TEXT,
        fontFace: 'Segoe UI', lineSpacing: 20
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 8: PROJECT TIMELINE / ROADMAP
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Implementation Milestones', 'Platform Growth & Accreditation Roadmap');

    // Horizontal timeline connector line
    slide.addShape(pptx.ShapeType.line, {
      x: 1.5, y: 3.2, w: 10.3, h: 0,
      line: { color: C_GOLD, width: 3 }
    });

    const phases = [
      {
        q: 'PHASE 01',
        title: 'Platform Foundation',
        time: 'Q1 2026',
        items: ['Directory of 27 municipalities', 'Official seal badge integration', 'Provincial portal launch']
      },
      {
        q: 'PHASE 02',
        title: 'Local Accreditation',
        time: 'Q2 2026',
        items: ['Homestay owner verification', 'Tour guide credential licensing', 'Municipal review desks']
      },
      {
        q: 'PHASE 03',
        title: 'Expedition Packages',
        time: 'Q3 2026',
        items: ['Multi-day tour packages', 'Public inquiry booking system', 'Live advisory bulletins']
      },
      {
        q: 'PHASE 04',
        title: 'Regional Expansion',
        time: 'Q4 2026',
        items: ['DOT CAR eco-tourism summit', 'Automated provincial analytics', 'Native craft trade portal']
      }
    ];

    phases.forEach((p, idx) => {
      const px = 0.8 + (idx * 2.95);
      const py = 1.9;

      // Milestone circle node
      slide.addShape(pptx.ShapeType.ellipse, {
        x: px + 1.1, y: 2.95, w: 0.5, h: 0.5,
        fill: { color: C_FOREST },
        line: { color: C_GOLD, width: 2 }
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: px + 1.25, y: 3.1, w: 0.2, h: 0.2,
        fill: { color: C_LIGHT_GOLD }
      });

      // Top Phase pill
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px + 0.4, y: py, w: 1.9, h: 0.35,
        rectRadius: 0.1,
        fill: { color: C_FOREST }
      });
      slide.addText(p.q, {
        x: px + 0.4, y: py + 0.05, w: 1.9, h: 0.25,
        fontSize: 8.5, bold: true, color: C_LIGHT_GOLD,
        fontFace: 'Segoe UI', align: 'center', charSpacing: 2
      });

      // Card below timeline
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px, y: 3.8, w: 2.7, h: 2.8,
        rectRadius: 0.12,
        fill: { color: C_WHITE },
        line: { color: C_BORDER, width: 1.2 }
      });

      slide.addText(p.title, {
        x: px + 0.2, y: 4.0, w: 2.3, h: 0.5,
        fontSize: 13, bold: true, color: C_FOREST,
        fontFace: 'Georgia', align: 'center'
      });

      slide.addText(p.time, {
        x: px + 0.2, y: 4.5, w: 2.3, h: 0.25,
        fontSize: 9, bold: true, color: C_GOLD,
        fontFace: 'Segoe UI', align: 'center'
      });

      slide.addShape(pptx.ShapeType.line, {
        x: px + 0.5, y: 4.85, w: 1.7, h: 0,
        line: { color: C_BORDER, width: 1 }
      });

      const bulletStr = p.items.map(it => `• ${it}`).join('\n');
      slide.addText(bulletStr, {
        x: px + 0.2, y: 5.0, w: 2.3, h: 1.4,
        fontSize: 9.5, color: C_MUTED,
        fontFace: 'Segoe UI', lineSpacing: 16
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 9: EDITORIAL CONTENT / MULTI-PURPOSE CONTENT SLIDE
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_CREAM };
    addLightSlideHeader(slide, 'Custom Content Slide', 'Customizable Multi-Purpose Layout');

    // Left Column: Main Body text area
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.7, w: 7.5, h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_BORDER, width: 1.2 }
    });

    slide.addText('PRIMARY TOPIC HEADING', {
      x: 1.2, y: 2.0, w: 6.7, h: 0.3,
      fontSize: 10, bold: true, color: C_GOLD,
      fontFace: 'Segoe UI', charSpacing: 2
    });

    slide.addText('Replace with Your Presentation Topic & Discussion Points', {
      x: 1.2, y: 2.3, w: 6.7, h: 0.5,
      fontSize: 18, bold: true, color: C_FOREST,
      fontFace: 'Georgia'
    });

    slide.addText('This slide is formatted for deep narrative explanations, project updates, or detailed operational guides. You can easily duplicate this slide in PowerPoint and adapt the text blocks to your meeting or briefing.', {
      x: 1.2, y: 2.9, w: 6.7, h: 0.8,
      fontSize: 11.5, color: C_TEXT,
      fontFace: 'Segoe UI', lineSpacing: 18
    });

    slide.addText([
      { text: '• Key Finding or Point 1: ', options: { bold: true, color: C_FOREST } },
      { text: 'Enter specific metrics, observations, or field reports regarding municipal tourism activities.\n', options: { color: C_MUTED } },
      { text: '• Key Finding or Point 2: ', options: { bold: true, color: C_FOREST } },
      { text: 'Detail stakeholder collaboration between Municipal LGU officers and local community cooperatives.\n', options: { color: C_MUTED } },
      { text: '• Key Finding or Point 3: ', options: { bold: true, color: C_FOREST } },
      { text: 'Outline recommended policy updates, budget allocation, or safety advisory protocols.', options: { color: C_MUTED } }
    ], {
      x: 1.2, y: 3.8, w: 6.7, h: 2.2,
      fontSize: 11, fontFace: 'Segoe UI', lineSpacing: 20
    });

    // Right Column: Callout Note & Quick Facts Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.6, y: 1.7, w: 3.93, h: 2.3,
      rectRadius: 0.15,
      fill: { color: C_FOREST },
      line: { color: C_GOLD, width: 1.2 }
    });

    slide.addText('PROVINCIAL NOTICE', {
      x: 8.9, y: 1.95, w: 3.3, h: 0.25,
      fontSize: 8.5, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', charSpacing: 2
    });

    slide.addText('Official Protocol Callout', {
      x: 8.9, y: 2.25, w: 3.3, h: 0.35,
      fontSize: 14, bold: true, color: C_WHITE,
      fontFace: 'Georgia'
    });

    slide.addText('Use this highlight card to draw immediate attention to critical takeaways, executive decisions, or regulatory compliance notes.', {
      x: 8.9, y: 2.65, w: 3.3, h: 1.1,
      fontSize: 10, color: 'CBD5E1',
      fontFace: 'Segoe UI', lineSpacing: 15
    });

    // Lower Right Stats Box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.6, y: 4.2, w: 3.93, h: 2.4,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: C_BORDER, width: 1.2 }
    });

    slide.addText('QUICK STATS AT A GLANCE', {
      x: 8.9, y: 4.4, w: 3.3, h: 0.25,
      fontSize: 8.5, bold: true, color: C_GOLD,
      fontFace: 'Segoe UI', charSpacing: 2
    });

    slide.addText([
      { text: '✓  100% ', options: { bold: true, color: C_FOREST } },
      { text: 'DOT Cordillera Endorsed\n', options: { color: C_MUTED } },
      { text: '✓  27/27 ', options: { bold: true, color: C_FOREST } },
      { text: 'LGUs Active on Portal\n', options: { color: C_MUTED } },
      { text: '✓  Real-Time ', options: { bold: true, color: C_FOREST } },
      { text: 'Emergency Bulletin Sync', options: { color: C_MUTED } }
    ], {
      x: 8.9, y: 4.75, w: 3.3, h: 1.6,
      fontSize: 10.5, fontFace: 'Segoe UI', lineSpacing: 22
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 10: CLOSING & CONTACT DESK (Deep Forest Elegance)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_FOREST };

    // Gold decorative inner frame
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.5, w: 12.33, h: 6.5,
      line: { color: C_GOLD, width: 1.5 },
      fill: { color: C_FOREST }
    });

    // Big Logo Centered
    if (hasLogo) {
      slide.addImage({
        path: logoPath,
        x: 5.8, y: 1.0, w: 1.7, h: 1.7
      });
    }

    slide.addText('AGBIAG TI ABRA! · MABUHAY!', {
      x: 1.0, y: 2.85, w: 11.33, h: 0.35,
      fontSize: 11, bold: true, color: C_LIGHT_GOLD,
      fontFace: 'Segoe UI', align: 'center', charSpacing: 4
    });

    slide.addText('Thank You for Exploring Abra', {
      x: 1.0, y: 3.2, w: 11.33, h: 0.7,
      fontSize: 34, bold: true, color: C_WHITE,
      fontFace: 'Georgia', align: 'center'
    });

    slide.addText('For municipal coordination, tour inquiries, or accreditation filings:', {
      x: 1.0, y: 3.95, w: 11.33, h: 0.35,
      fontSize: 12, italic: true, color: 'CBD5E1',
      fontFace: 'Georgia', align: 'center'
    });

    // 3 Contact Blocks
    const contactBoxes = [
      { label: 'PROVINCIAL CAPITOL', line1: 'Provincial Tourism Office', line2: 'Bangued, Abra 2800' },
      { label: 'DIRECT DESK HOTLINE', line1: '(074) 752-8200', line2: '+63 917 123 4567' },
      { label: 'DIGITAL PORTAL', line1: 'tourism@abra.gov.ph', line2: 'www.abraventure.ph' }
    ];

    contactBoxes.forEach((c, idx) => {
      const cx = 1.8 + (idx * 3.4);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: 4.5, w: 3.0, h: 1.5,
        rectRadius: 0.1,
        fill: { color: '0E2319' },
        line: { color: C_GOLD, width: 1 }
      });

      slide.addText(c.label, {
        x: cx + 0.2, y: 4.65, w: 2.6, h: 0.25,
        fontSize: 8.5, bold: true, color: C_LIGHT_GOLD,
        fontFace: 'Segoe UI', align: 'center', charSpacing: 2
      });

      slide.addText(`${c.line1}\n${c.line2}`, {
        x: cx + 0.2, y: 4.95, w: 2.6, h: 0.8,
        fontSize: 10, color: C_WHITE,
        fontFace: 'Segoe UI', align: 'center', lineSpacing: 16
      });
    });

    slide.addText('© 2026 Provincial Tourism Office of Abra · Cordillera Administrative Region · Republic of the Philippines', {
      x: 1.0, y: 6.3, w: 11.33, h: 0.3,
      fontSize: 8.5, color: '94A3B8', fontFace: 'Segoe UI', align: 'center'
    });
  }

  // Save the presentation
  const outputPath = path.resolve(__dirname, '../../Abraventure_Presentation_Template.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log('Successfully generated PPTX at:', outputPath);
}

createAbraventureTemplate().catch(err => {
  console.error('Error generating PPTX:', err);
  process.exit(1);
});
