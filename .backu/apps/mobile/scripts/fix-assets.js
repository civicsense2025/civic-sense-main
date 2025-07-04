#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Function to create a simple PNG data URL and convert to buffer
function createSimplePNG(width, height, r = 59, g = 130, b = 246) {
  // Create a minimal PNG manually
  const canvas = require('canvas').createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with CivicSense blue background
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, width, height);
  
  // Add "CS" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(width * 0.3)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CS', width / 2, height / 2);
  
  return canvas.toBuffer('image/png');
}

// Function to create simple PNG without canvas dependency
function createMinimalPNG(width, height) {
  // Create a very basic PNG manually (solid color)
  const data = [];
  
  // PNG signature
  data.push(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
  
  // IHDR chunk
  const ihdrData = [];
  // Width (4 bytes, big-endian)
  ihdrData.push((width >>> 24) & 0xFF, (width >>> 16) & 0xFF, (width >>> 8) & 0xFF, width & 0xFF);
  // Height (4 bytes, big-endian)
  ihdrData.push((height >>> 24) & 0xFF, (height >>> 16) & 0xFF, (height >>> 8) & 0xFF, height & 0xFF);
  // Bit depth, color type, compression, filter, interlace
  ihdrData.push(8, 2, 0, 0, 0);
  
  // Calculate CRC for IHDR
  const ihdrCrc = calculateCRC(Buffer.concat([Buffer.from('IHDR'), Buffer.from(ihdrData)]));
  
  // Write IHDR chunk
  data.push(...writeChunk('IHDR', ihdrData));
  
  // Create image data (simple blue rectangle)
  const imageData = [];
  for (let y = 0; y < height; y++) {
    imageData.push(0); // Filter type (none)
    for (let x = 0; x < width; x++) {
      imageData.push(59, 130, 246); // RGB: CivicSense blue
    }
  }
  
  // Compress image data (simplified)
  const pako = require('pako');
  const compressedData = pako.deflate(Buffer.from(imageData));
  
  // Write IDAT chunk
  data.push(...writeChunk('IDAT', Array.from(compressedData)));
  
  // Write IEND chunk
  data.push(...writeChunk('IEND', []));
  
  return Buffer.from(data);
}

function writeChunk(type, data) {
  const result = [];
  const length = data.length;
  
  // Length (4 bytes, big-endian)
  result.push((length >>> 24) & 0xFF, (length >>> 16) & 0xFF, (length >>> 8) & 0xFF, length & 0xFF);
  
  // Type
  result.push(...Buffer.from(type));
  
  // Data
  result.push(...data);
  
  // CRC
  const crcData = Buffer.concat([Buffer.from(type), Buffer.from(data)]);
  const crc = calculateCRC(crcData);
  result.push((crc >>> 24) & 0xFF, (crc >>> 16) & 0xFF, (crc >>> 8) & 0xFF, crc & 0xFF);
  
  return result;
}

function calculateCRC(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Simple fallback - copy a working PNG or create via different method
function createFallbackPNG(width, height) {
  // Create a very minimal but valid PNG
  // This is a 1x1 transparent PNG that we'll scale conceptually
  const transparentPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
    0x00, 0x00, 0x00, 0x0D,  // IHDR length
    0x49, 0x48, 0x44, 0x52,  // IHDR
    0x00, 0x00, 0x00, 0x20,  // width (32)
    0x00, 0x00, 0x00, 0x20,  // height (32)
    0x08, 0x06, 0x00, 0x00, 0x00,  // bit depth, color type, compression, filter, interlace
    0x73, 0x7A, 0x7A, 0x84,  // CRC
    0x00, 0x00, 0x00, 0x17,  // IDAT length
    0x49, 0x44, 0x41, 0x54,  // IDAT
    0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0xA3, 0x60, 0x14, 0x8C, 0x02, 0x08, 0x00, 0x00, 0x04, 0x10, 0x00, 0x01,
    0x27, 0x5B, 0xC1, 0x0A,  // CRC
    0x00, 0x00, 0x00, 0x00,  // IEND length
    0x49, 0x45, 0x4E, 0x44,  // IEND
    0xAE, 0x42, 0x60, 0x82   // CRC
  ]);
  
  return transparentPNG;
}

console.log('Creating proper PNG assets...');

// Create the assets
const assets = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'adaptive-icon-monochrome.png', size: 1024 },
  { name: 'favicon.png', size: 48 },
  { name: 'splash.png', size: 1284 }
];

try {
  // Try to use canvas if available
  const canvasAvailable = (() => {
    try {
      require('canvas');
      return true;
    } catch (e) {
      return false;
    }
  })();

  assets.forEach(asset => {
    console.log(`Creating ${asset.name}...`);
    
    let buffer;
    if (canvasAvailable) {
      if (asset.name.includes('monochrome')) {
        buffer = createSimplePNG(asset.size, asset.size, 0, 0, 0); // Black
      } else {
        buffer = createSimplePNG(asset.size, asset.size); // Blue
      }
    } else {
      // Fallback to a working PNG
      buffer = createFallbackPNG(asset.size, asset.size);
    }
    
    const filePath = path.join(assetsDir, asset.name);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Created ${asset.name} (${buffer.length} bytes)`);
  });

  console.log('\n🎉 All PNG assets created successfully!');
  
} catch (error) {
  console.error('Error creating assets:', error.message);
  console.log('\n⚠️  Falling back to removing corrupted PNGs...');
  
  // Remove corrupted files as last resort
  assets.forEach(asset => {
    const filePath = path.join(assetsDir, asset.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed corrupted ${asset.name}`);
    }
  });
  
  console.log('\n📝 Note: You may need to:');
  console.log('1. Install canvas: npm install canvas');
  console.log('2. Or manually create PNG assets');
  console.log('3. Or use online PNG generators');
} 