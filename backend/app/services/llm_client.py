import os
import time
import logging
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# 确保.env文件被加载
def _ensure_env_loaded():
    """确保环境变量从.env文件加载"""
    env_path = Path(__file__).parent.parent.parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        print(f"Loaded .env from: {env_path}")

# 加载环境变量
_ensure_env_loaded()

# 配置日志级别为 INFO 便于调试
logging.basicConfig(level=logging.INFO)

try:
    from dashscope import Generation
    print("dashscope.Generation imported successfully")
except Exception as e:  # catch both ImportError and other import errors
    Generation = None
    print(f"dashscope not available, using fallback. Error: {e}")

logger = logging.getLogger("llm")

MODEL_DEFAULT = os.getenv("DASHSCOPE_MODEL", "qwen-turbo")
API_KEY = os.getenv("DASHSCOPE_API_KEY") or os.getenv("DASH_SCOPE_API_KEY")
MAX_RETRIES = int(os.getenv("LLM_RETRIES", "2"))
RETRY_SLEEP = float(os.getenv("LLM_RETRY_SLEEP", "0.8"))
TIMEOUT_SEC = float(os.getenv("LLM_TIMEOUT", "120"))  # 增加到120秒以适应长报告生成

# 调试信息
print(f"LLM Client Debug:")
print(f"  API_KEY: {API_KEY[:10] if API_KEY else 'None'}...")
print(f"  MODEL_DEFAULT: {MODEL_DEFAULT}")
print(f"  Generation available: {Generation is not None}")


class LLMUnavailable(Exception):
    pass


def is_enabled() -> bool:
    return bool(API_KEY)  # 只要API密钥存在就启用，使用HTTP fallback


def _extract_text(resp) -> str:
    try:
        logger.debug("LLM raw response: %s", resp)
        # DashScope 返回格式：resp['output']['text'] 或 resp['output']['choices'][0]['message']['content']
        output = resp.get("output", {})
        # 优先尝试 text 字段
        if "text" in output:
            return output["text"].strip()
        # 备选：choices 格式
        choices = output.get("choices", [])
        if choices:
            return choices[0]["message"]["content"].strip()
    except Exception as e:
        logger.warning("LLM parse error: %s, resp: %s", e, resp)
    return "(LLM响应解析失败)"


def generate_answer(question: str, system_prompt: Optional[str] = None) -> str:
    """Call Tongyi Qianwen with simple retry & soft timeout."""
    if not is_enabled():
        raise LLMUnavailable("DashScope not configured or library missing")

    # If dashscope Generation is available, use it
    if Generation is not None:
        last_err: Optional[Exception] = None
        start_total = time.time()
        for attempt in range(1, MAX_RETRIES + 2):  # e.g. retries=2 => attempts:1,2,3
            try:
                start = time.time()
                resp = Generation.call(
                    model=MODEL_DEFAULT,
                    api_key=API_KEY,
                    messages=[
                        {"role": "system", "content": system_prompt or "你是一个健康科普助手，只给一般性建议，避免诊断与用药指导。"},
                        {"role": "user", "content": question},
                    ],
                    temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
                    max_tokens=None,  # 不限制输出长度
                )
                latency = time.time() - start
                logger.info("LLM success attempt=%d latency=%.2fs", attempt, latency)
                return _extract_text(resp)
            except Exception as e:
                last_err = e
                logger.warning("LLM error attempt=%d err=%s", attempt, e)
                if time.time() - start_total > TIMEOUT_SEC:
                    logger.error("LLM soft timeout exceeded %.2fs", TIMEOUT_SEC)
                    break
                if attempt <= MAX_RETRIES:
                    time.sleep(RETRY_SLEEP)
        raise last_err or LLMUnavailable("LLM failed without explicit exception")
    else:
        # Fallback: Use direct HTTP request to DashScope API
        import httpx

        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "model": MODEL_DEFAULT,
            "input": {
                "messages": [
                    {"role": "system", "content": system_prompt or "你是一个健康科普助手，只给一般性建议，避免诊断与用药指导。"},
                    {"role": "user", "content": question},
                ]
            },
            "parameters": {
                "temperature": float(os.getenv("LLM_TEMPERATURE", "0.7")),
                "max_tokens": 8000,  # 设置为8000个token的上限
            }
        }

        try:
            with httpx.Client(timeout=TIMEOUT_SEC) as client:
                response = client.post(url, json=data, headers=headers)
                response.raise_for_status()
                result = response.json()

                if result.get("output", {}).get("text"):
                    return result["output"]["text"]
                elif result.get("output", {}).get("choices"):
                    return result["output"]["choices"][0]["message"]["content"]
                else:
                    logger.warning("Unexpected API response: %s", result)
                    return "抱歉，AI服务返回了意外的响应格式。"

        except httpx.TimeoutException:
            raise LLMUnavailable("API请求超时")
        except httpx.HTTPStatusError as e:
            logger.error("HTTP error: %s, response: %s", e, e.response.text)
            raise LLMUnavailable(f"API请求失败: {e}")
        except Exception as e:
            logger.error("API调用错误: %s", e)
            raise LLMUnavailable(f"API调用失败: {e}")
