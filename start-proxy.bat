@echo off
echo Installing proxy server dependencies...
cd /d "%~dp0"
npm install --prefix . express cors node-fetch@2.6.7

echo.
echo Starting proxy server...
node proxy-server.js