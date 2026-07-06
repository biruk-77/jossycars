const fs = require('fs');
const path = require('path');

const glbPath = path.join(__dirname, 'public', 'car.glb');
if (!fs.existsSync(glbPath)) {
  console.error('car.glb not found at:', glbPath);
  process.exit(1);
}

const buffer = fs.readFileSync(glbPath);
const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);
console.log('Magic:', magic, 'Version:', version, 'Length:', length);

const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.toString('utf8', 16, 20);
console.log('Chunk length:', chunkLength, 'Chunk type:', chunkType);

if (chunkType === 'JSON') {
  const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
  const json = JSON.parse(jsonStr);
  console.log('Materials list:');
  if (json.materials) {
    json.materials.forEach((mat, idx) => {
      console.log(`${idx}: ${mat.name}`);
      console.log('  pbr:', JSON.stringify(mat.pbrMetallicRoughness));
    });
  } else {
    console.log('No materials found!');
  }
} else {
  console.error('First chunk is not JSON');
}
