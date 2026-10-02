$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4190
$running = $false
try {
    $info = Invoke-RestMethod -Uri "http://127.0.0.1:$port/package.json" -TimeoutSec 1
    $running = $info.name -eq 'gangho-first-steps' -and $info.version -eq '2.1.0'
} catch { $running = $false }
if (-not $running) {
    $previousPort = $env:PORT
    try {
        $env:PORT = [string]$port
        $server = Start-Process -FilePath 'node.exe' -ArgumentList 'serve.mjs' -WorkingDirectory $gameRoot -WindowStyle Hidden -PassThru
    } finally { $env:PORT = $previousPort }
    $deadline = (Get-Date).AddSeconds(20)
    while (-not $running) {
        if ($server.HasExited -or (Get-Date) -gt $deadline) { throw '게임 서버를 시작하지 못했습니다. 포트 4190을 확인해 주세요.' }
        Start-Sleep -Milliseconds 250
        try {
            $info = Invoke-RestMethod -Uri "http://127.0.0.1:$port/package.json" -TimeoutSec 1
            $running = $info.name -eq 'gangho-first-steps' -and $info.version -eq '2.1.0'
        } catch { $running = $false }
    }
}
Start-Process "http://127.0.0.1:$port/"
