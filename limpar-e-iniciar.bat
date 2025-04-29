@echo off
echo Limpando o cache e arquivos temporários do Next.js...

:: Entrar na pasta do frontend
cd frontend-rpx

:: Limpar cache do Next.js
echo Removendo pasta .next...
if exist .next (
  rmdir /s /q .next
)

:: Remover arquivos de lock
if exist .lock (
  del /f /q .lock
)

:: Limpar módulos problemáticos (opcional)
echo Reinstalando dependências (isso pode levar alguns minutos)...
call npm install

:: Adicionar configurações de ambiente otimizadas para resolver o erro de ReplicaSetNoPrimary
echo Criando arquivo .env.local com configurações otimizadas...
(
  echo # Configurações para resolver problemas de conexão MongoDB
  echo NODE_ENV=development
  echo MONGODB_URI=mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?readPreference=primaryPreferred^&retryWrites=true^&retryReads=true^&w=majority
  echo.
  echo # Aumentar timeout para MongoDB
  echo MONGODB_CONNECTION_TIMEOUT=15000
  echo.
  echo # URLs de API
  echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
  echo API_URL=http://localhost:3001/api  
) > .env.local

echo.
echo Iniciando o servidor Next.js...
echo.
echo A aplicação deve iniciar em breve. Se ocorrer algum erro, verifique:
echo 1. Sua conexão com a internet
echo 2. Se o cluster do MongoDB Atlas está ativo
echo 3. Se seu IP está na whitelist do MongoDB Atlas
echo.

:: Iniciar o servidor
call npm run dev

pause 