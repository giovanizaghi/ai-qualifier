#!/bin/bash

echo "🧪 Testing Companies API endpoint..."

# Test the companies API directly
echo "📡 Making request to companies API..."

curl -s -X GET "http://localhost:3001/api/companies" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN_HERE" \
  | jq .

echo ""
echo "ℹ️  Note: You need to replace YOUR_SESSION_TOKEN_HERE with actual session token from browser dev tools"
echo "ℹ️  Or test this directly in the browser console:"
echo ""
echo "fetch('/api/companies').then(r => r.json()).then(console.log)"