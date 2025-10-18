#!/usr/bin/env python3
"""Fix Pages Router API response format issues"""

import re
import glob

# Pattern to match return statements with wrong format:
# return res.status(200).json(
#   { error: '...' },
#   { status: XXX }
# )

pattern = re.compile(
    r'return\s+res\.status\(200\)\.json\(\s*(\{[^}]+\})\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\)',
    re.MULTILINE | re.DOTALL
)

def fix_file(filepath):
    """Fix response format in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Replace pattern with correct format
    content = pattern.sub(r'return res.status(\2).json(\1)', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f'  Fixed: {filepath}')
        return True
    return False

# Process all API route files
print('Fixing API response formats...')
files = glob.glob('pages/api/**/*.ts', recursive=True)
fixed_count = 0

for filepath in files:
    if fix_file(filepath):
        fixed_count += 1

print(f'\n✨ Fixed {fixed_count} files!')
