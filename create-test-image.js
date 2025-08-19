const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas
const width = 800;
const height = 600;
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');

// Fill the background
context.fillStyle = '#f0f0f0';
context.fillRect(0, 0, width, height);

// Add some text
context.font = '30px Arial';
context.fillStyle = '#333';
context.textAlign = 'center';
context.fillText('NAVI Test Image', width / 2, height / 2);
context.font = '20px Arial';
context.fillText(new Date().toISOString(), width / 2, height / 2 + 40);

// Save to file
const out = fs.createWriteStream('test-image.jpg');
const stream = canvas.createJPEGStream({ quality: 0.95 });
stream.pipe(out);

out.on('finish', () => console.log('Test image created: test-image.jpg'));
