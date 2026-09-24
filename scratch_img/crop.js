const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImage() {
  const publicDir = 'C:\\Users\\JOSE ALDAIR\\Desktop\\virtualpassport\\frontend\\public';
  const assetsDir = 'C:\\Users\\JOSE ALDAIR\\Desktop\\virtualpassport\\frontend\\src\\assets';
  
  // find latest png
  const dir = 'C:\\Users\\JOSE ALDAIR\\.gemini\\antigravity-ide\\brain\\ce816262-8a5f-43ed-9e89-d3a72a72d49b\\.user_uploaded';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  files.sort((a,b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
  const file = path.join(dir, files[0]);

  console.log("Processing file:", file);

  // Save the full logo
  await sharp(file)
    .trim()
    .toFile(path.join(publicDir, 'logo-full.png'));
  await sharp(file)
    .trim()
    .toFile(path.join(assetsDir, 'logo-full.png'));

  const trimmedBuffer = await sharp(file).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  
  const iconWidth = Math.floor(trimmedMeta.width * 0.38); // 38% of the trimmed width should capture the icon
  const iconHeight = trimmedMeta.height;
  
  await sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: iconWidth, height: iconHeight })
    .trim()
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(publicDir, 'favicon.png'));
    
  await sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: iconWidth, height: iconHeight })
    .trim()
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(publicDir, 'logo-icon.png'));
    
  await sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: iconWidth, height: iconHeight })
    .trim()
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(assetsDir, 'logo-icon.png'));

  console.log('Done');
}

processImage().catch(console.error);
