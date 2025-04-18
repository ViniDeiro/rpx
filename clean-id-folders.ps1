Write-Host "Script para remover diretórios [id] em conflito com [userId]" -ForegroundColor Green

# Encontrar todos os diretórios [id]
$idDirs = Get-ChildItem -Path ".\src\app\api" -Filter "[id]" -Directory -Recurse

# Listar os diretórios encontrados
Write-Host "Diretórios [id] encontrados:" -ForegroundColor Yellow
$idDirs | ForEach-Object {
    Write-Host "- $($_.FullName)" -ForegroundColor Cyan
}

# Pedir confirmação para excluir
$confirmation = Read-Host "Deseja excluir esses diretórios? (S/N)"
if ($confirmation -eq 'S' -or $confirmation -eq 's') {
    # Excluir os diretórios
    $idDirs | ForEach-Object {
        Write-Host "Excluindo $($_.FullName)..." -ForegroundColor Magenta
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction Continue
    }
    Write-Host "Operação concluída!" -ForegroundColor Green
} else {
    Write-Host "Operação cancelada." -ForegroundColor Red
}

# Verificar novamente se os diretórios foram excluídos
$idDirsAfter = Get-ChildItem -Path ".\src\app\api" -Filter "[id]" -Directory -Recurse
if ($idDirsAfter.Count -eq 0) {
    Write-Host "Todos os diretórios [id] foram removidos com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Alguns diretórios [id] ainda existem:" -ForegroundColor Red
    $idDirsAfter | ForEach-Object {
        Write-Host "- $($_.FullName)" -ForegroundColor Red
    }
} 