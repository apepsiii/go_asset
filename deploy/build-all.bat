@echo off
REM ============================================================
REM LabAsset Manager - Build for All Platforms (Windows)
REM ============================================================

setlocal

echo ========================================================
echo   LabAsset Manager - Build All Platforms
echo ========================================================
echo.

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

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "DT=%%a"
set DATE=%DT:~2,2%%DT:~5,2%%DT:~8,2%

echo Version: %MAJOR%.%MINOR%
echo Date:    %DATE%
echo.

REM Check React build
if not exist "web\dist" (
    echo ERROR: web\dist not found!
    echo Please run 'npm run build' in web folder first.
    pause
    exit /b 1
)

echo [1/3] Preparing embedded files...
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
if exist "cmd\server\migrations" rmdir /s /q "cmd\server\migrations"
xcopy /s /e /i "web\dist" "cmd\server\dist" >nul
xcopy /s /e /i "migrations" "cmd\server\migrations" >nul
echo   OK

echo [2/3] Building binaries...

echo   Building Linux AMD64...
go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64" ./cmd/server

echo   Building Linux ARM64...
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64" ./cmd/server

echo   Building Windows AMD64...
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "go_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe" ./cmd/server

echo [3/3] Cleaning up...
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
if exist "cmd\server\migrations" rmdir /s /q "cmd\server\migrations"
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
