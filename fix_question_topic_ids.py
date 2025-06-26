#!/usr/bin/env python3
"""
Script to remove UUIDs from question SQL INSERT statements.

This script processes SQL files containing question data and removes:
1. The "id" column from the INSERT column list
2. ALL UUID values from each VALUES row (including complex UUID patterns)

Since Supabase auto-generates UUIDs for primary keys.

Pattern to fix:
FROM: INSERT INTO "public"."questions" ("id","topic_id", ...)
      VALUES ('uuid-here', 'topic-id', ...)
TO:   INSERT INTO "public"."questions" ("topic_id", ...)
      VALUES ('topic-id', ...)

Also handles complex UUID patterns like:
FROM: ('f6g7h8i9-j0k1-4234-9fgh-234567890131', 'topic_id', ...)
TO:   ('topic_id', ...)
"""

import re
import os
import glob

def fix_sql_file(file_path):
    """Fix a single SQL file by removing id column and ALL UUID values."""
    print(f"Processing: {file_path}")
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if file is empty
        if not content.strip():
            print(f"  Skipping empty file: {file_path}")
            return 0
        
        original_content = content
        modification_count = 0
        
        # 1. Remove "id" column from INSERT statements
        insert_pattern = r'INSERT INTO\s+"public"\."questions"\s*\(\s*"id"\s*,\s*'
        if re.search(insert_pattern, content, re.IGNORECASE):
            content = re.sub(insert_pattern, 'INSERT INTO "public"."questions" (', content, flags=re.IGNORECASE)
            modification_count += 1
            print(f"  Removed 'id' column from INSERT statement")
        
        # 2. Remove UUID values from VALUES clauses - Multiple patterns
        
        # Pattern 1: Standard UUID format with hyphens at start of VALUES
        # ('f6g7h8i9-j0k1-4234-9fgh-234567890131', 'topic_id', ...)
        uuid_pattern1 = r"\('([a-f0-9]{8}-[a-f0-9]{4}-[0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})',\s*'"
        matches1 = re.findall(uuid_pattern1, content, re.IGNORECASE)
        if matches1:
            content = re.sub(uuid_pattern1, "('", content, flags=re.IGNORECASE)
            modification_count += len(matches1)
            print(f"  Removed {len(matches1)} UUIDs (pattern 1: standard UUID format)")
        
        # Pattern 2: Compact UUID format without hyphens
        # ('a1b2c3d4e5f6478990abcdef12345679', 'topic_id', ...)
        uuid_pattern2 = r"\('([a-f0-9]{32})',\s*'"
        matches2 = re.findall(uuid_pattern2, content, re.IGNORECASE)
        if matches2:
            content = re.sub(uuid_pattern2, "('", content, flags=re.IGNORECASE)
            modification_count += len(matches2)
            print(f"  Removed {len(matches2)} UUIDs (pattern 2: compact format)")
        
        # Pattern 3: Mixed case and other UUID-like patterns
        # Look for any 32+ character alphanumeric string that looks like a UUID
        uuid_pattern3 = r"\('([a-f0-9A-F]{8,}-[a-f0-9A-F]{4,}-[a-f0-9A-F]{4,}-[a-f0-9A-F]{4,}-[a-f0-9A-F]{12,})',\s*'"
        matches3 = re.findall(uuid_pattern3, content, re.IGNORECASE)
        if matches3:
            content = re.sub(uuid_pattern3, "('", content, flags=re.IGNORECASE)
            modification_count += len(matches3)
            print(f"  Removed {len(matches3)} UUIDs (pattern 3: mixed case)")
        
        # Pattern 4: Handle gen_random_uuid() function calls
        gen_uuid_pattern = r"\(gen_random_uuid\(\),\s*'"
        matches4 = re.findall(gen_uuid_pattern, content, re.IGNORECASE)
        if matches4:
            content = re.sub(gen_uuid_pattern, "('", content, flags=re.IGNORECASE)
            modification_count += len(matches4)
            print(f"  Removed {len(matches4)} gen_random_uuid() calls")
        
        # Pattern 5: Catch any remaining suspicious patterns - very long alphanumeric strings
        # that might be UUIDs in unusual formats
        suspicious_pattern = r"\('([a-f0-9A-F-]{25,})',\s*'"
        matches5 = re.findall(suspicious_pattern, content, re.IGNORECASE)
        if matches5:
            # Only replace if it looks like a UUID (contains hyphens or is very long)
            for match in matches5:
                if '-' in match or len(match.replace('-', '')) >= 32:
                    content = content.replace(f"('{match}', ", "('", 1)
                    modification_count += 1
            print(f"  Removed {len([m for m in matches5 if '-' in m or len(m.replace('-', '')) >= 32])} suspicious UUID-like patterns")
        
        # Write back only if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Made {modification_count} modifications")
        else:
            print(f"  ℹ️  No modifications needed")
        
        return modification_count
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to process all SQL files."""
    print("🔧 Fixing SQL files by removing UUID values from question INSERT statements...")
    print()
    
    # Find all SQL files with "questions" in the name
    sql_files = []
    
    # Look in current directory and subdirectories
    for pattern in ['*questions*.sql', '**/questions*.sql', '**/*questions*.sql']:
        sql_files.extend(glob.glob(pattern, recursive=True))
    
    # Remove duplicates and sort
    sql_files = sorted(list(set(sql_files)))
    
    if not sql_files:
        print("❌ No SQL files with 'questions' in the name found!")
        return
    
    print(f"📁 Found {len(sql_files)} SQL files to process:")
    for f in sql_files:
        print(f"   - {f}")
    print()
    
    total_modifications = 0
    
    for sql_file in sql_files:
        modifications = fix_sql_file(sql_file)
        total_modifications += modifications
        print()
    
    print("=" * 60)
    print(f"✅ COMPLETE: Made {total_modifications} total modifications across {len(sql_files)} files")
    print("🎯 All UUID values should now be removed from question INSERT statements")

if __name__ == "__main__":
    main() 