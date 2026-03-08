# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

칸반 보드 기반 할 일 관리 앱 (My TodoList). 3가지 뷰 제공: 칸반 보드, 주간 보드(요일별 컬럼), 주간 리포트.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, dnd-kit (drag & drop)
- **Backend**: FastAPI, SQLAlchemy (SQLite), Pydantic v2
- **DB**: SQLite (`data/todolist.db`, gitignored)

## Development Commands

```bash
# Backend
cd backend
source venv/bin/activate  # Python 3.12 venv
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev    # Next.js dev server on port 3000
npm run build  # Production build
npm run lint   # ESLint
```

Backend API: `http://localhost:8000`, Frontend: `http://localhost:3000`

## Architecture

### Backend (`backend/app/`)

전형적인 FastAPI 레이어드 구조:
- `main.py` — FastAPI 앱, CORS 설정(localhost:3000 허용), 시작 시 기본 컬럼/업무유형 시드
- `database.py` — SQLAlchemy 엔진/세션 (SQLite)
- `models.py` — ORM 모델: `BoardColumn`, `Todo`, `Tag`, `TaskType`, `DailyProgress` + M2M `todo_tag`
- `schemas.py` — Pydantic 요청/응답 스키마
- `crud.py` — 모든 DB 로직 (CRUD + 주간 보드/리포트 집계)
- `routers/` — API 라우터 (`/api/columns`, `/api/todos`, `/api/tags`, `/api/task-types`)

주요 비즈니스 로직:
- Todo를 Done 컬럼으로 이동 시 자동으로 `is_completed=True`, `completed_at` 설정 (`crud.move_todo`)
- 주간 보드는 `start_date` 기준으로 요일에 배치, 미완료 카드는 오늘까지 이월 표시 (`crud.get_weekly_todos`)
- `DailyProgress`는 todo_id + date 조합 유니크, upsert 패턴 사용

### Frontend (`frontend/src/`)

단일 페이지 앱 (SPA), `page.tsx`가 모든 상태를 관리하고 뷰 전환:
- `app/page.tsx` — 루트 페이지, 전역 상태(columns, tags, taskTypes), 뷰 전환(kanban/weekly/report)
- `lib/api.ts` — `api` 객체로 모든 REST 호출 래핑, `NEXT_PUBLIC_API_URL` 환경변수 지원
- `types/index.ts` — 타입 정의 (Backend 스키마와 1:1 대응)
- `components/Board/` — KanbanBoard, BoardColumn (dnd-kit 사용)
- `components/Weekly/` — WeeklyBoard (요일별 컬럼)
- `components/Report/` — WeeklyReport
- `components/Card/` — TodoCard, TodoFormDialog
- `components/ui/` — shadcn/ui 컴포넌트

### API Endpoints

모든 API는 `/api` 프리픽스:
- `GET/POST /api/columns` — 컬럼 CRUD (GET은 todos 포함)
- `PUT /api/columns/reorder` — 컬럼 순서 변경
- `GET/POST /api/todos` — Todo CRUD (필터링: column_id, priority, category, task_type_id, tag_id, is_completed)
- `PUT /api/todos/{id}/move` — 컬럼 간 이동 + 위치 변경
- `GET /api/todos/weekly?date=YYYY-MM-DD` — 주간 보드 데이터
- `GET /api/todos/weekly-report?date=YYYY-MM-DD` — 주간 리포트
- `PUT /api/todos/{id}/daily-progress/{YYYY-MM-DD}` — 일별 진행 기록 upsert
- `GET/POST /api/tags`, `GET/POST /api/task-types` — 태그/업무유형 CRUD

### Data Model Relationships

```
BoardColumn 1──N Todo N──M Tag
                  │
                  ├── TaskType (FK, nullable)
                  └── DailyProgress 1──N (unique: todo_id + date)
```

## Conventions

- 한국어 UI (lang="ko")
- Path alias: `@/*` → `frontend/src/*`
- Backend는 `from_attributes = True` (Pydantic v2 ORM 모드)
- Position 기반 정렬 (columns, todos 모두 `position` 필드 사용)
- 시드 데이터: 기본 컬럼 ["Todo", "In Progress", "Done", "Cancel"], 기본 업무유형 ["개발", "문서", "JIRA", "회의", "기타"]
