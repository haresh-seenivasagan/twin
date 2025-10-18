#!/bin/bash
# Convert App Router API routes to Pages Router format

for file in pages/api/**/*.ts; do
  if [ -f "$file" ]; then
    echo "Converting $file..."

    # Remove edge runtime export
    sed -i '' '/export const runtime = /d' "$file"

    # Remove extra blank lines from removing runtime
    sed -i '' '/^$/N;/^\n$/d' "$file"

    # Convert NextResponse imports to NextApiRequest/Response
    sed -i '' 's/import { NextRequest, NextResponse } from .next\/server./import type { NextApiRequest, NextApiResponse } from '\''next'\''/g' "$file"
    sed -i '' 's/import { NextResponse } from .next\/server./import type { NextApiRequest, NextApiResponse } from '\''next'\''/g' "$file"

    # Wrap GET handlers
    sed -i '' 's/export async function GET(request: NextRequest) {/export default async function handler(req: NextApiRequest, res: NextApiResponse) {\n  if (req.method !== '\''GET'\'') {\n    return res.status(405).json({ error: '\''Method not allowed'\'' })\n  }\n  const request = req;/g' "$file"

    # Wrap GET handlers without params
    sed -i '' 's/export async function GET() {/export default async function handler(req: NextApiRequest, res: NextApiResponse) {\n  if (req.method !== '\''GET'\'') {\n    return res.status(405).json({ error: '\''Method not allowed'\'' })\n  }/g' "$file"

    # Wrap POST handlers
    sed -i '' 's/export async function POST(request: NextRequest) {/export default async function handler(req: NextApiRequest, res: NextApiResponse) {\n  if (req.method !== '\''POST'\'') {\n    return res.status(405).json({ error: '\''Method not allowed'\'' })\n  }\n  const request = req;/g' "$file"

    # Wrap PUT handlers
    sed -i '' 's/export async function PUT(request: NextRequest) {/export default async function handler(req: NextApiRequest, res: NextApiResponse) {\n  if (req.method !== '\''PUT'\'') {\n    return res.status(405).json({ error: '\''Method not allowed'\'' })\n  }\n  const request = req;/g' "$file"

    # Convert NextResponse.json returns
    sed -i '' 's/return NextResponse\.json(/return res.status(200).json(/g' "$file"

    # Convert NextResponse.redirect
    sed -i '' 's/return NextResponse\.redirect(redirectUrl\.toString())/return res.redirect(307, redirectUrl.toString())/g' "$file"
    sed -i '' 's/return NextResponse\.redirect(\([^)]*\))/return res.redirect(307, \1)/g' "$file"

  fi
done

echo "✅ Conversion complete!"
