#!/usr/bin/env bash
# deploy.sh - Linux/macOS bash deployment script for Smart Campus Resource Management System
set -euo pipefail

ENVIRONMENT="${1:-prod}"
REGION="${2:-ap-south-1}"
STACK_NAME="${3:-campus-cloud-stack}"

echo "============================================================"
echo "  Smart Campus Resource Management System - Deployment"
echo "============================================================"
echo "  Environment : $ENVIRONMENT"
echo "  Region      : $REGION"
echo "  Stack Name  : $STACK_NAME"
echo "============================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INFRA_DIR="$PROJECT_ROOT/infrastructure"

# 0. Pre-flight checks
echo ""
echo "[0/5] Running pre-flight checks..."
for tool in aws sam node npm; do
  command -v "$tool" >/dev/null 2>&1 || { echo "ERROR: '$tool' not found. Please install it."; exit 1; }
done
aws sts get-caller-identity --query 'Account' --output text || { echo "ERROR: AWS credentials not configured."; exit 1; }
echo "  Pre-flight checks passed."

# 1. Build frontend
echo ""
echo "[1/5] Building frontend..."
cd "$FRONTEND_DIR"
npm ci --silent
npm run build
echo "  Frontend build complete."

# 2. SAM build
echo ""
echo "[2/5] Building SAM application..."
cd "$INFRA_DIR"
sam build --cached --parallel
echo "  SAM build complete."

# 3. SAM deploy
echo ""
echo "[3/5] Deploying infrastructure to AWS ($REGION)..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --parameter-overrides Environment="$ENVIRONMENT" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --resolve-s3 \
  --no-fail-on-empty-changeset
echo "  Infrastructure deployed."

# 4. Retrieve outputs
echo ""
echo "[4/5] Retrieving deployment outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output json)

API_URL=$(echo "$OUTPUTS"        | python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='ApiGatewayUrl'))")
FRONTEND_URL=$(echo "$OUTPUTS"   | python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='CloudFrontUrl'))")
FRONTEND_BUCKET=$(echo "$OUTPUTS"| python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='FrontendBucketName'))")
CF_DIST_ID=$(echo "$OUTPUTS"     | python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='CloudFrontDistributionId'))")
USER_POOL_ID=$(echo "$OUTPUTS"   | python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='UserPoolId'))")
CLIENT_ID=$(echo "$OUTPUTS"      | python3 -c "import sys,json;o=json.load(sys.stdin);print(next(x['OutputValue'] for x in o if x['OutputKey']=='UserPoolClientId'))")

echo "  API URL         : $API_URL"
echo "  Frontend URL    : $FRONTEND_URL"
echo "  Frontend Bucket : $FRONTEND_BUCKET"
echo "  CloudFront ID   : $CF_DIST_ID"

# 5. Re-build frontend with live API and push to S3
echo ""
echo "[5/5] Re-building frontend with live API endpoint and deploying to S3..."
cd "$FRONTEND_DIR"

cat > .env.production <<EOF
VITE_API_URL=$API_URL
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
VITE_APP_NAME=Smart Campus Resource Management System
VITE_ENVIRONMENT=$ENVIRONMENT
EOF

npm run build
aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" --delete --region "$REGION"

if [ -n "$CF_DIST_ID" ]; then
  echo "  Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" > /dev/null
fi

echo ""
echo "============================================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================================"
echo "  Application URL : $FRONTEND_URL"
echo "  API Endpoint    : $API_URL"
echo "============================================================"
echo "  NOTE: CloudFront propagation may take 2-5 minutes."
