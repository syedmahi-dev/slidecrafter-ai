#!/usr/bin/env node
// cli/generate.js

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { generateSlideContent } = require('../agents/content-agent');
const { buildPresentation } = require('../engines/js/engine');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { topic: '', slides: 8, engine: process.env.DEFAULT_ENGINE || 'js', template: 'business', output: process.env.OUTPUT_DIR || './output' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic') opts.topic = args[++i];
    if (args[i] === '--slides') opts.slides = parseInt(args[++i]);
    if (args[i] === '--engine') opts.engine = args[++i];
    if (args[i] === '--template') opts.template = args[++i];
    if (args[i] === '--output') opts.output = args[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  if (!opts.topic) {
    console.error('❌  Usage: node generate.js --topic "Your Topic" [--slides 8] [--engine js|python] [--template business]');
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌  GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  console.log(`\n🤖 Generating content for: "${opts.topic}" (${opts.slides} slides)...`);

  let slideData;
  try {
    slideData = await generateSlideContent({ topic: opts.topic, slideCount: opts.slides, template: opts.template });
    console.log(`✅ Gemini returned ${slideData.slides.length} slides`);
  } catch (err) {
    console.error('❌ Content generation failed:', err.message);
    process.exit(1);
  }

  const filename = slugify(opts.topic);
  console.log(`🛠  Building presentation (engine: ${opts.engine})...`);

  try {
    const outPath = await buildPresentation({ slideData, outputDir: opts.output, filename });
    console.log(`\n✅ Done! Saved to: ${outPath}\n`);
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

main();
