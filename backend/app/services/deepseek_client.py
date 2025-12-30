import os
import time
import logging
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# 确保.env文件被加载
def _ensure_env_loaded():
    """确保环境变量从.env文件加载"""
    env_paths = [
        Path(__file__).parent.parent.parent / '.env',  # backend/.env
        Path.cwd() / '.env',  # 当前工作目录 .env
    ]

    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=True)  # 使用override=True确保覆盖
            print(f"Loaded .env from: {env_path}")
            break
    else:
        print("Warning: .env file not found in expected locations")

# 加载环境变量
_ensure_env_loaded()

# 配置日志级别为 INFO 便于调试
logging.basicConfig(level=logging.INFO)

try:
    import openai
    print("OpenAI library imported successfully")
except Exception as e:
    openai = None
    print(f"OpenAI library not available: {e}")

logger = logging.getLogger("deepseek")

# DeepSeek API配置
API_KEY = os.getenv("DEEPSEEK_API_KEY") or "sk-22872ac162944973b31d3541b409a562"
MODEL_DEFAULT = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
MAX_RETRIES = int(os.getenv("LLM_RETRIES", "2"))
RETRY_SLEEP = float(os.getenv("LLM_RETRY_SLEEP", "0.8"))
TIMEOUT_SEC = float(os.getenv("LLM_TIMEOUT", "120"))

# 调试信息
print(f"DeepSeek Client Debug:")
print(f"  API_KEY: {API_KEY[:10] if API_KEY else 'None'}...")
print(f"  MODEL_DEFAULT: {MODEL_DEFAULT}")
print(f"  OpenAI available: {openai is not None}")


class DeepSeekUnavailable(Exception):
    pass


def is_enabled() -> bool:
    return bool(API_KEY) and bool(openai)


def _extract_text(response) -> str:
    """从DeepSeek API响应中提取文本内容"""
    try:
        if hasattr(response, 'choices') and response.choices:
            content = response.choices[0].message.content
            if content:
                return content.strip()

        # 尝试其他可能的响应格式
        if hasattr(response, 'content'):
            return response.content.strip()

        logger.warning(f"无法从响应中提取文本: {response}")
        return "抱歉，AI服务返回了意外的响应格式。"

    except Exception as e:
        logger.error(f"提取响应文本失败: {e}")
        return f"响应解析失败: {str(e)}"


def generate_answer(question: str, system_prompt: Optional[str] = None) -> str:
    """调用DeepSeek API生成回答"""
    if not is_enabled():
        raise DeepSeekUnavailable("DeepSeek API not configured or OpenAI library missing")

    if openai is None:
        raise DeepSeekUnavailable("OpenAI library not available")

    # 初始化OpenAI客户端（用于DeepSeek）
    client = openai.OpenAI(
        api_key=API_KEY,
        base_url="https://api.deepseek.com"
    )

    last_err: Optional[Exception] = None
    start_total = time.time()

    for attempt in range(1, MAX_RETRIES + 2):  # e.g. retries=2 => attempts:1,2,3
        try:
            start = time.time()

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": question})

            response = client.chat.completions.create(
                model=MODEL_DEFAULT,
                messages=messages,
                temperature=float(os.getenv("LLM_TEMPERATURE", "0.3")),  # 降低温度以获得更专业的回答
                max_tokens=None,  # 不限制输出长度
                stream=False
            )

            latency = time.time() - start
            logger.info("DeepSeek API success attempt=%d latency=%.2fs", attempt, latency)
            return _extract_text(response)

        except Exception as e:
            last_err = e
            logger.warning("DeepSeek API error attempt=%d err=%s", attempt, e)
            if time.time() - start_total > TIMEOUT_SEC:
                logger.error("DeepSeek API soft timeout exceeded %.2fs", TIMEOUT_SEC)
                break
            if attempt <= MAX_RETRIES:
                time.sleep(RETRY_SLEEP)

    raise last_err or DeepSeekUnavailable("DeepSeek API failed without explicit exception")


# 测试连接
if __name__ == "__main__":
    if is_enabled():
        print("DeepSeek API配置正常，测试连接...")
        try:
            test_response = generate_answer("你好，请简单介绍一下你的能力。")
            print(f"测试成功: {test_response[:100]}...")
        except Exception as e:
            print(f"测试失败: {e}")
    else:
        print("DeepSeek API配置异常，请检查API密钥和依赖库")