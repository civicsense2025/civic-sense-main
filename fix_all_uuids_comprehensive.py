#!/usr/bin/env python3

"""
Comprehensive script to remove ALL UUIDs from next-questions.sql
Uses multiple approaches to ensure we catch every possible UUID pattern
"""

import re
import os

def fix_all_uuids():
    """Remove ALL UUIDs from the next-questions.sql file"""
    
    file_path = 'apps/mobile/supabase/migrations/next-questions.sql'
    
    print(f"🔧 Comprehensively removing ALL UUIDs from {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = 0
    
    # Split into lines for easier debugging
    lines = content.split('\n')
    modified_lines = []
    
    for line_num, line in enumerate(lines, 1):
        original_line = line
        
        # Look for lines that contain VALUES with UUIDs
        if 'VALUES' in line or line.strip().startswith('('):
            # Find ALL UUID patterns and count them
            uuid_matches = re.findall(r"'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'", line, re.IGNORECASE)
            
            if uuid_matches:
                print(f"Line {line_num}: Found {len(uuid_matches)} UUIDs: {uuid_matches}")
                
                # Remove ALL UUIDs from the line
                # This pattern removes 'uuid', followed by comma and optional space
                modified_line = re.sub(r"'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}',\s*", '', line, flags=re.IGNORECASE)
                
                if modified_line != original_line:
                    changes += len(uuid_matches)
                    print(f"  ✅ Removed {len(uuid_matches)} UUIDs from line")
                    line = modified_line
                else:
                    print(f"  ⚠️ Pattern didn't match, trying alternative approach")
                    
                    # Alternative approach: remove anything that looks like a UUID parameter
                    # Look for patterns like ('uuid', 'topic_id', ...)
                    alternative_pattern = r"\('([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',\s*"
                    alternative_modified = re.sub(alternative_pattern, "('", line, flags=re.IGNORECASE)
                    
                    if alternative_modified != original_line:
                        changes += len(uuid_matches)
                        print(f"  ✅ Alternative pattern worked - removed {len(uuid_matches)} UUIDs")
                        line = alternative_modified
                    else:
                        print(f"  ❌ Could not remove UUIDs from this line")
                        print(f"      Original: {original_line[:100]}...")
        
        modified_lines.append(line)
    
    # Join lines back together
    final_content = '\n'.join(modified_lines)
    
    # Double-check: count remaining UUIDs
    remaining_uuids = re.findall(r"'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'", final_content, re.IGNORECASE)
    
    print(f"\n📊 Summary:")
    print(f"   Changes made: {changes}")
    print(f"   Remaining UUIDs: {len(remaining_uuids)}")
    
    if remaining_uuids:
        print(f"   ⚠️ Remaining UUIDs found:")
        for i, uuid in enumerate(remaining_uuids[:5]):  # Show first 5
            print(f"     {i+1}. {uuid}")
        if len(remaining_uuids) > 5:
            print(f"     ... and {len(remaining_uuids) - 5} more")
    
    # Write the modified content back
    if changes > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(final_content)
        print(f"\n✅ File updated with {changes} UUIDs removed")
    else:
        print(f"\n⚠️ No changes made")
    
    return changes

if __name__ == "__main__":
    fix_all_uuids() 