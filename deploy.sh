#!/bin/bash
set -e

BUCKET="paa-frontend"
DISTRIBUTION_ID="E2FI8ZA6LZJ0HW"
PROFILE="gromulax"

echo "Building app..."
npm run build

echo "Syncing to S3..."
aws s3 sync dist/ s3://$BUCKET --delete --profile $PROFILE

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile $PROFILE \
  --no-cli-pager

echo "Deploy complete!"