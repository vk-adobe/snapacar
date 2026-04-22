#!/bin/bash
# Deploys the analyze-car-image Supabase Edge Function.
#
# Usage:
#   ./scripts/deploy-edge-functions.sh <YOUR_ACCESS_TOKEN>
#
# Get your access token from:
#   https://supabase.com/dashboard/account/tokens  →  Generate new token
#
# The token starts with "sbp_..." — it is your PERSONAL account token,
# NOT the project service_role or anon key.

set -e

ACCESS_TOKEN="${1:-$SUPABASE_ACCESS_TOKEN}"
PROJECT_REF="szsywpezqsekbrvxsrxk"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌  No access token provided."
  echo ""
  echo "1. Go to: https://supabase.com/dashboard/account/tokens"
  echo "2. Click 'Generate new token', copy it (starts with sbp_...)"
  echo "3. Run:"
  echo "   ./scripts/deploy-edge-functions.sh sbp_YOUR_TOKEN_HERE"
  exit 1
fi

echo "🚀  Deploying analyze-car-image edge function..."

SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN" npx supabase functions deploy analyze-car-image \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

echo ""
echo "✅  Edge function deployed."
echo ""
echo "Next: Set the GOOGLE_CLOUD_API_KEY secret in Supabase:"
echo "  Supabase Dashboard → Edge Functions → analyze-car-image → Secrets"
echo "  Add:  GOOGLE_CLOUD_API_KEY = <your Google Cloud Vision API key>"
echo ""
echo "Without the key, OCR returns no results but the app still works."
