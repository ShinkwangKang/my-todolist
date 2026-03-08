# PRD: My-TodoList (칸반 보드 기반 할 일 관리 앱)

## Context

개인용 할 일 관리 앱을 만든다. Trello/MeisterTask 스타일의 칸반 보드 UI를 제공하며, 인터넷이 없는 다른 노트북에서도 독립적으로 실행할 수 있어야 한다.

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | Next.js (React + TypeScript) | 정적 빌드 가능 |
| Backend | FastAPI (Python) | 경량 API 서버 |
| DB | SQLite + SQLAlchemy | 파일 기반, 설치 불필요 |
| UI 라이브러리 | Tailwind CSS + shadcn/ui | 모던 UI 컴포넌트 |
| 드래그앤드롭 | @dnd-kit/core | 칸반 보드 카드 이동 |

## 핵심 기능

### 1. 뷰 모드
- 상단 탭 또는 토글로 **칸반 보드** / **주간 보드** 뷰 전환
- 동일한 데이터(카드)를 두 가지 관점으로 표시

#### 칸반 보드 (기본 뷰)
- 기본 컬럼: Todo, In Progress, Done, Cancel
- 사용자 정의 컬럼 추가/수정/삭제
- 카드 드래그앤드롭으로 컬럼 간 이동
- 컬럼 내 카드 순서 변경

#### 주간 보드
- 이번 주(월~일) 기준으로 카드를 시간축으로 표시
- 주간 네비게이션 (이전 주 / 이번 주 / 다음 주)
- 섹션 구성:

| 섹션 | 설명 |
|------|------|
| 오늘 할 일 | 오늘 마감이거나 오늘 진행 예정인 카드 |
| 이번 주 추가된 일 | 이번 주에 새로 생성된 카드 |
| 진행 중 | 현재 In Progress 상태인 카드 |
| 이번 주 완료 | 이번 주에 Done으로 이동된 카드 |
| 지연됨 | 마감일이 지났는데 완료되지 않은 카드 |


### 2. 할 일(카드) CRUD
- 제목, 설명 입력
- 카테고리 선택: 업무(work) / 개인(personal)
- 업무 유형(Task Type) 선택: 사용자 정의 가능
  - 기본 유형: 개발, 문서, JIRA, 회의, 기타
  - 설정에서 유형 추가/수정/삭제 가능
  - 유형별 아이콘 또는 색상 지정
- 카드 생성, 수정, 삭제
- 완료 상태 토글
- 카테고리별, 업무 유형별 시각적 구분 (아이콘 또는 색상 배지)
- 카테고리, 업무 유형 기반 필터링

### 3. 카테고리 / 태그
- 카드에 여러 태그 부여
- 태그별 색상 지정
- 태그 기반 필터링

### 4. 우선순위
- 높음 / 보통 / 낮음 (3단계)
- 우선순위별 시각적 표시 (색상/아이콘)
- 우선순위 기반 정렬/필터링

### 5. 마감일
- 날짜/시간 설정
- 마감 임박/초과 시각적 경고
- 마감일 기반 정렬/필터링

## 비기능 요구사항

### 오프라인 독립 실행
- 외부 CDN/API 의존 없음 (모든 에셋 로컬 번들)
- SQLite DB 파일 하나로 데이터 이식 가능
- 실행 스크립트 하나로 frontend + backend 동시 기동

### 이식성
- Python + Node.js만 설치되어 있으면 실행 가능
- 프로젝트 폴더 복사만으로 다른 PC에서 사용
- 시작 스크립트 제공 (`start.sh` / `start.bat`)

## 프로젝트 구조

