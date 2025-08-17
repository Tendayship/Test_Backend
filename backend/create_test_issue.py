#!/usr/bin/env python3
"""
Create a test issue/session for the user's group to enable post creation
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

async def create_test_issue():
    """Create a test issue for the user's group"""
    
    print("=== Creating Test Issue ===")
    
    try:
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import text
        
        group_id = "f8c1a7a3-07f1-4ce0-980f-602d16967e78"  # From the logs
        
        async with AsyncSessionLocal() as db:
            # Check current issues for this group
            print("\n1. Checking existing issues...")
            issues_result = await db.execute(
                text("""
                    SELECT id, issue_number, status, deadline, created_at 
                    FROM issues 
                    WHERE group_id = :group_id 
                    ORDER BY created_at DESC
                """),
                {"group_id": group_id}
            )
            issues = issues_result.fetchall()
            
            print(f"   Found {len(issues)} existing issues:")
            for issue in issues:
                print(f"   - Issue {issue[1]}: {issue[2]} (deadline: {issue[3]})")
            
            # Check if there's a current active issue
            current_issue_result = await db.execute(
                text("""
                    SELECT id, issue_number, status, deadline 
                    FROM issues 
                    WHERE group_id = :group_id AND status = 'ACTIVE'
                    ORDER BY created_at DESC 
                    LIMIT 1
                """),
                {"group_id": group_id}
            )
            current_issue = current_issue_result.fetchone()
            
            if current_issue:
                print(f"\n   Active issue found: {current_issue[1]} (deadline: {current_issue[3]})")
                print("   No need to create new issue")
                return
            
            # Create a new active issue
            print("\n2. Creating new active issue...")
            
            # Find the next issue number
            max_issue_result = await db.execute(
                text("""
                    SELECT COALESCE(MAX(issue_number), 0) 
                    FROM issues 
                    WHERE group_id = :group_id
                """),
                {"group_id": group_id}
            )
            max_issue_number = max_issue_result.scalar() or 0
            next_issue_number = max_issue_number + 1
            
            # Set deadline to next month
            deadline = datetime.now() + timedelta(days=30)
            
            new_issue_id = str(uuid4())
            
            await db.execute(
                text("""
                    INSERT INTO issues (id, group_id, issue_number, status, deadline, created_at, updated_at)
                    VALUES (:id, :group_id, :issue_number, 'ACTIVE', :deadline, NOW(), NOW())
                """),
                {
                    "id": new_issue_id,
                    "group_id": group_id,
                    "issue_number": next_issue_number,
                    "deadline": deadline
                }
            )
            
            await db.commit()
            
            print(f"   Created new issue: {next_issue_number}")
            print(f"   Issue ID: {new_issue_id}")
            print(f"   Deadline: {deadline}")
            print("   Status: ACTIVE")
            
            print("\n✅ Test issue created successfully!")
            print("   Users can now create posts in this group.")
            
    except Exception as e:
        print(f"❌ Error creating test issue: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_test_issue())