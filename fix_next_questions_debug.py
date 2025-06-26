#!/usr/bin/env python3
"""
Debug script to find and fix UUIDs in next-questions.sql
"""

import re

def debug_and_fix():
    """Debug and fix the UUIDs in next-questions.sql"""
    
    file_path = 'apps/mobile/supabase/migrations/next-questions.sql'
    
    print(f"🔍 Debugging and fixing UUIDs in {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Look for all lines that start with ( and contain what looks like UUIDs
    lines = content.split('\n')
    uuid_lines = []
    
    for i, line in enumerate(lines, 1):
        # Look for lines that contain UUID-like patterns
        if re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', line, re.IGNORECASE):
            uuid_lines.append((i, line.strip()))
    
    print(f"  Found {len(uuid_lines)} lines with UUID patterns")
    
    if uuid_lines:
        print("  📋 First 5 lines with UUIDs:")
        for line_num, line in uuid_lines[:5]:
            print(f"    Line {line_num}: {line[:100]}...")
    
    # Now let's try multiple replacement patterns
    original_content = content
    changes_made = 0
    
    # Pattern 1: Standard UUID format with quotes and comma
    pattern1 = r"\('([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',\s*'"
    matches1 = re.findall(pattern1, content, re.IGNORECASE)
    if matches1:
        print(f"  Pattern 1 found {len(matches1)} matches")
        content = re.sub(pattern1, "('", content, flags=re.IGNORECASE)
        changes_made += len(matches1)
    
    # Pattern 2: UUID without quotes after
    pattern2 = r"\('([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',\s*"
    matches2 = re.findall(pattern2, content, re.IGNORECASE)
    if matches2:
        print(f"  Pattern 2 found {len(matches2)} matches")
        content = re.sub(pattern2, "('", content, flags=re.IGNORECASE)
        changes_made += len(matches2)
    
    # Pattern 3: More flexible - any UUID-like pattern at start of VALUES
    pattern3 = r"\('([a-f0-9-]{30,40})',\s*'"
    matches3 = re.findall(pattern3, content, re.IGNORECASE)
    if matches3:
        print(f"  Pattern 3 found {len(matches3)} matches")
        # Only replace if it looks like a UUID (has dashes and right length)
        for match in matches3:
            if len(match.replace('-', '')) == 32 and '-' in match:
                content = content.replace(f"('{match}', '", "('", 1)
                changes_made += 1
    
    # Try a simple string replacement approach for known UUIDs
    known_uuids = [
        'b2c3d4e5-f6g7-4890-9bcd-ef0123456789',
        'c3d4e5f6-g7h8-4901-9cde-f01234567890',
        'd4e5f6g7-h8i9-4012-9def-012345678901',
        'e5f6g7h8-i9j0-4123-9efg-123456789012',
        'f6g7h8i9-j0k1-4234-9fgh-234567890123'
    ]
    
    for uuid in known_uuids:
        if uuid in content:
            print(f"  Found known UUID: {uuid}")
            content = content.replace(f"('{uuid}', ", "(", 1)
            changes_made += 1
    
    # Write back if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Made {changes_made} total changes")
        
        # Verify the changes
        lines_after = content.split('\n')
        uuid_lines_after = []
        for i, line in enumerate(lines_after, 1):
            if re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', line, re.IGNORECASE):
                uuid_lines_after.append((i, line.strip()))
        
        print(f"  📊 UUIDs remaining: {len(uuid_lines_after)} (started with {len(uuid_lines)})")
        
    else:
        print("  ℹ️  No changes made")
    
    return changes_made

if __name__ == "__main__":
    print("🐛 Debug UUID fix for next-questions.sql")
    print()
    
    total_changes = debug_and_fix()
    
    print()
    print("=" * 60)
    if total_changes > 0:
        print(f"✅ SUCCESS: Made {total_changes} changes to remove UUIDs")
        print("🎯 Check the file to verify all UUIDs are removed!")
    else:
        print("❌ No changes made - need to investigate further") 