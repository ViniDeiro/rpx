@echo off
echo Reiniciando o servidor...

:: Encontrar e encerrar todos os processos node.js
echo Encerrando processos Node.js existentes...
taskkill /F /IM node.exe /T

:: Aguardar um momento
timeout /t 2 /nobreak > nul

:: Iniciar o servidor novamente (ajuste o comando conforme necessário)
echo Iniciando o servidor novamente...
start cmd.exe /k "npm run dev"

:: Abrir o navegador no endereço do servidor
timeout /t 5 /nobreak > nul
start http://localhost:3000/admin/login

echo Servidor reiniciado com sucesso! 