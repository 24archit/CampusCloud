# deploy.ps1 - Windows PowerShell deployment script for Smart Campus Resource Management System
param(
    [string]$Environment = "prod",
    [string]$Region = "ap-south-1",
    [string]$StackName = "campus-cloud-stack"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Smart Campus Resource Management System - Deployment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Environment : $Environment" -ForegroundColor Yellow
Write-Host "  Region      : $Region" -ForegroundColor Yellow
Write-Host "  Stack Name  : $StackName" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
Write-Host "`n[0/5] Running pre-flight checks..." -ForegroundColor Magenta

$tools = @("aws", "sam", "node", "npm")
foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$tool' is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }
}

# Verify AWS credentials
$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}
Write-Host "  AWS Identity OK: $identity" -ForegroundColor Gray
Write-Host "  Pre-flight checks passed." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 1 – Build frontend (initial build to get artifact ready for SAM)
# ---------------------------------------------------------------------------
Write-Host "`n[1/5] Building frontend..." -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $projectRoot "frontend"
$infraDir    = Join-Path $projectRoot "infrastructure"

Set-Location $frontendDir
npm ci --silent
if ($LASTEXITCODE -ne 0) { throw "npm ci failed in frontend" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

Write-Host "  Frontend build complete." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 2 – SAM Build
# ---------------------------------------------------------------------------
Write-Host "`n[2/5] Building SAM application..." -ForegroundColor Green

Set-Location $infraDir
sam build --cached --parallel
if ($LASTEXITCODE -ne 0) { throw "SAM build failed" }

Write-Host "  SAM build complete." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 3 – SAM Deploy (infrastructure)
# ---------------------------------------------------------------------------
Write-Host "`n[3/5] Deploying infrastructure to AWS ($Region)..." -ForegroundColor Green

sam deploy `
    --stack-name $StackName `
    --region $Region `
    --parameter-overrides Environment=$Environment `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --resolve-s3 `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) { throw "SAM deploy failed" }

Write-Host "  Infrastructure deployed." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 4 – Retrieve CloudFormation outputs
# ---------------------------------------------------------------------------
Write-Host "`n[4/5] Retrieving deployment outputs..." -ForegroundColor Green

$rawOutputs = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) { throw "Failed to retrieve stack outputs" }

$apiUrl        = ($rawOutputs | Where-Object { $_.OutputKey -eq 'ApiGatewayUrl'        }).OutputValue
$frontendUrl   = ($rawOutputs | Where-Object { $_.OutputKey -eq 'CloudFrontUrl'        }).OutputValue
$frontendBucket= ($rawOutputs | Where-Object { $_.OutputKey -eq 'FrontendBucketName'   }).OutputValue
$cfDistId      = ($rawOutputs | Where-Object { $_.OutputKey -eq 'CloudFrontDistributionId' }).OutputValue
$userPoolId    = ($rawOutputs | Where-Object { $_.OutputKey -eq 'UserPoolId'           }).OutputValue
$userPoolClient= ($rawOutputs | Where-Object { $_.OutputKey -eq 'UserPoolClientId'     }).OutputValue

Write-Host "  API URL         : $apiUrl"
Write-Host "  Frontend URL    : $frontendUrl"
Write-Host "  Frontend Bucket : $frontendBucket"
Write-Host "  CloudFront ID   : $cfDistId"
Write-Host "  User Pool ID    : $userPoolId"
Write-Host "  App Client ID   : $userPoolClient"

# ---------------------------------------------------------------------------
# Step 5 – Rebuild frontend with live API URL and deploy to S3
# ---------------------------------------------------------------------------
Write-Host "`n[5/5] Re-building frontend with live API endpoint and deploying to S3..." -ForegroundColor Green

Set-Location $frontendDir

# Write production env file with real API endpoint
@"
VITE_API_URL=$apiUrl
VITE_COGNITO_USER_POOL_ID=$userPoolId
VITE_COGNITO_CLIENT_ID=$userPoolClient
VITE_APP_NAME=Smart Campus Resource Management System
VITE_ENVIRONMENT=$Environment
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend re-build with live API URL failed" }

# Sync to S3
aws s3 sync dist/ "s3://$frontendBucket/" --delete --region $Region
if ($LASTEXITCODE -ne 0) { throw "S3 sync failed" }

# Invalidate CloudFront cache
if ($cfDistId) {
    Write-Host "  Invalidating CloudFront cache..." -ForegroundColor Gray
    aws cloudfront create-invalidation --distribution-id $cfDistId --paths "/*" | Out-Null
    Write-Host "  Cache invalidation submitted." -ForegroundColor Gray
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Application URL  : $frontendUrl" -ForegroundColor Green
Write-Host "  API Endpoint     : $apiUrl"       -ForegroundColor Green
Write-Host "  Cognito Pool     : $userPoolId"   -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  NOTE: CloudFront propagation may take 2-5 minutes." -ForegroundColor Yellow
