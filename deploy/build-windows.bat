@echo off
REM ============================================================
REM LabAsset Manager - Build Windows Binary
REM ============================================================
REM Output: go_asset_v{major}_{minor}_{YYMMDD}.exe
REM ============================================================

setlocal

echo ========================================================
echo   LabAsset Manager - Build Windows Binary
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

REM Output filename
set OUTPUT_NAME=go_asset_v%MAJOR%_%MINOR%_%DATE%.exe

echo Configuration:
echo   Version: %MAJOR%.%MINOR%
echo   Date:    %DATE%
echo   Output:  %OUTPUT_NAME%
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

REM Step 2: Prepare embedded files
echo [2/4] Preparing embedded files...
if exist "dist" rmdir /s /q "dist"
xcopy /s /e /i "web\dist" "dist" >nul
if errorlevel 1 (
    echo   ERROR: Failed to copy dist folder!
    pause
    exit /b 1
)
echo   OK: Copied web\dist to project root

REM Step 3: Build Go binary
echo [3/4] Building Go binary for Windows...
go build -ldflags="-s -w" -o "%OUTPUT_NAME%" ./cmd/server

if errorlevel 1 (
    echo.
    echo ========================================================
    echo   ERROR: Build failed!
    echo ========================================================
    if exist "dist" rmdir /s /q "dist"
    pause
    exit /b 1
)

echo   OK: Binary built: %OUTPUT_NAME%

REM Step 4: Copy to deploy folder
echo [4/4] Copying to deploy folder...
copy "%OUTPUT_NAME%" "deploy\%OUTPUT_NAME%" >nul
if errorlevel 1 (
    echo   ERROR: Failed to copy to deploy folder!
    pause
    exit /b 1
)
echo   OK: Copied to deploy\%OUTPUT_NAME%

REM Cleanup
if exist "dist" rmdir /s /q "dist"

echo.
echo ========================================================
echo   Build Successful!
echo ========================================================
echo.
echo   Binary: deploy\%OUTPUT_NAME%
for %%A in ("deploy\%OUTPUT_NAME%") do echo   Size:  %%~zA bytes
echo.
pause
