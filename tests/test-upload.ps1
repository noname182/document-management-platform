# tests/test-upload.ps1
$Endpoint = "http://localhost:3001/documents/process"
$TestFile = Join-Path $PSScriptRoot "sample.pdf"

if (-not (Test-Path $TestFile)) {
    Write-Host "[ERROR] No se encontro sample.pdf en $PSScriptRoot" -ForegroundColor Red
    exit 1
}

Write-Host "==> Enviando documento de prueba a NestJS ($Endpoint)..." -ForegroundColor Cyan

# Ejecución profesional con cURL inspeccionando cuerpo de respuesta y código HTTP
curl.exe -X POST $Endpoint `
  -H "Accept: application/json" `
  -F "file=@$TestFile" `
  -w "`n`nCodigo HTTP: %{http_code}`nTiempo de respuesta: %{time_total}s`n"

Write-Host "==> Peticion finalizada." -ForegroundColor Green