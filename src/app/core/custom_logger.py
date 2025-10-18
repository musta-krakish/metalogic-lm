from fastapi import FastAPI, Request
from starlette.responses import Response
from app.core.logger import log_to_db, logger
import time

class LoggedFastAPI(FastAPI):
    """Наследник FastAPI, логирующий все запросы в БД."""

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await super().__call__(scope, receive, send)

        request = Request(scope, receive=receive)
        start_time = time.time()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                process_time = time.time() - start_time
                logger.info(f"{request.method} {request.url.path} [{process_time:.2f}s]")
                log_to_db(
                    "INFO",
                    f"Request {request.method} {request.url.path}",
                    path=request.url.path,
                    method=request.method
                )
            await send(message)

        await super().__call__(scope, receive, send_wrapper)
