#!/usr/bin/env python3
"""
Direct script to fix the remaining UUIDs in next-questions.sql
"""

import re

def fix_next_questions():
    """Fix the specific patterns in apps/mobile/supabase/migrations/next-questions.sql"""
    
    file_path = 'apps/mobile/supabase/migrations/next-questions.sql'
    
    print(f"🔧 Fixing UUIDs in {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Keep track of changes
    original_content = content
    changes = 0
    
    # Pattern 1: Find all instances like ('uuid-here', 'topic_id', ...)
    # and replace with ('topic_id', ...)
    
    # This regex finds ('any-uuid-pattern', and replaces it with ('
    uuid_pattern = r"\('([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',\s*"
    
    # Find all matches first to count them
    matches = re.findall(uuid_pattern, content, re.IGNORECASE)
    print(f"  Found {len(matches)} UUID patterns to remove")
    
    # Replace them all
    if matches:
        content = re.sub(uuid_pattern, "(", content, flags=re.IGNORECASE)
        changes = len(matches)
        print(f"  ✅ Removed {changes} UUIDs")
    
    # Write back if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  💾 File updated with {changes} changes")
        
        # Show a few examples of what we fixed
        print("\n  📋 Examples of UUIDs removed:")
        for i, uuid in enumerate(matches[:5]):  # Show first 5
            print(f"    - {uuid}")
        if len(matches) > 5:
            print(f"    ... and {len(matches) - 5} more")
            
    else:
        print("  ℹ️  No changes needed")
    
    return changes

if __name__ == "__main__":
    print("🚀 Direct UUID fix for next-questions.sql")
    print()
    
    total_changes = fix_next_questions()
    
    print()
    print("=" * 50)
    if total_changes > 0:
        print(f"✅ SUCCESS: Removed {total_changes} UUIDs from next-questions.sql")
        print("🎯 The file should now be ready for Supabase migration!")
    else:
        print("ℹ️  No UUIDs found to remove") 