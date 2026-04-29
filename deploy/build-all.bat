@echo off
REM ============================================================
REM LabAsset Manager - Build for All Platforms (Windows)
REM ============================================================
REM Generates:
REM   - go_asset_v{major}_{minor}_{date}_linux_amd64
REM   - go_asset_v{major}_{minor}_{date}_linux_arm64
REM   - go_asset_v{major}_{minor}_{date}_windows_amd64.exe
REM ============================================================

setlocal

echo ========================================================
echo   LabAsset Manager - Build All Platforms
echo ========================================================
echo.

REM Get current directory
set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

REM Load version from .env
set MAJOR=1
set MINOR=0

if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if "%%a"=="APP_VERSION_MAJOR" set MAJOR=%%b
        if "%%a"=="APP_VERSION_MINOR" set MINOR=%%b
    )
)

REM Get date in YYMMDD format
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "DT=%%a"
set DATE=%DT:~2,2%%DT:~5,2%%DT:~8,2%

echo Configuration:
echo   Version: %MAJOR%.%MINOR%
echo   Date:    %DATE%
echo.

REM Step 1: Check React build
echo [1/3] Checking React build...
if not exist "web\dist" (
    echo   ERROR: web\dist not found!
    echo   Please run 'npm run build' in web folder first.
    pause
    exit /b 1
)
echo   OK: web\dist found

REM Step 2: Build for each platform
echo [2/3] Building binaries...

REM Prepare dist
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
xcopy /s /e /i "web\dist" "cmd\server\dist" >nul

REM Linux AMD64
echo   Building Linux AMD64...
go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64" ./cmd/server
echo   OK: go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64

REM Linux ARM64
echo   Building Linux ARM64...
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64" ./cmd/server
echo   OK: go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64

REM Windows AMD64
echo   Building Windows AMD64...
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe" ./cmd/server
echo   OK: go_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe

REM Step 3: Cleanup
echo [3/3] Cleaning up...
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
echo   OK

echo.
echo ========================================================
echo   Build Complete!
echo ========================================================
echo.
echo   Linux AMD64:   go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64
echo   Linux ARM64:   go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64
echo   Windows AMD64: go_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe
echo.
echo   Copying to deploy folder...
copy "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64" "deploy\" >nul
copy "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64" "deploy\" >nul
copy "go_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe" "deploy\" >nul
echo   Done!
echo.
pause
