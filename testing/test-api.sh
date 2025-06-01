#!/bin/bash

# Test the Azure Functions Caption Generator API
# Usage: ./test-api.sh [API_KEY]

API_KEY="${1:-your-api-key-here}"
API_URL="https://captiongen-func-xyz.azurewebsites.net/api/GenerateCaption"

# Test image (small base64 encoded test image - 1x1 pixel red PNG)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

echo "Testing Caption Generator API..."
echo "API URL: $API_URL"
echo "API Key: ${API_KEY:0:10}..."

# Test with default caption type
echo -e "\n=== Testing Default Caption Type ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$TEST_IMAGE'",
    "captionType": "default",
    "apiKey": "'$API_KEY'"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test with funny caption type
echo -e "\n=== Testing Funny Caption Type ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$TEST_IMAGE'",
    "captionType": "funny",
    "apiKey": "'$API_KEY'"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test with romantic caption type
echo -e "\n=== Testing Romantic Caption Type ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$TEST_IMAGE'",
    "captionType": "romantic",
    "apiKey": "'$API_KEY'"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test error case - missing API key
echo -e "\n=== Testing Error Case (No API Key) ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$TEST_IMAGE'",
    "captionType": "default"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\nTesting complete!"
