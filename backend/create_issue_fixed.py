#!/usr/bin/env python3
"""
Create a test issue/session for the user's group to enable post creation
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta, date
from uuid import uuid4

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

async def create_issue_for_group():
    """Create a test issue for the user's group"""
    
    print("=== Creating Issue for Group ===")
    
    try:
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import text
        
        group_id = "f8c1a7a3-07f1-4ce0-980f-602d16967e78"  # From the logs
        
        async with AsyncSessionLocal() as db:
            # Check if there's already an OPEN issue for this group
            print("\n1. Checking existing issues for group...")
            existing_issue_result = await db.execute(
                text("""
                    SELECT id, issue_number, status, deadline_date 
                    FROM issues 
                    WHERE group_id = :group_id AND status = 'OPEN'
                    ORDER BY created_at DESC 
                    LIMIT 1
                """),
                {"group_id": group_id}
            )
            existing_issue = existing_issue_result.fetchone()
            
            if existing_issue:
                print(f"   Found existing OPEN issue: {existing_issue[1]} (deadline: {existing_issue[3]})")
                print("   No need to create new issue")
                return
            
            # Get the next issue number for this group
            print("\n2. Creating new OPEN issue...")
            
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
            deadline_date = date.today() + timedelta(days=30)
            
            new_issue_id = str(uuid4())
            
            await db.execute(
                text("""
                    INSERT INTO issues (id, group_id, issue_number, status, deadline_date, created_at, updated_at)
                    VALUES (:id, :group_id, :issue_number, 'OPEN', :deadline_date, NOW(), NOW())
                """),
                {
                    "id": new_issue_id,
                    "group_id": group_id,
                    "issue_number": next_issue_number,
                    "deadline_date": deadline_date
                }
            )
            
            await db.commit()
            
            print(f"   Created new issue: {next_issue_number}")
            print(f"   Issue ID: {new_issue_id}")
            print(f"   Deadline: {deadline_date}")
            print("   Status: OPEN")
            
            print("\n✅ Issue created successfully!")
            print("   Users can now create posts in this group.")
            
    except Exception as e:
        print(f"Error creating issue: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_issue_for_group())