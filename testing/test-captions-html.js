const fs = require('fs').promises;
const path = require('path');

async function generateHTMLReport() {
  try {
    const data = await fs.readFile('caption-results.json', 'utf8');
    const results = JSON.parse(data);
    
    // Load images and convert to base64
    const resultsWithImages = await Promise.all(results.map(async (result) => {
      try {
        const imagePath = path.join('./images', result.image);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const extension = path.extname(result.image).slice(1).toLowerCase();
        const mimeType = extension === 'jpg' ? 'jpeg' : extension;
        return {
          ...result,
          imageDataUri: `data:image/${mimeType};base64,${base64Image}`
        };
      } catch (err) {
        console.error(`Failed to load image ${result.image}:`, err.message);
        return result;
      }
    }));
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caption Generation Results</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .image-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .image-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 20px;
            align-items: start;
        }
        .image-preview {
            position: sticky;
            top: 20px;
        }
        .image-preview img {
            width: 100%;
            height: auto;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .image-name {
            font-size: 14px;
            color: #7f8c8d;
            margin-top: 10px;
            text-align: center;
        }
        .captions-container {
            flex: 1;
        }
        .caption-grid {
            display: grid;
            gap: 15px;
        }
        .caption-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        .caption-type {
            font-weight: bold;
            color: #3498db;
            text-transform: capitalize;
            margin-bottom: 5px;
        }
        .caption-text {
            color: #333;
            line-height: 1.5;
        }
        .caption-meta {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 5px;
        }
        .error {
            color: #e74c3c;
            border-left-color: #e74c3c;
        }
        .error .caption-type {
            color: #e74c3c;
        }
        .summary {
            background: #34495e;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .timestamp {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 20px;
        }
        @media (max-width: 768px) {
            .image-container {
                grid-template-columns: 1fr;
            }
            .image-preview {
                position: static;
                max-width: 400px;
                margin: 0 auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Caption Generation Test Results</h1>
        <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        
        <div class="summary">
            <h2>Summary</h2>
            <p>Tested ${resultsWithImages.length} images with ${Object.keys(resultsWithImages[0]?.results || {}).length} caption types each</p>
        </div>
        
        ${resultsWithImages.map(imageResult => `
            <div class="image-section">
                <div class="image-container">
                    <div class="image-preview">
                        ${imageResult.imageDataUri 
                            ? `<img src="${imageResult.imageDataUri}" alt="${imageResult.image}" loading="lazy">`
                            : `<div style="padding: 100px 20px; background: #f0f0f0; text-align: center; border-radius: 6px;">Image not found</div>`
                        }
                        <div class="image-name">📸 ${imageResult.image}</div>
                    </div>
                    <div class="captions-container">
                        <div class="caption-grid">
                            ${Object.entries(imageResult.results).map(([type, result]) => `
                                <div class="caption-item ${result.error ? 'error' : ''}">
                                    <div class="caption-type">${type}</div>
                                    ${result.caption 
                                        ? `<div class="caption-text">${result.caption}</div>`
                                        : `<div class="caption-text">Error: ${result.error}</div>`
                                    }
                                    <div class="caption-meta">Response time: ${result.duration}ms</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    
    await fs.writeFile('caption-results.html', html);
    console.log('HTML report generated: caption-results.html');
    
  } catch (error) {
    console.error('Error generating HTML report:', error);
  }
}

generateHTMLReport();
