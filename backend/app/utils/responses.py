from typing import Any
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def api_response(success: bool, data: Any = None, message: str = "", status_code: int = 200):
    content = {
        "success": success,
        "data": data,
        "message": message
    }
    return JSONResponse(content=jsonable_encoder(content), status_code=status_code)
