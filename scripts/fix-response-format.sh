#!/bin/bash
# Fix incorrect Pages Router response format

for file in pages/api/**/*.ts; do
  if [ -f "$file" ]; then
    echo "Checking $file..."

    # Fix pattern: res.status(200).json({ ... }, { status: XXX })
    # Replace with: res.status(XXX).json({ ... })

    # This is complex, so let's use perl for multi-line substitutions
    perl -i -0pe '
      # Pattern 1: res.status(200).json(\n  { error: ... },\n  { status: XXX }\n)
      s/res\.status\(200\)\.json\(\s*\{\s*error:\s*([^\}]+)\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\)/res.status($2).json({ error: $1})/g;

      # Pattern 2: More generic - res.status(200).json(anything, { status: XXX })
      s/return\s+res\.status\(200\)\.json\(\s*(\{[^}]+\})\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\)/return res.status($2).json($1)/g;
    ' "$file"

  fi
done

echo "✅ Response format fixed!"
