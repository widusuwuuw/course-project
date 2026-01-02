from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pathlib import Path
import uuid
import os
import mimetypes
from urllib.parse import urlparse
import logging # Import logging

logger = logging.getLogger(__name__) # Get logger instance

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
)

# 定义上传目录路径 (与 main.py 中的 UPLOAD_DIR 保持一致)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent # Points to D:\SoftwareDesign\wty\backend\app\routers -> backend\app -> backend
ACTUAL_PROJECT_ROOT = PROJECT_ROOT.parent # Points to D:\SoftwareDesign\wty
UPLOAD_DIR = ACTUAL_PROJECT_ROOT / "static/uploads"

# 获取后端服务的基准 URL，默认为本地开发地址
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片文件，并返回可访问的 URL。
    """
    # 1. 验证文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只允许上传图片文件。"
        )

    # 2. 生成唯一文件名
    file_extension = mimetypes.guess_extension(file.content_type)
    if not file_extension:
        original_filename_parts = file.filename.rsplit('.', 1) if file.filename else []
        if len(original_filename_parts) > 1:
            file_extension = f".{original_filename_parts[1]}"
        else:
            file_extension = ".jpg" # 最终的备选

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # 3. 保存文件
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            while contents := await file.read(1024 * 1024): # Read in chunks of 1MB
                f.write(contents)
        logger.info(f"Image saved to: {file_path.resolve()}") # Log absolute path
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件保存失败: {e}"
        )
    finally:
        await file.close()

    # 4. 返回文件 URL
    # 返回相对 URL，前端会根据 API_BASE_URL 拼接
    return {"filename": unique_filename, "url": f"/static/uploads/{unique_filename}"}
