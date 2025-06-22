# AI Caption Generator

A full-stack serverless application that generates AI-powered captions for images using OpenAI's GPT-4 Vision API, Azure Functions backend, and React frontend.

## 🚀 Features

### Caption Generation Systems
- **Legacy System**: Traditional caption types (funny, romantic, motivational, explain, default)
- **Advanced Vibe System**: Granular control with 6 emotional dimensions:
  - **Humor** (0-100): From serious to comedy gold
  - **Romance** (0-100): From platonic to heartfelt affection
  - **Energy** (0-100): From calm to high-energy excitement
  - **Formality** (0-100): From casual to professional
  - **Sarcasm** (0-100): From sincere to witty/ironic
  - **Poeticism** (0-100): From simple to lyrical language

### Technical Features
- **Serverless Architecture**: Azure Functions backend
- **Real-time Processing**: Image upload and instant caption generation
- **Multi-format Support**: JPEG, PNG, GIF, WebP
- **Smart Image Processing**: Automatic resizing and optimization with Sharp
- **Dual API Systems**: Support for both binary and JSON payloads
- **Carousel/Photo Dump Support**: Multi-image caption generation with cross-image analysis
- **Comprehensive Testing**: Automated test suite with visual reports
- **CORS Support**: Frontend-backend integration ready

## 📖 API Documentation

- **[Carousel API Integration Guide](./CAROUSEL_API_DOCUMENTATION.md)**: Complete documentation for integrating the carousel caption API with Flutter/mobile apps

## 📁 Project Structure

```
captiongen-func/
├── backend/                    # Azure Functions backend
│   ├── GenerateCaption/       # Single image function
│   │   ├── index.js          # Function logic
│   │   ├── promptGenerator.js # AI prompt system
│   │   ├── telemetry.js      # Logging and metrics
│   │   └── function.json     # Function configuration
│   ├── GenerateCarouselCaption/ # Multi-image function
│   │   ├── index.js          # Carousel function logic
│   │   ├── carouselPromptGenerator.js # Photo dump AI prompts
│   │   └── function.json     # Function configuration
│   ├── package.json
│   └── local.settings.json   # Local config (create this)
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── App.js           # Main application
│   │   ├── components/      # UI components
│   │   └── ...
│   └── package.json
├── testing/                   # Test suite
│   ├── test-captions.js      # Main test runner
│   ├── test-captions-html.js # HTML report generator
│   ├── test-api.sh          # Shell script tester
│   ├── images/              # Test images (add your own)
│   └── package.json
└── README.md
```

## 🛠️ Quick Start

### Prerequisites
- **Node.js** 20.x or higher
- **Azure Functions Core Tools** v4 (`npm i -g azure-functions-core-tools@4 --unsafe-perm true`)
- **OpenAI API Key** (for GPT-4 Vision)
- **Azure Subscription** (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd captiongen-func

# Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../testing && npm install
```

### 2. Backend Configuration

Create `backend/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_API_KEY": "sk-your-openai-api-key-here",
    "SHARED_SECRET": "your-secure-api-key-here",
    "NODE_ENV": "development"
  }
}
```

### 3. Start Development

```bash
# Terminal 1: Start backend
cd backend
func start

# Terminal 2: Start frontend (in another terminal)
cd frontend
npm start

# Terminal 3: Run tests (optional)
cd testing
npm test
```

The backend runs on `http://localhost:7071` and frontend on `http://localhost:3000`.

## 🎨 Usage Examples

### Frontend Usage
1. Open `http://localhost:3000`
2. Enter your API key (the `SHARED_SECRET` from backend config)
3. Upload an image
4. Choose between:
   - **Traditional**: Select caption type (funny, romantic, etc.)
   - **Advanced**: Adjust vibe sliders for custom personality
5. Click "Generate Caption"

### API Usage

#### Single Image Caption Generation

##### Legacy System (Binary Upload)
```bash
curl -X POST "http://localhost:7071/api/GenerateCaption" \
  -H "x-api-key: your-shared-secret" \
  -H "Content-Type: application/octet-stream" \
  -H "x-caption-type: funny" \
  --data-binary @your-image.jpg
```

##### New System (JSON with Vibes)
```bash
curl -X POST "http://localhost:7071/api/GenerateCaption" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64-encoded-image-data",
    "apiKey": "your-shared-secret",
    "vibes": {
      "humor": 80,
      "romance": 20,
      "energy": 60,
      "formality": 30,
      "sarcasm": 40,
      "poeticism": 25
    }
  }'
```

##### Single Image Response Format
```json
{
  "caption": "Your AI-generated caption here! 😄"
}
```

#### Carousel/Photo Dump Caption Generation

##### Carousel System (JSON Only)
```bash
curl -X POST "http://localhost:7071/api/GenerateCarouselCaption" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "base64-encoded-image-1",
      "base64-encoded-image-2",
      "base64-encoded-image-3"
    ],
    "apiKey": "your-shared-secret",
    "captionType": "funny"
  }'
```

##### Carousel with Custom Vibes
```bash
curl -X POST "http://localhost:7071/api/GenerateCarouselCaption" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "base64-encoded-image-1",
      "base64-encoded-image-2"
    ],
    "apiKey": "your-shared-secret",
    "vibes": {
      "humor": 70,
      "energy": 90,
      "formality": 10,
      "sarcasm": 30,
      "romance": 5,
      "poeticism": 15
    }
  }'
```

