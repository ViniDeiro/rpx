@echo off
echo Iniciando o aplicativo RPX...

:: Verifica se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: npm não está instalado. Instale o Node.js e tente novamente.
    exit /b 1
)

:: Inicia o backend
start cmd /k "cd %~dp0 && npm run dev"

:: Aguarda um momento para o backend iniciar
timeout /t 3 /nobreak > nul

:: Inicia o frontend
start cmd /k "cd %~dp0frontend-rpx && npm run dev"

echo Aplicativo RPX iniciado com sucesso!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000

exit /b 0 