#!/usr/bin/env python3
"""
Check the actual database table structure
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

async def check_table_structure():
    """Check the actual database table structure"""
    
    print("=== Checking Table Structure ===")
    
    try:
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import text
        
        async with AsyncSessionLocal() as db:
            # Check issues table structure
            print("\n1. Issues table structure:")
            issues_columns_result = await db.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'issues' AND table_schema = 'public'
                ORDER BY ordinal_position
            """))
            issues_columns = issues_columns_result.fetchall()
            
            print("   Columns:")
            for col in issues_columns:
                print(f"   - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
            
            # Check existing issues
            print("\n2. Existing issues:")
            existing_issues_result = await db.execute(text("""
                SELECT id, issue_number, status, created_at 
                FROM issues 
                LIMIT 5
            """))
            existing_issues = existing_issues_result.fetchall()
            
            print(f"   Found {len(existing_issues)} issues:")
            for issue in existing_issues:
                print(f"   - Issue {issue[1]}: {issue[2]} (created: {issue[3]})")
            
            # Check specific group
            group_id = "f8c1a7a3-07f1-4ce0-980f-602d16967e78"
            print(f"\n3. Issues for group {group_id}:")
            group_issues_result = await db.execute(text("""
                SELECT id, issue_number, status, created_at 
                FROM issues 
                WHERE group_id = :group_id
                ORDER BY created_at DESC
            """), {"group_id": group_id})
            group_issues = group_issues_result.fetchall()
            
            print(f"   Found {len(group_issues)} issues for this group:")
            for issue in group_issues:
                print(f"   - Issue {issue[1]}: {issue[2]} (created: {issue[3]})")
            
    except Exception as e:
        print(f"Error checking table structure: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_table_structure())