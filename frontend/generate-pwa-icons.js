const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Theme colors
const themes = {
  '10th': {
    primary: '#2563EB', // Blue
    badge: '10',
    folder: 'class10'
  },
  '11th': {
    primary: '#10B981', // Green
    badge: '11',
    folder: 'class11'
  },
  '12th': {
    primary: '#EC4899', // Pink
    badge: '12',
    folder: 'class12'
  }
};

// Icon sizes for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcon(size, themeKey, themeData) {
  const outputDir = path.join(__dirname, '../frontend/public/icons', themeData.folder);
  
  // Create directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create base icon with QuizMaster theme
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${themeData.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(themeData.primary, -30)};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background Circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#grad)" />
      
      <!-- QuizMaster Brain/Book Icon -->
      <g transform="translate(${size * 0.25}, ${size * 0.25})">
        <!-- Book/Brain shape -->
        <path d="M ${size * 0.1} ${size * 0.15} Q ${size * 0.25} ${size * 0.05}, ${size * 0.4} ${size * 0.15} L ${size * 0.4} ${size * 0.45} Q ${size * 0.25} ${size * 0.5}, ${size * 0.1} ${size * 0.45} Z" 
              fill="white" opacity="0.9"/>
        
        <!-- Question Mark -->
        <text x="${size * 0.25}" y="${size * 0.35}" 
              font-family="Arial, sans-serif" 
              font-size="${size * 0.2}" 
              font-weight="bold" 
              fill="${themeData.primary}" 
              text-anchor="middle">?</text>
      </g>
      
      <!-- Class Badge -->
      <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.18}" fill="white" stroke="${themeData.primary}" stroke-width="3"/>
      <text x="${size * 0.75}" y="${size * 0.29}" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.12}" 
            font-weight="bold" 
            fill="${themeData.primary}" 
            text-anchor="middle">${themeData.badge}</text>
    </svg>
  `;
  
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Generated: ${outputPath}`);
}

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA Icons...\n');
  
  for (const [themeKey, themeData] of Object.entries(themes)) {
    console.log(`\n📱 Generating icons for Class ${themeKey}...`);
    
    for (const size of sizes) {
      await generateIcon(size, themeKey, themeData);
    }
  }
  
  console.log('\n✨ All icons generated successfully!');
}

generateAllIcons().catch(console.error);
