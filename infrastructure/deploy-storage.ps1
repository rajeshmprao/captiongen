# Deploy Azure Table Storage for CaptionGen Authentication
# This script creates the required storage infrastructure for user authentication

param(
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName = "captiongenstorage",

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "CaptionGenFuncRG",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "Central India",
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppName = "captiongen-func-xyz"
)

# Ensure Azure CLI is logged in
Write-Host "Checking Azure CLI login status..." -ForegroundColor Yellow
$loginCheck = az account show --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure CLI first: az login" -ForegroundColor Red
    exit 1
}

Write-Host "Starting deployment of storage infrastructure..." -ForegroundColor Green

# Check if resource group exists, create if not
Write-Host "Checking resource group: $ResourceGroupName" -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName --output tsv
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create resource group" -ForegroundColor Red
        exit 1
    }
}

# Deploy ARM template
Write-Host "Deploying storage account and tables..." -ForegroundColor Yellow
$deploymentResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "storage.json" `
    --parameters storageAccountName=$StorageAccountName location=$Location `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "ARM template deployment failed" -ForegroundColor Red
    exit 1
}

# Extract outputs
$connectionString = $deploymentResult.properties.outputs.storageAccountConnectionString.value
$storageKey = $deploymentResult.properties.outputs.storageAccountKey.value

Write-Host "Storage account created successfully!" -ForegroundColor Green
Write-Host "Storage Account Name: $StorageAccountName" -ForegroundColor Cyan
Write-Host "Tables created: Users, UserSessions, UserUsage" -ForegroundColor Cyan

# Update Function App settings if provided
if ($FunctionAppName -ne "") {
    Write-Host "Updating Function App settings..." -ForegroundColor Yellow
    
    # Add storage connection string to Function App
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --settings "STORAGE_CONNECTION_STRING=$connectionString"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Function App settings updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Warning: Failed to update Function App settings. Please add manually:" -ForegroundColor Yellow
        Write-Host "STORAGE_CONNECTION_STRING=$connectionString" -ForegroundColor Gray
    }
} else {
    Write-Host "Manual Configuration Required:" -ForegroundColor Yellow
    Write-Host "Add this to your Function App settings:" -ForegroundColor Yellow
    Write-Host "STORAGE_CONNECTION_STRING=$connectionString" -ForegroundColor Gray
}

# Generate JWT secret for local development
$jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
Write-Host "Generated JWT Secret (add to local.settings.json):" -ForegroundColor Yellow
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Gray

Write-Host "Infrastructure deployment completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add STORAGE_CONNECTION_STRING to your Function App settings" -ForegroundColor White
Write-Host "2. Add JWT_SECRET to your Function App settings" -ForegroundColor White
Write-Host "3. Configure Google OAuth credentials" -ForegroundColor White
