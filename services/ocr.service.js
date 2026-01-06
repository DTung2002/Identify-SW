const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const { parseCCCD } = require("./cccd.parser");

async function scanCCCD(imagePath) {
  const processedPath = imagePath + "_processed.png";

  // xử lý ảnh để OCR đọc tốt hơn
  await sharp(imagePath)
    .resize(2000)
    .grayscale()
    .normalize()
    .threshold(160)
    .toFile(processedPath);

  const { data } = await Tesseract.recognize(
    processedPath,
    "vie",
    {
      logger: m => console.log(m.status)
    }
  );

  return parseCCCD(data.text);
}

module.exports = { scanCCCD };
