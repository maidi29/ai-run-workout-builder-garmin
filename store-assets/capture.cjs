#!/usr/bin/env node
/**
 * Capture store-assets HTML files as PNG images at exact pixel dimensions.
 *
 * Usage:   node capture.cjs
 * Requires: npm install puppeteer sharp
 * Output:  store-assets/output/*.png
 */

const path = require("path");
const fs = require("fs");

const assets = [
  {
    file: "feature-graphic.html",
    out: "feature-graphic.png",
    w: 1024,
    h: 500,
  },
  {
    file: "screenshot-1-text-input.html",
    out: "screenshot-1-text-input.png",
    w: 1080,
    h: 1920,
  },
  {
    file: "screenshot-2-image-input.html",
    out: "screenshot-2-image-input.png",
    w: 1080,
    h: 1920,
  },
  {
    file: "screenshot-3-suggest.html",
    out: "screenshot-3-suggest.png",
    w: 1080,
    h: 1920,
  },
  {
    file: "screenshot-4-preview-edit.html",
    out: "screenshot-4-preview-edit.png",
    w: 1080,
    h: 1920,
  },
];
const ASSETS_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, "output");

async function run() {
  // Ensure output dir exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    console.error("❌  puppeteer not found. Run: npm install puppeteer");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const asset of assets) {
    const page = await browser.newPage();
    await page.setViewport({
      width: asset.w,
      height: asset.h,
      deviceScaleFactor: 1,
    });

    const fileUrl = `file://${path.join(ASSETS_DIR, asset.file)}`;
    await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 15000 });

    // Wait for Google Fonts / layout to settle
    await new Promise((r) => setTimeout(r, 1200));

    const outPath = path.join(OUTPUT_DIR, asset.out);
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: asset.w, height: asset.h },
    });

    console.log(`✓  ${asset.out}  (${asset.w}×${asset.h})`);
    await page.close();
  }

  await browser.close();
  console.log(`\n🎉  All assets saved to store-assets/output/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
