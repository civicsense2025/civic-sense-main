#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple SVG that can be used as a placeholder
const createSVGIcon = (size, color = '#3B82F6') => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">CS</text>
</svg>
`;

// Create placeholder assets
const assets = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'adaptive-icon-monochrome.png', size: 1024, color: '#000000' },
  { name: 'favicon.png', size: 48 },
  { name: 'splash.png', size: 1284 }
];

console.log('Creating placeholder assets...');

assets.forEach(asset => {
  const svgContent = createSVGIcon(asset.size, asset.color);
  const svgPath = path.join(assetsDir, asset.name.replace('.png', '.svg'));
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${asset.name.replace('.png', '.svg')}`);
});

console.log('\nPlaceholder assets created!');
console.log('Note: These are SVG placeholders. For production, you should:');
console.log('1. Create proper PNG/JPG assets with your actual design');
console.log('2. Use tools like Figma, Sketch, or Adobe Illustrator');
console.log('3. Optimize images for different screen densities');
console.log('4. Run: npx expo install @expo/image-utils for automatic optimization'); 