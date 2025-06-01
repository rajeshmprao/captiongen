# Test script for raw binary upload

$url = "https://captiongen-func-xyz.azurewebsites.net/api/GenerateCaption"
# $url = "http://localhost:7071/api/GenerateCaption"
$apiKey = "HKRqJXbJcFPPmO3vCjo4Ng=="
$imagePath = "testing/images/navya-alone.jpg"
$captionType = "funny"

# Read the image file as bytes
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)

# Create the request
$headers = @{
    "x-api-key" = $apiKey
    "Content-Type" = "application/octet-stream"
    "x-caption-type" = $captionType
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $imageBytes
    Write-Host "Success! Caption:" -ForegroundColor Green
    Write-Host $response.caption
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd()
    }
}
