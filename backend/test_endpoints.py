#!/usr/bin/env python3
"""
500 오류 진단 스크립트
백엔드 서버가 실행 중인 상태에서 이 스크립트를 실행하세요.
"""

import requests
import json
import sys

def test_endpoint(url, method="GET", headers=None, description=""):
    """엔드포인트 테스트"""
    print(f"\n{'='*50}")
    print(f"테스트: {description}")
    print(f"URL: {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, timeout=10)
        
        print(f"상태 코드: {response.status_code}")
        
        try:
            data = response.json()
            print(f"응답 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except:
            print(f"응답 텍스트: {response.text[:500]}")
            
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print("❌ 연결 실패: 백엔드 서버가 실행 중인지 확인하세요")
        return False
    except requests.exceptions.Timeout:
        print("❌ 타임아웃: 서버 응답이 너무 느립니다")
        return False
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return False

def main():
    base_url = "http://localhost:8000"
    
    print("🔍 백엔드 500 오류 진단 시작")
    print("=" * 50)
    
    # 테스트 목록
    tests = [
        (f"{base_url}/", "GET", None, "기본 루트 엔드포인트"),
        (f"{base_url}/health", "GET", None, "헬스체크"),
        (f"{base_url}/api/test/simple", "POST", None, "인증 없는 단순 테스트"),
        (f"{base_url}/debug/database", "GET", None, "데이터베이스 상태"),
        (f"{base_url}/api/posts/debug/test", "GET", None, "포스트 시스템 테스트 (인증 없음)"),
        (f"{base_url}/api/posts/", "GET", None, "포스트 목록 (인증 필요 - 401 예상)"),
    ]
    
    results = []
    
    for url, method, headers, description in tests:
        success = test_endpoint(url, method, headers, description)
        results.append((description, success))
    
    # 결과 요약
    print(f"\n{'='*50}")
    print("🏁 테스트 결과 요약")
    print("=" * 50)
    
    for description, success in results:
        status = "✅ 성공" if success else "❌ 실패"
        print(f"{status} - {description}")
    
    # 진단 결과
    print(f"\n{'='*50}")
    print("🔍 진단 결과")
    print("=" * 50)
    
    if not results[0][1]:  # 기본 루트 실패
        print("❌ 백엔드 서버가 실행되지 않았거나 포트 8000에 연결할 수 없습니다.")
        print("해결책: 백엔드 서버를 시작하세요: python -m uvicorn app.main:app --reload")
    
    elif not results[1][1]:  # 헬스체크 실패  
        print("❌ 서버는 실행 중이지만 헬스체크에 실패했습니다.")
        print("해결책: 데이터베이스 연결을 확인하세요.")
    
    elif not results[3][1]:  # 데이터베이스 테스트 실패
        print("❌ 데이터베이스 연결에 문제가 있습니다.")
        print("해결책: PostgreSQL이 실행 중인지 확인하고 마이그레이션을 실행하세요.")
    
    elif not results[4][1]:  # 포스트 시스템 테스트 실패
        print("❌ 포스트 시스템에 문제가 있습니다.")
        print("해결책: 데이터베이스 스키마나 모델 정의를 확인하세요.")
    
    elif results[5][1]:  # 인증 필요한 엔드포인트가 성공 (이상함)
        print("⚠️  인증이 필요한 엔드포인트가 인증 없이 성공했습니다. 이는 비정상입니다.")
    
    else:
        print("✅ 기본 시스템은 정상 작동합니다.")
        print("💡 500 오류는 인증 토큰 문제일 가능성이 높습니다.")
        print("해결책: 프론트엔드에서 올바른 JWT 토큰을 전송하는지 확인하세요.")

if __name__ == "__main__":
    main()