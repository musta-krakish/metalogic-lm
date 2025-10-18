# ---------- FRONTEND BUILD ----------
FROM node:20-alpine AS frontend
WORKDIR /client

RUN npm install -g pnpm

COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client ./
RUN pnpm run build

# ---------- BACKEND ----------
FROM python:3.11-slim AS backend
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY main.py .
COPY --from=frontend /client/dist ./client_dist

EXPOSE 8000
ENV PORT=8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
