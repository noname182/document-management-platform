# tests/test-upload.ps1
$CoreApiUrl     = "http://localhost:8000/api/v1"
$ProcessorUrl   = "http://localhost:3001/documents/process"
$TestFile       = Join-Path $PSScriptRoot "sample.pdf"

if (-not (Test-Path $TestFile)) {
    Write-Host "[ERROR] No se encontro sample.pdf en $PSScriptRoot" -ForegroundColor Red
    exit 1
}

# 1. Login en Core API como Cirujano de la Clínica para obtener token
Write-Host "==> 1. Autenticando en Core API (Laravel)..." -ForegroundColor Cyan
$loginPayload = @{
    email    = "carlos.mendoza.cir@gmail.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$CoreApiUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$Token = $loginResponse.data.access_token

# 2. Consultar el documento a actualizar
Write-Host "==> 2. Obteniendo documento para versionar..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $Token"
    Accept        = "application/json"
}
$docsResponse = Invoke-RestMethod -Uri "$CoreApiUrl/documents" -Method Get -Headers $headers
$DocumentId   = $docsResponse.data.data[0].id
Write-Host "    Documento seleccionado: $DocumentId" -ForegroundColor Yellow

# 3. Check-out (Bloqueo pesimista previo a la subida)
Write-Host "==> 3. Adquiriendo candado (Check-out)..." -ForegroundColor Cyan
$checkoutPayload = @{ reason = "Subiendo nueva version firmada" } | ConvertTo-Json
Invoke-RestMethod -Uri "$CoreApiUrl/documents/$DocumentId/checkout" -Method Post -Headers $headers -Body $checkoutPayload -ContentType "application/json" | Out-Null
Write-Host "    Candado adquirido con exito." -ForegroundColor Green

# 4. Enviar binario a NestJS (doc-processor)
Write-Host "==> 4. Transmitiendo archivo a NestJS (doc-processor)..." -ForegroundColor Cyan
$uploadRaw = curl.exe -s -X POST $ProcessorUrl -F "file=@$TestFile"
$uploadJson = $uploadRaw | ConvertFrom-Json

if ($uploadJson.status -ne "success") {
    Write-Host "[ERROR] Fallo el procesamiento en NestJS: $uploadRaw" -ForegroundColor Red
    exit 1
}

$hashSha256 = $uploadJson.data.hashSha256
$storageKey = $uploadJson.data.storageLocation
$mimeType   = $uploadJson.data.mimeType
$fileSize   = (Get-Item $TestFile).Length

Write-Host "    Hash SHA-256 calculado en vuelo: $hashSha256" -ForegroundColor Green

# 5. Check-in en Laravel (Registrar version en BD y liberar candado)
Write-Host "==> 5. Ejecutando Check-in en Core API para consolidar version..." -ForegroundColor Cyan
$checkinPayload = @{
    storage_key       = $storageKey
    storage_bucket    = "documents-vault"
    original_filename = "sample.pdf"
    mime_type         = $mimeType
    file_size_bytes   = $fileSize
    sha256_hash       = $hashSha256
    change_summary    = "Nueva version generada desde script de pruebas"
} | ConvertTo-Json

$checkinResponse = Invoke-RestMethod -Uri "$CoreApiUrl/documents/$DocumentId/checkin" -Method Post -Headers $headers -Body $checkinPayload -ContentType "application/json"

Write-Host "==> Proceso completado exitosamente!" -ForegroundColor Green
$checkinResponse | ConvertTo-Json -Depth 4