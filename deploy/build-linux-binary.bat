@echo off
REM ============================================================
REM LabAsset Manager - Build Linux Binary (Cross-Compile)
REM ============================================================
REM Output: go_asset_v{major}_{minor}_{YYMMDD} (no extension - Linux binary)
REM ============================================================

setlocal

echo ========================================================
echo   LabAsset Manager - Build Linux Binary
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

REM Output filename (NO extension for Linux)
set OUTPUT_NAME=go_asset_v%MAJOR%_%MINOR%_%DATE%

echo Configuration:
echo   Version: %MAJOR%.%MINOR%
echo   Date:    %DATE%
echo   Output:  %OUTPUT_NAME% (Linux binary)
echo.

REM Step 1: Check React build
echo [1/4] Checking React build...
if not exist "web\dist" (
    echo   ERROR: web\dist not found!
    echo   Please run 'npm run build' in web folder first.
    pause
    exit /b 1
)
echo   OK: web\dist found

REM Step 2: Prepare embedded files in cmd/server/dist
echo [2/4] Preparing embedded files...
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
xcopy /s /e /i "web\dist" "cmd\server\dist" >nul
if errorlevel 1 (
    echo   ERROR: Failed to copy dist folder!
    pause
    exit /b 1
)
echo   OK: Copied web\dist to cmd\server\dist

REM Step 3: Cross-compile for Linux
echo [3/4] Cross-compiling for Linux (GOOS=linux)...
go build -ldflags="-s -w" -o "%OUTPUT_NAME%" ./cmd/server

if errorlevel 1 (
    echo.
    echo ========================================================
    echo   ERROR: Build failed!
    echo ========================================================
    if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
    pause
    exit /b 1
)

echo   OK: Binary built

REM Step 4: Copy to deploy folder
echo [4/4] Copying to deploy folder...
if not exist "deploy" mkdir deploy
copy "%OUTPUT_NAME%" "deploy\%OUTPUT_NAME%" >nul
echo   OK: Copied to deploy\%OUTPUT_NAME%

REM Cleanup
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"

echo.
echo ========================================================
echo   Build Successful!
echo ========================================================
echo.
echo   Binary: deploy\%OUTPUT_NAME%
echo   Size:  (check file properties)
echo.
echo   To deploy to VPS:
echo   1. Upload deploy\%OUTPUT_NAME% to VPS
echo   2. Upload web/dist folder as 'dist' alongside the binary
echo   3. Or copy web/dist to cmd/server/dist and rebuild
echo.
pause
