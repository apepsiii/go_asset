@echo off
setlocal

echo ========================================================
echo   LabAsset Manager - Build All Platforms
echo ========================================================
echo.

cd /d "%~dp0.."

REM Load version from .env
set MAJOR=1
set MINOR=0

if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if "%%a"=="APP_VERSION_MAJOR" set MAJOR=%%b
        if "%%a"=="APP_VERSION_MINOR" set MINOR=%%b
    )
)

REM Get date
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "DT=%%a"
set DATE=%DT:~2,2%%DT:~5,2%%DT:~8,2%

echo Version: %MAJOR%.%MINOR%
echo Date: %DATE%
echo.

REM Create deploy dir
if not exist "deploy" mkdir deploy

REM Check React build
if not exist "web\dist" (
    echo ERROR: web\dist not found!
    echo Run 'npm run build' in web folder first.
    pause
    exit /b 1
)

echo [1/4] Preparing embedded files...
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
if exist "cmd\server\migrations" rmdir /s /q "cmd\server\migrations"
xcopy /s /e /i "web\dist" "cmd\server\dist" >nul
xcopy /s /e /i "migrations" "cmd\server\migrations" >nul
echo      OK

echo [2/4] Building Linux AMD64...
go build -ldflags="-s -w" -o "deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64" ./cmd/server
echo      Done: deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_linux_amd64

echo [3/4] Building Linux ARM64...
set GOOS=linux
set GOARCH=arm64
set CGO_ENABLED=0
go build -ldflags="-s -w" -o "deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64" ./cmd/server
set GOOS=
set GOARCH=
set CGO_ENABLED=
echo      Done: deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_linux_arm64

echo [4/4] Building Windows AMD64...
go build -ldflags="-s -w" -o "deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe" ./cmd/server
echo      Done: deploy\lab_asset_v%MAJOR%_%MINOR%_%DATE%_windows_amd64.exe

REM Cleanup
if exist "cmd\server\dist" rmdir /s /q "cmd\server\dist"
if exist "cmd\server\migrations" rmdir /s /q "cmd\server\migrations"

echo.
echo ========================================================
echo   Build Complete!
echo ========================================================
echo.
echo Output files in deploy folder:
dir /b deploy\lab_asset_v* 2>nul || echo   (none found)
echo.
pause
