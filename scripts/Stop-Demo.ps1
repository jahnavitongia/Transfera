$ErrorActionPreference = 'Stop'
$repoDir = Split-Path $PSScriptRoot -Parent
$pidFile = Join-Path $repoDir '.demo\processes.json'
if (!(Test-Path -LiteralPath $pidFile)) { Write-Output 'No recorded demo processes.'; exit }
$entries = @(Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json)
foreach ($entry in ($entries | Sort-Object { if ($_.name -eq 'database') { 1 } else { 0 } })) {
  $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
  if ($process -and $process.Path -eq $entry.path -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.started) {
    Stop-Process -Id $entry.id
    Write-Output ('Stopped ' + $entry.name)
  }
}
Remove-Item -LiteralPath $pidFile
