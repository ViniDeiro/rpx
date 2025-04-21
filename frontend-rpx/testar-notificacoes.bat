@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo             FERRAMENTA DE TESTE DE NOTIFICACOES RPX.GG
echo ================================================================
echo.

set NODE_PATH=node_modules

if not exist node_modules\mongodb (
  echo Instalando dependencias necessarias...
  call npm install mongodb dotenv
)

:menu
cls
echo ================================================================
echo             FERRAMENTA DE TESTE DE NOTIFICACOES RPX.GG
echo ================================================================
echo.
echo  [1] Criar convite de lobby manualmente
echo  [2] Listar convites pendentes de um usuario
echo  [3] Verificar notificacoes de um usuario
echo  [4] Copiar script de debug para o clipboard
echo  [5] Sobre o sistema de notificacoes
echo  [0] Sair
echo.
echo ================================================================
echo.

set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto criar_convite
if "%opcao%"=="2" goto listar_convites
if "%opcao%"=="3" goto verificar_notificacoes
if "%opcao%"=="4" goto copiar_script
if "%opcao%"=="5" goto sobre
if "%opcao%"=="0" goto fim

echo Opcao invalida!
timeout /t 2 >nul
goto menu

:criar_convite
cls
echo ================================================================
echo                CRIAR CONVITE DE LOBBY MANUALMENTE
echo ================================================================
echo.
echo Informe os IDs necessarios:
echo.
set /p lobbyId="ID do Lobby: "
set /p userId="ID do Usuario que convida: "
set /p recipientId="ID do Usuario convidado: "
echo.
echo Criando convite...
echo.
call node src/scripts/test-lobby-invite.js create %lobbyId% %userId% %recipientId%
echo.
pause
goto menu

:listar_convites
cls
echo ================================================================
echo                LISTAR CONVITES PENDENTES
echo ================================================================
echo.
set /p userId="ID do Usuario: "
echo.
echo Buscando convites pendentes...
echo.
call node src/scripts/test-lobby-invite.js list %userId%
echo.
pause
goto menu

:verificar_notificacoes
cls
echo ================================================================
echo                VERIFICAR NOTIFICACOES
echo ================================================================
echo.
set /p userId="ID do Usuario: "
echo.
echo Buscando notificacoes...
echo.
call node src/scripts/test-lobby-invite.js check %userId%
echo.
pause
goto menu

:copiar_script
cls
echo ================================================================
echo            COPIAR SCRIPT DE DEBUG PARA O CLIPBOARD
echo ================================================================
echo.
echo O script para debug no navegador sera copiado para sua area de transferencia.
echo Cole-o no console do desenvolvedor (F12) do navegador.
echo.
type src\scripts\debug-notifications.js | clip
echo Script copiado com sucesso!
echo.
echo Instrucoes:
echo 1. Abra o site RPX.GG e faca login
echo 2. Pressione F12 para abrir o console do desenvolvedor
echo 3. Cole o script no console e pressione Enter
echo 4. Use os comandos listados na documentacao para testar
echo.
pause
goto menu

:sobre
cls
echo ================================================================
echo                SOBRE O SISTEMA DE NOTIFICACOES
echo ================================================================
echo.
echo O sistema de notificacoes da RPX.GG inclui as seguintes funcionalidades:
echo.
echo 1. Notificacoes no aplicativo (bell icon)
echo 2. Convites para lobby
echo 3. Notificacoes push (opcional, se configurado)
echo.
echo Para mais informacoes, consulte a documentacao:
echo - frontend-rpx/docs/TESTE_NOTIFICACOES.md
echo - frontend-rpx/docs/NOTIFICATIONS.md
echo.
pause
goto menu

:fim
echo.
echo Encerrando a ferramenta de teste...
echo.
exit /b 0 