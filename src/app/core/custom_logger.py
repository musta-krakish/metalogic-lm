from fastapi import FastAPI, Request
from starlette.responses import Response
from app.core.logger import log_to_db, logger
import time
import json
from user_agents import parse

class LoggedFastAPI(FastAPI):
    """Наследник FastAPI, логирующий все запросы в БД с дополнительными метаданными."""

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await super().__call__(scope, receive, send)

        request = Request(scope, receive=receive)
        start_time = time.time()
        
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        referer = request.headers.get("referer")
        
        user_agent_parsed = parse(user_agent)
        browser = f"{user_agent_parsed.browser.family} {user_agent_parsed.browser.version_string}"
        os = f"{user_agent_parsed.os.family} {user_agent_parsed.os.version_string}"
        device = user_agent_parsed.device.family

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                process_time = time.time() - start_time
                status_code = message["status"]
                
                log_message = f"{request.method} {request.url.path} [{process_time:.2f}s] [{status_code}]"
                logger.info(log_message)
                
                metadata = {
                    "ip_address": client_ip,
                    "user_agent": user_agent,
                    "browser": browser,
                    "operating_system": os,
                    "device": device,
                    "processing_time": round(process_time, 3),
                    "status_code": status_code,
                    "referer": referer,
                    "query_params": str(request.query_params) if request.query_params else None,
                    "headers": {
                        k: v for k, v in request.headers.items() 
                        if k.lower() not in ['authorization', 'cookie']  
                    }
                }
                
                log_to_db(
                    level="INFO",
                    message=log_message,
                    path=request.url.path,
                    method=request.method,
                    ip_address=client_ip,
                    metadata=metadata
                )
            await send(message)

        await super().__call__(scope, receive, send_wrapper)