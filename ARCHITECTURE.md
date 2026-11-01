# Cloud-Based Smart Campus Resource Management System
## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js AWS Lambda (via AWS SAM)
- **Database**: Amazon DynamoDB
- **Auth**: Amazon Cognito
- **Storage**: Amazon S3
- **API**: Amazon API Gateway (REST)
- **CDN**: Amazon CloudFront
- **Monitoring**: Amazon CloudWatch
- **IaC**: AWS SAM (template.yaml)

### DynamoDB Tables
1. **Users** (PK: userId) - Cognito synced
2. **Resources** (PK: resourceId, GSI: uploaderIndex, categoryIndex)
3. **SharedLinks** (PK: linkId, TTL: expiresAt)

### API Endpoints
- POST /auth/register
- POST /auth/login
- GET /resources
- POST /resources
- GET /resources/{id}
- PUT /resources/{id}
- DELETE /resources/{id}
- POST /resources/{id}/share
- GET /resources/search?q=&category=&subject=
- GET /users/me/resources
- GET /admin/users
- GET /admin/resources
- DELETE /admin/resources/{id}
- GET /admin/stats