```
My-TodoList/
├── frontend/          # Next.js 앱
│   ├── src/
│   │   ├── app/           # App Router 페이지
│   │   ├── components/    # UI 컴포넌트
│   │   │   ├── Board/     # 칸반 보드
│   │   │   ├── Weekly/    # 주간 보드
│   │   │   ├── Card/      # 할 일 카드
│   │   │   └── common/    # 공통 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # API 클라이언트, 유틸
│   │   └── types/         # TypeScript 타입
│   └── package.json
├── backend/           # FastAPI 앱
│   ├── app/
│   │   ├── main.py        # 앱 엔트리포인트
│   │   ├── models.py      # SQLAlchemy 모델
│   │   ├── schemas.py     # Pydantic 스키마
│   │   ├── crud.py        # DB 작업
│   │   ├── database.py    # DB 연결 설정
│   │   └── routers/       # API 라우터
│   └── requirements.txt
├── data/              # SQLite DB 파일 저장
├── start.sh           # Linux/Mac 실행 스크립트
├── start.bat          # Windows 실행 스크립트
└── PRD.md             # 이 문서
```

## API 엔드포인트

### 컬럼
- `GET /api/columns` - 전체 컬럼 목록
- `POST /api/columns` - 컬럼 생성
- `PUT /api/columns/{id}` - 컬럼 수정
- `DELETE /api/columns/{id}` - 컬럼 삭제
- `PUT /api/columns/reorder` - 컬럼 순서 변경

### 할 일 (카드)
- `GET /api/todos` - 전체 할 일 목록 (필터링/정렬 쿼리 파라미터)
- `GET /api/todos/weekly?date=YYYY-MM-DD` - 주간 보드 데이터 (섹션별 그룹핑)
- `POST /api/todos` - 할 일 생성
- `PUT /api/todos/{id}` - 할 일 수정
- `DELETE /api/todos/{id}` - 할 일 삭제
- `PUT /api/todos/{id}/move` - 컬럼 이동 / 순서 변경

### 업무 유형
- `GET /api/task-types` - 전체 업무 유형 목록
- `POST /api/task-types` - 업무 유형 생성
- `PUT /api/task-types/{id}` - 업무 유형 수정
- `DELETE /api/task-types/{id}` - 업무 유형 삭제

### 태그
- `GET /api/tags` - 전체 태그 목록
- `POST /api/tags` - 태그 생성
- `PUT /api/tags/{id}` - 태그 수정
- `DELETE /api/tags/{id}` - 태그 삭제

## DB 모델

### Column (컬럼)
- id, title, position, created_at, updated_at

### Todo (할 일)
- id, title, description, category (work/personal), task_type_id (FK -> TaskType), priority (high/medium/low), due_date, is_completed, completed_at, column_id, position, created_at, updated_at

### Tag (태그)
- id, name, color

### TaskType (업무 유형)
- id, name, color, icon, position, created_at, updated_at
- 기본값: 개발, 문서, JIRA, 회의, 기타

### TodoTag (다대다 관계)
- todo_id, tag_id

## 구현 순서

1. **Phase 1**: 프로젝트 초기 설정 (백엔드/프론트엔드 스캐폴딩)
2. **Phase 2**: DB 모델 + CRUD API 구현 (컬럼, 카드, 태그, 업무 유형)
3. **Phase 3**: 칸반 보드 UI 기본 구현 (컬럼 + 카드 렌더링)
4. **Phase 4**: 드래그앤드롭 구현
5. **Phase 5**: 카테고리, 업무 유형, 태그, 우선순위, 마감일 기능 추가
6. **Phase 6**: 주간 보드 UI 구현 (섹션별 카드 표시, 주간 네비게이션)
7. **Phase 7**: 필터링/정렬 기능
8. **Phase 8**: 오프라인 패키징 및 실행 스크립트

## 검증 방법

- Backend: pytest로 API 엔드포인트 테스트 (주간 보드 API 포함)
- Frontend - 칸반 보드: 컬럼 렌더링, 카드 CRUD, 드래그앤드롭 동작 확인
- Frontend - 주간 보드: 뷰 전환, 주간 네비게이션, 섹션별 카드 표시 확인
- 통합: 카드 생성 -> 드래그 이동 -> 주간 보드 반영 -> 필터링 E2E 흐름 확인
- 오프라인: 네트워크 차단 후 정상 동작 확인
