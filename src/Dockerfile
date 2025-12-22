# ---------- FRONTEND BUILD ----------
FROM node:20 AS frontend-builder

WORKDIR /build/client

COPY src/client/package.json src/client/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY src/client ./
RUN pnpm run build


# ---------- BACKEND BUILD ----------
FROM python:3.11-slim AS backend-builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY src/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY src/app ./app
COPY src/main.py .


# ---------- RUNTIME ----------
FROM python:3.11-slim

WORKDIR /app

# зависимости python
COPY --from=backend-builder /install /usr/local

# backend
COPY --from=backend-builder /build/app ./app
COPY --from=backend-builder /build/main.py .

# frontend
COPY --from=frontend-builder /build/client/dist ./client_dist

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
