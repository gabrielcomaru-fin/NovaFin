const fs = require('fs');
const path = require('path');

async function ensureSharp() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    console.error('A dependência "sharp" não está instalada. Execute: npm i -D sharp');
    process.exit(1);
  }
}

async function run() {
  await ensureSharp();
  const sharp = require('sharp');
  const svgPath = path.resolve(__dirname, '..', 'public', 'og-image.svg');
  const pngPath = path.resolve(__dirname, '..', 'public', 'og-image.png');

  if (!fs.existsSync(svgPath)) {
    console.error('Arquivo SVG não encontrado em:', svgPath);
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(svgPath);
  try {
    await sharp(svgBuffer, { density: 300 })
      .resize(1200, 630)
      .png({ quality: 90 })
      .toFile(pngPath);
    console.log('OG PNG gerado em:', pngPath);
  } catch (err) {
    console.error('Falha ao gerar PNG:', err);
    process.exit(1);
  }
}

run();



