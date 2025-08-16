# payment_app.py
import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kakaopay")

app = FastAPI()

KAKAOPAY_DEV_SECRET_KEY = "Your_Dev_Secret_Key_Here"  # 개발자용 시크릿 키 설정

# 테스트 CID (테스트용)
CID = "TC0ONETIME"
KAKAOPAY_API_HOST = "https://open-api.kakaopay.com"

API_APPROVAL_URL = "http://localhost:8000/payment/success"
API_CANCEL_URL = "http://localhost:8000/payment/cancel"
API_FAIL_URL = "http://localhost:8000/payment/fail"

# 테스트옹 저장
_payment_info: Dict[str, str] = {}

class PaymentRequest(BaseModel):
    item_name: str
    quantity: int
    total_amount: int

@app.post("/payment/ready")
async def ready_payment(req: PaymentRequest):

    if not KAKAOPAY_DEV_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Dev secret key not configured on server."})

    headers = {
        "Authorization": f"SECRET_KEY {KAKAOPAY_DEV_SECRET_KEY}",
        "Content-Type": "application/json;charset=UTF-8",
    }

    payload = {
        "cid": CID,
        "partner_order_id": "test_order_1002",
        "partner_user_id": "test_user_1002",
        "item_name": req.item_name,
        "quantity": req.quantity,
        "total_amount": req.total_amount,
        "tax_free_amount": 0,
        "approval_url": API_APPROVAL_URL,
        "cancel_url": API_CANCEL_URL,
        "fail_url": API_FAIL_URL,
    }

    url = f"{KAKAOPAY_API_HOST}/online/v1/payment/ready"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            result = resp.json()

            # tid -> partner_order_id 임시 저장
            tid = result.get("tid")
            if tid:
                _payment_info[tid] = payload["partner_order_id"]

            logger.info("KakaoPay ready success: tid=%s", tid)
            return result

        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.json()
            except Exception:
                body = e.response.text
            logger.error("KakaoPay ready failed: status=%s body=%s", e.response.status_code, body)
            return JSONResponse(status_code=e.response.status_code, content={"error": "Kakao Pay API error", "details": body})
        except Exception as e:
            logger.exception("Unexpected error when calling KakaoPay ready")
            return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(e)})


@app.get("/payment/success")
async def approve_payment(pg_token: str):
    if not KAKAOPAY_DEV_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Dev secret key not configured on server."})

    if not _payment_info:
        return JSONResponse(status_code=400, content={"error": "No payment info found."})

    # 가장 최근 결제건 tid 가져오기 (테스트용)
    tid = list(_payment_info.keys())[-1]
    partner_order_id = _payment_info[tid]

    headers = {
        "Authorization": f"SECRET_KEY {KAKAOPAY_DEV_SECRET_KEY}",
        "Content-Type": "application/json;charset=UTF-8",
    }

    payload = {
        "cid": CID,
        "tid": tid,
        "partner_order_id": partner_order_id,
        "partner_user_id": "test_user_1002",
        "pg_token": pg_token,
    }

    url = f"{KAKAOPAY_API_HOST}/online/v1/payment/approve"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            result = resp.json()
            logger.info("KakaoPay approve success: aid=%s", result.get("aid"))
            return {"payment_result": result}

        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.json()
            except Exception:
                body = e.response.text
            logger.error("KakaoPay approve failed: status=%s body=%s", e.response.status_code, body)
            return JSONResponse(status_code=e.response.status_code, content={"error": "Payment approval failed", "details": body})
        except Exception as e:
            logger.exception("Unexpected error when calling KakaoPay approve")
            return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(e)})

@app.get("/payment/cancel")
async def payment_cancel():
    return {"status": "payment_cancelled"}

@app.get("/payment/fail")
async def payment_fail():
    return {"status": "payment_failed"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("payment_app:app", host="0.0.0.0", port=8000, reload=True)
