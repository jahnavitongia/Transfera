$ErrorActionPreference = 'Stop'
$repoDir = Split-Path $PSScriptRoot -Parent
$projectDir = Split-Path $repoDir -Parent
$runtimeDir = Join-Path $projectDir 'tools'
$nodeDir = Get-ChildItem -LiteralPath $runtimeDir -Directory -Filter 'node-*-win-x64' | Select-Object -First 1
$mongoDir = Get-ChildItem -LiteralPath $runtimeDir -Directory -Filter 'mongodb-*' | Select-Object -First 1
if (!$nodeDir -or !$mongoDir) { throw 'Portable Node/MongoDB are missing. See README.md for standard setup.' }
$nodeExe = Join-Path $nodeDir.FullName 'node.exe'
$mongoExe = Join-Path $mongoDir.FullName 'bin\mongod.exe'
$stateDir = Join-Path $repoDir '.demo'
$dataDir = Join-Path $stateDir 'database'
$tempDir = Join-Path $stateDir 'tmp'
New-Item -ItemType Directory -Path $dataDir,$tempDir -Force | Out-Null
$env:TEMP = $tempDir
$env:TMP = $tempDir
$env:PATH = $nodeDir.FullName + ';' + $env:PATH
$env:npm_config_cache = Join-Path $projectDir '.npm-cache'
$pidFile = Join-Path $stateDir 'processes.json'
if (Test-Path -LiteralPath $pidFile) {
  $running = @(Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json | Where-Object {
    $process = Get-Process -Id $_.id -ErrorAction SilentlyContinue
    $process -and $process.Path -eq $_.path -and $process.StartTime.ToUniversalTime().ToString('o') -eq $_.started
  })
  if ($running.Count) { throw 'Demo processes are already running. Use scripts/Stop-Demo.ps1 before restarting.' }
}
if (!(Test-Path -LiteralPath (Join-Path $repoDir 'backend\.env'))) { throw 'Configure backend/.env first.' }
$started = @()
function Start-DemoProcess($name, $exe, $arguments, $directory) {
  $process = Start-Process -FilePath $exe -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $stateDir ($name + '.stdout.log')) -RedirectStandardError (Join-Path $stateDir ($name + '.stderr.log'))
  return @{ id=$process.Id; path=$exe; started=$process.StartTime.ToUniversalTime().ToString('o'); name=$name }
}
try {
  $started += Start-DemoProcess 'database' $mongoExe @('--dbpath', ('"' + $dataDir + '"'), '--logpath', ('"' + (Join-Path $stateDir 'mongodb.log') + '"'), '--logappend', '--bind_ip', '127.0.0.1', '--port', '27018') $repoDir
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    $socket = New-Object System.Net.Sockets.TcpClient
    try { $socket.Connect('127.0.0.1',27018); $ready=$true; break } catch { Start-Sleep -Milliseconds 250 } finally { $socket.Dispose() }
  }
  if (!$ready) { throw 'Local MongoDB did not start. Check .demo/mongodb.log.' }
  & $nodeExe (Join-Path $repoDir 'backend\scripts\seed.js')
  if ($LASTEXITCODE -ne 0) { throw 'Sample data setup failed.' }
  $started += Start-DemoProcess 'backend' $nodeExe @('server.js') (Join-Path $repoDir 'backend')
  $started += Start-DemoProcess 'frontend' $nodeExe @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort') (Join-Path $repoDir 'frontend')
  $started | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8
  Write-Output 'Demo started: http://localhost:5173'
  Write-Output 'Accounts: admin@transfera.demo, staff@transfera.demo, student@transfera.demo'
  Write-Output 'Password: TransferaDemo123!'
} catch {
  foreach ($entry in $started) { Stop-Process -Id $entry.id -ErrorAction SilentlyContinue }
  throw
}
