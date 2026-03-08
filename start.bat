@echo off
chcp 65001 >nul
echo === My TodoList 시작 ===

cd /d "%~dp0"

echo [1/2] 백엔드 시작 중...
cd backend
if not exist "venv" (
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt -q
) else (
    call venv\Scripts\activate.bat
)
start /b uvicorn app.main:app --host 0.0.0.0 --port 8000
cd ..

echo [2/2] 프론트엔드 시작 중...
cd frontend
if not exist "node_modules" (
    npm install
)
start /b npm run dev
cd ..

echo.
echo === 실행 완료 ===
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   종료: Ctrl+C
echo.
pause
