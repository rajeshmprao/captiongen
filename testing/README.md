# API Testing Scripts

This folder contains scripts to test the Azure Functions Caption Generator API.

## Files

- `test-api.sh` - Linux/Mac shell script
- `test-api.cmd` - Windows batch file
- `README.md` - This documentation

## Usage

### Linux/Mac
```bash
chmod +x test-api.sh
./test-api.sh your-actual-api-key
```

### Windows
```cmd
test-api.cmd your-actual-api-key
```

## What the tests do

1. **Default Caption Test** - Tests basic functionality with default caption type
2. **Funny Caption Test** - Tests the funny caption type
3. **Romantic Caption Test** - Tests the romantic caption type
4. **Error Test** - Tests error handling when API key is missing

## Expected Responses

### Success (200)
```json
{
  "caption": "Generated caption text here. 📸"
}
```

### Error (401 - Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

### Error (500 - Server Error)
```json
{
  "error": "Caption generation failed.",
  "details": "Error details (in development mode)"
}
```

## Notes

- The test uses a tiny 1x1 pixel PNG image for quick testing
- Replace `your-actual-api-key` with your real API key
- The API URL is currently hardcoded - update if needed
- Tests include HTTP status codes for debugging
