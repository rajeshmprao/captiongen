# AI Caption Generator

A serverless image caption generator powered by OpenAI's GPT-4 Vision API and Azure Functions.

## Project Structure

```
captiongen-func/
├── backend/          # Azure Functions backend
├── frontend/         # React frontend (future)
├── testing/          # Test suite and utilities
└── package.json      # Monorepo root
```

## Setup

### Prerequisites
- Node.js 20.x or higher
- Azure Functions Core Tools v4
- Azure subscription (for deployment)

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
cd backend && npm install
cd ../testing && npm install
```

### Configuration

1. **Backend Configuration** (`backend/local.settings.json`):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_API_KEY": "your-openai-api-key",
    "SHARED_SECRET": "your-shared-secret"
  }
}
```

2. **Environment Variables**:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SHARED_SECRET`: API authentication secret

## Development

### Run Backend Locally
```bash
npm run start:backend
# Or
cd backend && func start
```

### Run Tests
```bash
cd testing
npm test                    # Test against local endpoint
npm run test:prod          # Test against production
npm run report             # Generate HTML report
```

## API Usage

### Endpoint
```
POST /api/GenerateCaption
```

### Headers
- `Content-Type: application/octet-stream`
- `x-api-key: {your-shared-secret}`
- `x-caption-type: {funny|romantic|motivational|explain|default}`

### Example Request
```bash
curl -X POST "http://localhost:7071/api/GenerateCaption" \
  -H "x-api-key: your-secret" \
  -H "Content-Type: application/octet-stream" \
  -H "x-caption-type: funny" \
  --data-binary @image.jpg
```

### Response
```json
{
  "caption": "Your AI-generated caption here! 😄"
}
```

## Caption Types

- **funny**: Witty, playful captions with Gen-Z vibes
- **romantic**: Sweet, genuine romantic captions
- **motivational**: Uplifting, action-inspiring captions
- **explain**: Detailed image descriptions
- **default**: Creative, engaging general captions

## Deployment

### Deploy to Azure
```bash
cd backend
func azure functionapp publish captiongen-func-xyz --build remote
```

### Set Production App Settings
```bash
az functionapp config appsettings set \
  --name captiongen-func-xyz \
  --resource-group YourResourceGroup \
  --settings OPENAI_API_KEY="your-key" SHARED_SECRET="your-secret"
```

## Testing

The testing suite includes:
- Automated testing for all caption types
- Performance metrics
- HTML report generation with embedded images
- Support for both local and production testing

### Add Test Images
Place test images in `testing/images/` directory.

### Run Test Suite
```bash
cd testing
npm test
npm run report  # Generate visual HTML report
```

## Troubleshooting

### Sharp Module Issues
If you encounter Sharp module errors in production:
```bash
# Deploy with remote build
func azure functionapp publish captiongen-func-xyz --build remote
```

### Binary Data Corruption
Ensure you're using:
- `Content-Type: application/octet-stream`
- Binary data handling in function.json
- Raw binary POST (not multipart)

## License

MIT
