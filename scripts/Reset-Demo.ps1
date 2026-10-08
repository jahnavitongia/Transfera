param([switch]$Preview)
$ErrorActionPreference = 'Stop'
$repoDir = Split-Path $PSScriptRoot -Parent
$nodeDir = $null
foreach ($runtimeDir in @((Join-Path $repoDir '.demo\tools'), (Join-Path (Split-Path $repoDir -Parent) 'tools'))) {
  if (Test-Path -LiteralPath $runtimeDir) { $nodeDir = Get-ChildItem -LiteralPath $runtimeDir -Directory -Filter 'node-*-win-x64' | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') } | Select-Object -First 1 }
  if ($nodeDir) { break }
}
if (!$nodeDir) { throw 'Run Setup-Windows.ps1 first.' }
$mode = if ($Preview) { '--preview' } else { '--reset-demo' }
& (Join-Path $nodeDir.FullName 'node.exe') (Join-Path $repoDir 'backend\scripts\reset-demo.js') $mode
if ($LASTEXITCODE -ne 0) { throw 'Demo reset failed. Share the error text with the team.' }
