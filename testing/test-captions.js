const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:7071/api/GenerateCaption';
const API_KEY = 'HKRqJXbJcFPPmO3vCjo4Ng==';
const IMAGES_DIR = './images';
const CAPTION_TYPES = ['funny', 'romantic', 'motivational', 'explain', 'default'];
const OUTPUT_FILE = 'caption-results.json';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function generateCaption(imageBuffer, captionType) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/octet-stream',
        'x-caption-type': captionType
      },
      body: imageBuffer
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return { success: true, caption: data.caption };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processImage(imagePath) {
  const imageName = path.basename(imagePath);
  console.log(`\n${colors.bright}${colors.blue}📸 Processing: ${imageName}${colors.reset}`);
  
  const imageBuffer = await fs.readFile(imagePath);
  const results = {};
  
  for (const captionType of CAPTION_TYPES) {
    process.stdout.write(`  ${colors.yellow}→ ${captionType}...${colors.reset} `);
    
    const startTime = Date.now();
    const result = await generateCaption(imageBuffer, captionType);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`${colors.green}✓${colors.reset} (${duration}ms)`);
      console.log(`    ${colors.cyan}"${result.caption}"${colors.reset}`);
      results[captionType] = {
        caption: result.caption,
        duration: duration
      };
    } else {
      console.log(`${colors.red}✗ Error: ${result.error}${colors.reset}`);
      results[captionType] = {
        error: result.error,
        duration: duration
      };
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    image: imageName,
    timestamp: new Date().toISOString(),
    results: results
  };
}

async function main() {
  console.log(`${colors.bright}🚀 Caption Generation Test Suite${colors.reset}\n`);
  
  try {
    // Check if images directory exists
    try {
      await fs.access(IMAGES_DIR);
    } catch {
      console.log(`${colors.yellow}Creating images directory...${colors.reset}`);
      await fs.mkdir(IMAGES_DIR);
      console.log(`${colors.red}Please add test images to the ./images directory and run again.${colors.reset}`);
      return;
    }
    
    // Get all image files
    const files = await fs.readdir(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    
    if (imageFiles.length === 0) {
      console.log(`${colors.red}No images found in ./images directory.${colors.reset}`);
      console.log('Add images with extensions: .jpg, .jpeg, .png, .gif, or .webp');
      return;
    }
    
    console.log(`Found ${imageFiles.length} images to process\n`);
    
    const allResults = [];
    
    // Process each image
    for (const imageFile of imageFiles) {
      const imagePath = path.join(IMAGES_DIR, imageFile);
      const result = await processImage(imagePath);
      allResults.push(result);
    }
    
    // Save results to JSON file
    await fs.writeFile(
      OUTPUT_FILE, 
      JSON.stringify(allResults, null, 2)
    );
    
    console.log(`\n${colors.green}✅ Results saved to ${OUTPUT_FILE}${colors.reset}`);
    
    // Print summary
    console.log(`\n${colors.bright}📊 Summary:${colors.reset}`);
    
    let totalCaptions = 0;
    let totalErrors = 0;
    let totalDuration = 0;
    
    allResults.forEach(imageResult => {
      Object.values(imageResult.results).forEach(result => {
        if (result.caption) {
          totalCaptions++;
          totalDuration += result.duration;
        } else {
          totalErrors++;
        }
      });
    });
    
    console.log(`  Total images: ${imageFiles.length}`);
    console.log(`  Caption types tested: ${CAPTION_TYPES.length}`);
    console.log(`  Successful captions: ${colors.green}${totalCaptions}${colors.reset}`);
    console.log(`  Errors: ${colors.red}${totalErrors}${colors.reset}`);
    if (totalCaptions > 0) {
      console.log(`  Average response time: ${Math.round(totalDuration / totalCaptions)}ms`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

// Run the test suite
main().catch(console.error);
