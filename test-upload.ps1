# Install required modules if not already installed
if (-not (Get-Module -Name "PSScriptAnalyzer" -ListAvailable)) {
    Install-Module -Name "PSScriptAnalyzer" -Force -Scope CurrentUser
}

# Generate a JWT token
$jwt = node -e "
const jwt = require('jsonwebtoken'); 
const token = jwt.sign({ id: 'test-user', role: 'admin' }, 'your_jwt_secret_key_here');
console.log(token);"

# Set headers
$headers = @{
    "Authorization" = "Bearer $jwt"
}

# Set the file path
$filePath = ".\test-image.jpg"

# Create the form data
$form = @{
    images = Get-Item -Path $filePath
}

# Make the request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/guest-sightseeing/upload" `
        -Method Post `
        -Headers $headers `
        -Form $form `
        -Verbose
    
    Write-Host "✅ Upload successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Response:" -ForegroundColor Yellow
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Yellow
}
