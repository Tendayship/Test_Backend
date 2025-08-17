#!/usr/bin/env python3
"""
Test script for the Posts API to diagnose 500 errors
"""
import sys
import os
import asyncio
import requests
import json
from datetime import datetime, timedelta
from jose import jwt

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def test_posts_api():
    """Test the posts API with proper authentication"""
    
    print("=== Posts API Test ===")
    
    # Test 1: Check server health
    print("\n1. Testing server health...")
    try:
        r = requests.get('http://localhost:8000/health')
        print(f"   Health Status: {r.status_code}")
        if r.status_code == 200:
            health_data = r.json()
            print(f"   Database: {health_data.get('database')}")
        else:
            print(f"   Health check failed: {r.text}")
            return
    except Exception as e:
        print(f"   Server not running: {e}")
        return

    # Test 2: Check posts debug endpoint
    print("\n2. Testing posts debug endpoint...")
    try:
        r = requests.get('http://localhost:8000/api/posts/debug/test')
        print(f"   Debug Status: {r.status_code}")
        if r.status_code == 200:
            debug_data = r.json()
            print(f"   Database connection: {debug_data.get('database_connection')}")
            print(f"   Total posts: {debug_data.get('total_posts')}")
            print(f"   Tables found: {debug_data.get('tables_found')}")
        else:
            print(f"   Debug failed: {r.text}")
    except Exception as e:
        print(f"   Debug test failed: {e}")

    # Test 3: Check if we can find an existing user
    print("\n3. Finding existing users...")
    
    # Let's try to check the database directly
    from app.database.session import AsyncSessionLocal
    from sqlalchemy import text
    
    try:
        async with AsyncSessionLocal() as db:
            # Get a user from the database
            result = await db.execute(
                text("SELECT id, email, name FROM users LIMIT 1")
            )
            user_row = result.fetchone()
            
            if user_row:
                user_id = str(user_row[0])
                print(f"   Found user: {user_row[2]} ({user_row[1]})")
                print(f"   User ID: {user_id}")
                
                # Create a JWT token for this user
                print("\n4. Creating JWT token...")
                SECRET_KEY = "c49ba73d741d5079c5f2511db61c18205c4e79ab23e0bc8f2d63b8d06c9008c8"  # Using real key from .env
                
                token_data = {
                    "sub": user_id,
                    "exp": datetime.utcnow() + timedelta(hours=1)
                }
                
                jwt_token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
                print(f"   Token created: {jwt_token[:50]}...")
                
                # Test 4: Test POST with authentication
                print("\n5. Testing POST with authentication...")
                
                headers = {
                    'Authorization': f'Bearer {jwt_token}',
                    'Content-Type': 'application/json'
                }
                
                post_data = {
                    'content': 'This is a test post content that meets the validation requirements. It has enough characters to pass validation.',
                    'image_urls': []
                }
                
                print(f"   Request data: {json.dumps(post_data, indent=2)}")
                
                try:
                    r = requests.post(
                        'http://localhost:8000/api/posts',
                        json=post_data,
                        headers=headers,
                        timeout=30
                    )
                    
                    print(f"   POST Status: {r.status_code}")
                    print(f"   Response Headers: {dict(r.headers)}")
                    
                    if r.status_code == 200 or r.status_code == 201:
                        response_data = r.json()
                        print(f"   Success! Post created with ID: {response_data.get('id')}")
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                    else:
                        print(f"   Error Response: {r.text}")
                        
                        # Try to parse as JSON for better formatting
                        try:
                            error_data = r.json()
                            print(f"   Formatted Error: {json.dumps(error_data, indent=2)}")
                        except:
                            pass
                            
                except requests.exceptions.Timeout:
                    print("   Request timed out after 30 seconds")
                except Exception as e:
                    print(f"   Request failed: {e}")
                
                # Test 5: Test with different content lengths
                print("\n6. Testing content length validation...")
                
                test_cases = [
                    {"content": "Short", "image_urls": []},  # Too short
                    {"content": "A" * 5000, "image_urls": []},  # Too long
                    {"content": "Perfect length content for testing validation", "image_urls": []}  # Just right
                ]
                
                for i, test_data in enumerate(test_cases):
                    print(f"   Test case {i+1}: {len(test_data['content'])} characters")
                    try:
                        r = requests.post(
                            'http://localhost:8000/api/posts',
                            json=test_data,
                            headers=headers,
                            timeout=10
                        )
                        print(f"     Status: {r.status_code}")
                        if r.status_code != 200 and r.status_code != 201:
                            try:
                                error = r.json()
                                print(f"     Error: {error.get('detail')}")
                            except:
                                print(f"     Error: {r.text[:100]}")
                    except Exception as e:
                        print(f"     Failed: {e}")
                
            else:
                print("   No users found in database")
                
    except Exception as e:
        print(f"   Database connection failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_posts_api())