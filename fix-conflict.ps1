# Script para remover o diretório [userId] que está causando conflito
Write-Host "Removendo diretório [userId] para resolver conflito com [id]" -ForegroundColor Green

try {
    # Caminho para o diretório problemático
    $dirPath = ".\frontend-rpx\src\app\api\users\[userId]"
    
    # Verificar se o diretório existe
    if (Test-Path $dirPath) {
        # Listar o conteúdo para diagnóstico
        Write-Host "Conteúdo do diretório a ser removido:"
        Get-ChildItem -Path $dirPath -Recurse | ForEach-Object {
            Write-Host "- $($_.FullName)" -ForegroundColor Yellow
        }
        
        # Tentar remover o diretório
        Remove-Item -Path $dirPath -Recurse -Force -ErrorAction Stop
        Write-Host "Diretório removido com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Diretório não encontrado: $dirPath" -ForegroundColor Yellow
    }
    
    # Verificar se foi removido
    if (!(Test-Path $dirPath)) {
        Write-Host "Confirmado: O diretório não existe mais." -ForegroundColor Green
    } else {
        Write-Host "AVISO: O diretório ainda existe!" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao remover diretório: $_" -ForegroundColor Red
} 