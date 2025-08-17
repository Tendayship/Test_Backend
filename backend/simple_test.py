#!/usr/bin/env python3
import requests
import json
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = 'c49ba73d741d5079c5f2511db61c18205c4e79ab23e0bc8f2d63b8d06c9008c8'
user_id = '3934fe77-9ceb-4348-b201-4d29a2f3bcec'

# Create token
token_data = {
    'sub': user_id,
    'exp': datetime.utcnow() + timedelta(hours=1)
}
jwt_token = jwt.encode(token_data, SECRET_KEY, algorithm='HS256')

print('Testing with proper auth...')
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json'
}

post_data = {
    'content': 'This is a test post with proper length for validation testing.',
    'image_urls': []
}

print('Testing GET first...')
r = requests.get('http://localhost:8000/api/posts', headers=headers)
print(f'GET Status: {r.status_code}')
if r.status_code != 200:
    print(f'GET Error: {r.text}')

print('Testing POST...')
r = requests.post('http://localhost:8000/api/posts/', json=post_data, headers=headers)
print(f'POST Status: {r.status_code}')
print(f'POST Response: {r.text}')