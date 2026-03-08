from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, SessionLocal
from . import models
from .routers import columns, todos, tags, task_types

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="My-TodoList API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(columns.router)
app.include_router(todos.router)
app.include_router(tags.router)
app.include_router(task_types.router)


@app.on_event("startup")
def seed_defaults():
    db = SessionLocal()
    try:
        # Seed default columns
        if db.query(models.BoardColumn).count() == 0:
            defaults = ["Todo", "In Progress", "Done", "Cancel"]
            for i, title in enumerate(defaults):
                db.add(models.BoardColumn(title=title, position=i))
            db.commit()

        # Seed default task types
        if db.query(models.TaskType).count() == 0:
            defaults = [
                ("개발", "#3B82F6", "code"),
                ("문서", "#10B981", "document"),
                ("JIRA", "#F59E0B", "ticket"),
                ("회의", "#8B5CF6", "meeting"),
                ("기타", "#6B7280", "etc"),
            ]
            for i, (name, color, icon) in enumerate(defaults):
                db.add(models.TaskType(name=name, color=color, icon=icon, position=i))
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