##### Carousel Response Format
```json
{
  "masterCaption": "Cohesive narrative for the entire photo dump",
  "individualCaptions": [
    "Specific caption for first image",
    "Specific caption for second image",
    "Specific caption for third image"
  ],
  "imageCount": 3,
  "analysisQuality": "structured"
}
```

##### Carousel Constraints
- **Image Count**: 2-3 images required (strict validation)
- **Format**: Base64 encoded strings (with or without data URI prefix)
- **Supported Types**: JPEG, PNG, GIF, WebP
- **Processing**: Auto-resized to 768x768 at 85% quality
- **Authentication**: Same shared secret as single image API

## 🧪 Testing

### Setup Test Images
```bash
# Add your test images
mkdir testing/images
# Copy .jpg, .png, .gif, or .webp files to testing/images/
```

### Run Test Suite
```bash
cd testing

# Test against local backend
npm test

# Test against production
npm run test:prod

# Generate visual HTML report
npm run report
```

The test suite will:
- Test all caption types/vibe combinations
- Measure response times
- Generate `caption-results.json` and `caption-results.html`
- Display results with embedded images

## 🌐 Deployment

### Deploy Backend to Azure

```bash
cd backend

# Create function app (one-time setup)
az functionapp create \
  --resource-group your-resource-group \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name captiongen-func-xyz \
  --storage-account yourstorageaccount

# Deploy with remote build (handles Sharp dependencies)
func azure functionapp publish captiongen-func-xyz --build remote

# Set production environment variables
az functionapp config appsettings set \
  --name captiongen-func-xyz \
  --resource-group your-resource-group \
  --settings \
    OPENAI_API_KEY="your-openai-key" \
    SHARED_SECRET="your-production-secret"
```

### Deploy Frontend to GitHub Pages

```bash
cd frontend

# Update package.json homepage field with your GitHub Pages URL
# "homepage": "https://yourusername.github.io/your-repo-name"

# Deploy
npm run deploy
```

### Update Frontend API URLs

For production, update environment variables or defaults in `frontend/src/App.js`:

```bash
# Set both API URLs in environment file
echo "REACT_APP_API_URL=https://your-function-app.azurewebsites.net/api/GenerateCaption" > frontend/.env.production
echo "REACT_APP_CAROUSEL_API_URL=https://your-function-app.azurewebsites.net/api/GenerateCarouselCaption" >> frontend/.env.production

# Or update defaults in App.js
const API_URL = process.env.REACT_APP_API_URL || 'https://your-function-app.azurewebsites.net/api/GenerateCaption';
const CAROUSEL_API_URL = process.env.REACT_APP_CAROUSEL_API_URL || 'https://your-function-app.azurewebsites.net/api/GenerateCarouselCaption';
```

## 🔧 Development Workflow

### Adding New Caption Types
1. Edit `backend/GenerateCaption/promptGenerator.js`
2. Add new case in `getSystemInstructions()`
3. Update `CAPTION_TYPES` in test files
4. Update frontend selector component

### Modifying Vibe System
1. Edit vibe logic in `promptGenerator.js`
2. Update default vibes in frontend `App.js`
3. Adjust slider component ranges
4. Test with various combinations

### Local Development Tips
```bash
# Watch function logs
func start --verbose

# Test single image quickly
cd testing
node -e "
const test = require('./test-captions.js');
// Add your quick test code
"

# Monitor function performance
# Functions run at http://localhost:7071
# Admin interface at http://localhost:7071/admin/host/status
```

## 🐛 Troubleshooting

### Common Issues

#### Sharp Module Errors in Production
```bash
# Always use remote build for Azure deployment
func azure functionapp publish your-app --build remote
```

#### CORS Issues
- Verify CORS headers are set in `index.js`
- Check browser network tab for preflight OPTIONS requests
- Ensure frontend URL matches CORS origin settings

#### Image Processing Failures
- Supported formats: JPEG, PNG, GIF, WebP
- Max size: ~5MB (Azure Function limit)
- Verify base64 encoding doesn't include data URL prefix

#### API Key Issues
- Frontend API key must match backend `SHARED_SECRET`
- Check Azure Function app settings in portal
- Verify local.settings.json is not committed to git

### Debug Mode
Set `NODE_ENV=development` in backend config for detailed error messages.

### Test Connectivity
```bash
# Test backend health
curl http://localhost:7071/admin/host/status

# Test production endpoint
curl https://your-function-app.azurewebsites.net/api/GenerateCaption \
  -X OPTIONS -v
```

## 📊 Performance Notes

- **Image Processing**: Sharp optimization reduces payload size
- **Response Times**: Typically 2-8 seconds depending on image complexity
- **Concurrency**: Azure Functions auto-scales based on demand
- **Rate Limits**: OpenAI API limits apply (check your tier)

## 🔒 Security

- API keys stored in Azure App Settings (encrypted at rest)
- Frontend API key validation prevents unauthorized access
- No image data stored permanently
- CORS configured for specific origins only

## 📝 License

MIT License - feel free to use this project as a template for your own AI applications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

For questions or issues, please create a GitHub issue with:
- Error messages and logs
- Steps to reproduce
- Environment details (local/Azure, Node version, etc.)
