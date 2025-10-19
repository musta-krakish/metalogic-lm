from app.database.database import SessionLocal
from app.database.schemas import LogEntry
from app.core.logger import logger

class LogsController:
    @staticmethod
    def get_logs(page: int = 1, limit: int = 20, level: str | None = None, search: str | None = None):
        """Получает логи из БД с фильтрацией и пагинацией"""
        db = SessionLocal()
        try:
            query = db.query(LogEntry).order_by(LogEntry.created_at.desc())
            
            if level:
                query = query.filter(LogEntry.level.ilike(level))
            if search:
                pattern = f"%{search}%"
                query = query.filter(LogEntry.message.ilike(pattern))
            
            total = query.count()
            logs = (
                query.offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            
            items = [
                {
                    "id": log.id,
                    "level": log.level,
                    "message": log.message,
                    "path": log.path,
                    "method": log.method,
                    "ip_addres": log.ip_address,
                    "created_at": log.created_at.isoformat(),
                    "metadata": log.data
                }
                for log in logs
            ]
            
            return {"page": page, "limit": limit, "total": total, "items": items}
        except Exception as e:
            logger.error(f"Ошибка при получении логов: {e}")
            return {"error": str(e)}
        finally:
            db.close()
