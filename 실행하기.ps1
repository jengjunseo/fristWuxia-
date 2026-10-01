$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173
$running = $false
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -TimeoutSec 2 -UseBasicParsing
    $running = $response.StatusCode -eq 200
} catch { $running = $false }
if (-not $running) {
    Start-Process -FilePath 'node.exe' -ArgumentList 'serve.mjs' -WorkingDirectory $gameRoot -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 1
}
Start-Process "http://127.0.0.1:$port/"
