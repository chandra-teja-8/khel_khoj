# KhelKhoj All-in-One Startup Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting KhelKhoj Full-Stack AI Athlete Platform        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Embedded PostgreSQL 18
Write-Host "[1/4] Starting PostgreSQL daemon on port 5433..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\DOOM\apps\backend'; npx.cmd tsx scripts/run-pg.ts"

Start-Sleep -Seconds 3

# 2. Start Python FastAPI AI Service with YOLO11n-Pose
Write-Host "[2/4] Starting AI Service (YOLO11n-Pose) on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\DOOM\apps\ai-service'; .\venv\Scripts\uvicorn.exe service:app --host 127.0.0.1 --port 8000 --workers 2 --timeout-keep-alive 360"

Start-Sleep -Seconds 3

# 3. Start Node.js Express Backend API
Write-Host "[3/4] Starting Express Backend API on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\DOOM\apps\backend'; npx.cmd tsx src/index.ts"

Start-Sleep -Seconds 2

# 4. Start Next.js Frontend
Write-Host "[4/4] Starting Next.js Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\DOOM\apps\frontend'; npm.cmd run dev"

Write-Host "All services launching!" -ForegroundColor Cyan
Write-Host "Frontend:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:    http://localhost:5000" -ForegroundColor Yellow
Write-Host "AI Service: http://localhost:8000" -ForegroundColor Yellow
Write-Host "PostgreSQL: localhost:5433" -ForegroundColor Yellow
