from fastapi import FastAPI, HTTPException, File, UploadFile, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from datetime import datetime
from typing import List
import aiofiles
import os
import uuid
import traceback

from .core.config import settings
from .core.exceptions import (
    FamilyNewsException,
    family_news_exception_handler,
    validation_exception_handler,
    http_exception_handler
)
from .api.middleware import LoggingMiddleware, SecurityHeadersMiddleware
from .api.dependencies import get_current_user
from .models.user import User
from .database.session import init_db

from .api.routes import (
    auth,
    family,
    members,
    posts,
    issues,
    books,
    subscription,
    profile,
    admin
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME if hasattr(settings, 'APP_NAME') else "Family News Service",
    version=settings.APP_VERSION if hasattr(settings, 'APP_VERSION') else "1.0.0",
    debug=getattr(settings, 'DEBUG', True),
    description="가족 소식 서비스 - 가족의 소식을 책자로 만들어 전달하는 서비스",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS 미들웨어를 가장 먼저 추가 (중요!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# TrustedHost 미들웨어 (필요한 경우에만)
if hasattr(settings, 'ALLOWED_HOSTS') and settings.ALLOWED_HOSTS != ["*"]:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# 다른 미들웨어들은 CORS 이후에 추가
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# 전역 예외 핸들러 - CORS 헤더 포함
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"전역 예외 처리: {type(exc).__name__}: {str(exc)}")
    logger.error(f"스택 트레이스: {traceback.format_exc()}")
    
    response = JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc) if getattr(settings, 'DEBUG', True) else "서버 내부 오류가 발생했습니다"
        }
    )
    
    # CORS 헤더 수동 추가
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP 예외: {exc.status_code} - {exc.detail}")
    
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    
    # CORS 헤더 수동 추가
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# 기존 예외 핸들러들
app.add_exception_handler(FamilyNewsException, family_news_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

@app.get("/")
async def root():
    return {
        "message": "Family News Service API",
        "version": getattr(settings, 'APP_VERSION', '1.0.0'),
        "description": "가족 소식지 서비스 API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_prefix": getattr(settings, 'API_PREFIX', '/api'),
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    try:
        from .database.session import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "app": getattr(settings, 'APP_NAME', 'Family News Service'),
        "version": getattr(settings, 'APP_VERSION', '1.0.0'),
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }

# 디버그용 테스트 엔드포인트
@app.post("/api/test/simple")
async def simple_test():
    """CORS 테스트용 간단한 엔드포인트"""
    logger.info("간단한 테스트 엔드포인트 호출됨")
    return {"message": "CORS 테스트 성공", "timestamp": datetime.now().isoformat()}

@app.post("/api/test/auth")
async def auth_test(current_user: User = Depends(get_current_user)):
    """인증 테스트용 엔드포인트"""
    logger.info(f"인증 테스트 - 사용자: {current_user.id}")
    return {"message": "인증 테스트 성공", "user_id": str(current_user.id)}

# 업로드 디렉토리 설정
UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@app.post("/api/posts/upload-images")
async def upload_images(files: List[UploadFile] = File(...)):
    """이미지 업로드 엔드포인트 (강화된 오류 처리)"""
    
    logger.info(f"이미지 업로드 요청: {len(files)}개 파일")
    
    try:
        # 기본 검증
        if len(files) > 4:
            logger.warning(f"파일 개수 초과: {len(files)}개")
            raise HTTPException(status_code=400, detail="최대 4개의 파일만 업로드할 수 있습니다")
        
        if len(files) == 0:
            logger.warning("파일이 없음")
            raise HTTPException(status_code=400, detail="최소 1개의 파일이 필요합니다")
        
        uploaded_urls = []
        
        for i, file in enumerate(files):
            logger.info(f"파일 {i+1} 처리 중: {file.filename}, {file.content_type}, size: {getattr(file, 'size', 'unknown')}")
            
            # 파일 검증
            if not file.content_type or not file.content_type.startswith('image/'):
                logger.warning(f"잘못된 파일 형식: {file.content_type}")
                raise HTTPException(status_code=400, detail=f"파일 '{file.filename}'은 이미지 파일이 아닙니다")
            
            # 파일 크기 검증
            if hasattr(file, 'size') and file.size and file.size > 10 * 1024 * 1024:
                logger.warning(f"파일 크기 초과: {file.size} bytes")
                raise HTTPException(status_code=400, detail=f"파일 '{file.filename}'의 크기가 10MB를 초과합니다")
            
            # 파일 확장자 확인
            file_extension = 'jpg'
            if file.filename and '.' in file.filename:
                file_extension = file.filename.split('.')[-1].lower()
                if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                    file_extension = 'jpg'
            
            # 고유한 파일명 생성
            unique_filename = f"{uuid.uuid4().hex}_{int(datetime.now().timestamp())}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
            
            try:
                # 파일 읽기
                logger.info(f"파일 {i+1} 읽기 시작...")
                file.file.seek(0)
                file_content = await file.read()
                
                if len(file_content) == 0:
                    logger.warning(f"파일 {i+1} 내용이 비어있음")
                    raise HTTPException(status_code=400, detail=f"파일 '{file.filename}'의 내용이 비어있습니다")
                
                logger.info(f"파일 {i+1} 읽기 완료: {len(file_content)} bytes")
                
                # 로컬에 저장
                logger.info(f"파일 {i+1} 저장 시작: {file_path}")
                async with aiofiles.open(file_path, 'wb') as buffer:
                    await buffer.write(file_content)
                
                # URL 생성
                image_url = f"/uploads/{unique_filename}"
                uploaded_urls.append(image_url)
                
                logger.info(f"파일 {i+1} 업로드 성공: {image_url}")
                
            except Exception as file_error:
                logger.error(f"파일 {i+1} 업로드 실패: {str(file_error)}")
                logger.error(f"파일 오류 스택 트레이스: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"파일 '{file.filename}' 업로드 중 오류: {str(file_error)}"
                )
        
        # 성공적으로 업로드된 파일이 없는 경우
        if len(uploaded_urls) == 0:
            logger.error("모든 파일 업로드 실패")
            raise HTTPException(status_code=500, detail="모든 파일 업로드에 실패했습니다")
        
        logger.info(f"이미지 업로드 완료: {len(uploaded_urls)}개 파일")
        return {"image_urls": uploaded_urls}
        
    except HTTPException as e:
        logger.warning(f"HTTP 예외 발생: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"예상치 못한 업로드 오류: {str(e)}")
        logger.error(f"업로드 오류 스택 트레이스: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"이미지 업로드 중 시스템 오류: {str(e)}"
        )

# 정적 파일 서빙 추가
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")

@app.get("/favicon.ico")
async def favicon():
    """favicon.ico 요청 처리"""
    return {"message": "No favicon configured"}

@app.get("/robots.txt")
async def robots():
    """robots.txt 요청 처리"""
    return {"message": "No robots.txt configured"}

# API 라우터 등록
api_prefix = getattr(settings, 'API_PREFIX', '/api')

app.include_router(auth.router, prefix=api_prefix, tags=["authentication"])
app.include_router(profile.router, prefix=api_prefix, tags=["profile"])
app.include_router(family.router, prefix=api_prefix, tags=["family"])
app.include_router(members.router, prefix=api_prefix, tags=["members"])
app.include_router(posts.router, prefix=api_prefix, tags=["posts"])
app.include_router(issues.router, prefix=api_prefix, tags=["issues"])
app.include_router(books.router, prefix=api_prefix, tags=["books"])
app.include_router(subscription.router, prefix=api_prefix, tags=["subscription"])
app.include_router(admin.router, prefix=api_prefix, tags=["admin"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Family News Service...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
    
    logger.info("=== Family News Service Started ===")
    logger.info(f"Version: {getattr(settings, 'APP_VERSION', '1.0.0')}")
    logger.info(f"Debug Mode: {getattr(settings, 'DEBUG', True)}")
    logger.info(f"API Documentation: /docs")
    logger.info(f"Alternative Documentation: /redoc")
    logger.info(f"Upload Directory: {UPLOAD_DIRECTORY}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Family News Service...")
    try:
        pass
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
    
    logger.info("Family News Service stopped")

if getattr(settings, 'DEBUG', True):
    @app.get("/debug/routes")
    async def debug_routes():
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                route_info = {
                    "path": route.path,
                    "name": getattr(route, 'name', 'unknown'),
                    "methods": list(getattr(route, 'methods', [])) if hasattr(route, 'methods') else []
                }
                routes.append(route_info)
        
        return {
            "total_routes": len(routes),
            "routes": sorted(routes, key=lambda x: x['path'])
        }
    
    @app.get("/debug/uploads")
    async def debug_uploads():
        """업로드된 파일 목록 확인"""
        try:
            files = os.listdir(UPLOAD_DIRECTORY) if os.path.exists(UPLOAD_DIRECTORY) else []
            return {
                "upload_directory": UPLOAD_DIRECTORY,
                "file_count": len(files),
                "files": files[:10]  # 최대 10개만 표시
            }
        except Exception as e:
            return {
                "error": str(e),
                "upload_directory": UPLOAD_DIRECTORY
            }

    @app.get("/debug/database")
    async def debug_database():
        """데이터베이스 상태 상세 확인"""
        try:
            from .database.session import AsyncSessionLocal
            from sqlalchemy import text
            
            async with AsyncSessionLocal() as db:
                # 기본 연결 확인
                result = await db.execute(text("SELECT 1 as test"))
                basic_test = result.scalar()
                
                # 테이블 존재 확인
                tables_result = await db.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """))
                tables = [row[0] for row in tables_result.fetchall()]
                
                # 주요 테이블 레코드 수 확인
                counts = {}
                for table in ['users', 'family_groups', 'family_members', 'issues', 'posts']:
                    if table in tables:
                        try:
                            count_result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                            counts[table] = count_result.scalar()
                        except Exception as e:
                            counts[table] = f"error: {str(e)}"
                            
            return {
                "basic_connection": "OK" if basic_test == 1 else "FAILED",
                "tables": tables,
                "record_counts": counts,
                "status": "healthy"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "unhealthy"
            }

    @app.get("/debug/user/{user_id}")
    async def debug_user(user_id: str):
        """특정 사용자의 데이터 상태 확인"""
        try:
            from .database.session import AsyncSessionLocal
            from sqlalchemy import text
            
            async with AsyncSessionLocal() as db:
                # 사용자 존재 확인
                user_result = await db.execute(
                    text("SELECT id, email, name FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                )
                user = user_result.fetchone()
                
                # 멤버십 확인
                member_result = await db.execute(
                    text("SELECT group_id, role, member_relationship FROM family_members WHERE user_id = :user_id"),
                    {"user_id": user_id}
                )
                membership = member_result.fetchone()
                
                # 그룹 정보 확인 (멤버십이 있는 경우)
                group_info = None
                if membership:
                    group_result = await db.execute(
                        text("SELECT id, group_name, status FROM family_groups WHERE id = :group_id"),
                        {"group_id": membership[0]}
                    )
                    group_info = group_result.fetchone()
                
                return {
                    "user": {
                        "id": user[0] if user else None,
                        "email": user[1] if user else None,
                        "name": user[2] if user else None,
                        "exists": user is not None
                    },
                    "membership": {
                        "group_id": membership[0] if membership else None,
                        "role": membership[1] if membership else None,
                        "relationship": membership[2] if membership else None,
                        "exists": membership is not None
                    },
                    "group": {
                        "id": group_info[0] if group_info else None,
                        "name": group_info[1] if group_info else None,
                        "status": group_info[2] if group_info else None,
                        "exists": group_info is not None
                    } if membership else None
                }
                
        except Exception as e:
            return {
                "error": str(e),
                "user_id": user_id
            }

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.info(f"404 오류: {request.url.path}")
    response = JSONResponse(
        status_code=404,
        content={
            "detail": "Not Found",
            "message": f"The path '{request.url.path}' was not found",
            "available_endpoints": {
                "docs": "/docs",
                "redoc": "/redoc",
                "health": "/health",
                "debug_routes": "/debug/routes" if getattr(settings, 'DEBUG', True) else None
            }
        }
    )
    
    # CORS 헤더 수동 추가
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
