# cleanup.ps1 - Delete ALL AWS resources created by this project to avoid charges
param(
    [string]$StackName = "campus-cloud-stack",
    [string]$Region = "ap-south-1"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Red
Write-Host "  WARNING: This will PERMANENTLY DELETE all AWS resources!" -ForegroundColor Red
Write-Host "  Stack  : $StackName" -ForegroundColor Yellow
Write-Host "  Region : $Region" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Red

$confirm = Read-Host "`nType 'DELETE' to confirm (anything else cancels)"
if ($confirm -ne 'DELETE') {
    Write-Host "Cancelled. No resources deleted." -ForegroundColor Green
    exit 0
}

Write-Host "`nStarting cleanup..." -ForegroundColor Yellow

# ---------------------------------------------------------------------------
# 1. Retrieve stack outputs to find bucket names
# ---------------------------------------------------------------------------
try {
    $rawOutputs = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query 'Stacks[0].Outputs' `
        --output json | ConvertFrom-Json
} catch {
    Write-Host "Could not retrieve stack outputs. Stack may already be deleted." -ForegroundColor Yellow
    $rawOutputs = @()
}

# ---------------------------------------------------------------------------
# 2. Empty all S3 buckets (required before CloudFormation can delete them)
# ---------------------------------------------------------------------------
$bucketKeys = @('ResourcesBucket', 'FrontendBucketName')
foreach ($key in $bucketKeys) {
    $bucket = ($rawOutputs | Where-Object { $_.OutputKey -eq $key }).OutputValue
    if ($bucket) {
        Write-Host "  Emptying S3 bucket: $bucket ..." -ForegroundColor Yellow
        # Remove all object versions (versioned bucket)
        $versions = aws s3api list-object-versions `
            --bucket $bucket `
            --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' `
            --output json 2>$null | ConvertFrom-Json
        if ($versions.Objects) {
            $body = $versions | ConvertTo-Json -Depth 10
            aws s3api delete-objects --bucket $bucket --delete $body | Out-Null
        }
        # Remove all delete markers
        $markers = aws s3api list-object-versions `
            --bucket $bucket `
            --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' `
            --output json 2>$null | ConvertFrom-Json
        if ($markers.Objects) {
            $body = $markers | ConvertTo-Json -Depth 10
            aws s3api delete-objects --bucket $bucket --delete $body | Out-Null
        }
        Write-Host "    Bucket $bucket emptied." -ForegroundColor Gray
    }
}

# ---------------------------------------------------------------------------
# 3. Delete the CloudFormation stack
# ---------------------------------------------------------------------------
Write-Host "`n  Deleting CloudFormation stack '$StackName'..." -ForegroundColor Yellow
aws cloudformation delete-stack --stack-name $StackName --region $Region

Write-Host "  Waiting for stack deletion to complete (this may take several minutes)..."
aws cloudformation wait stack-delete-complete --stack-name $StackName --region $Region

# ---------------------------------------------------------------------------
# 4. Clean up any orphaned CloudWatch Log Groups (SAM sometimes leaves these)
# ---------------------------------------------------------------------------
Write-Host "`n  Cleaning up CloudWatch Log Groups..." -ForegroundColor Yellow
$logGroups = @(
    "/aws/lambda/campus-cloud-prod",
    "/aws/lambda/campus-cloud-dev",
    "/aws/lambda/campus-cloud-staging",
    "/aws/apigateway/campus-cloud-prod",
    "/aws/apigateway/campus-cloud-dev"
)
foreach ($lg in $logGroups) {
    aws logs delete-log-group --log-group-name $lg --region $Region 2>$null
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "  All AWS resources have been deleted." -ForegroundColor Green
Write-Host "  You will no longer incur charges for this project." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
