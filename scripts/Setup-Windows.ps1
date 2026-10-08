$ErrorActionPreference = 'Stop'
$repoDir = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if (![Environment]::Is64BitOperatingSystem) { throw 'This setup needs 64-bit Windows.' }
$stateDir = Join-Path $repoDir '.demo'
$runtimeDir = Join-Path $stateDir 'tools'
$downloads = Join-Path $stateDir 'downloads'
$tempDir = Join-Path $stateDir 'tmp'
New-Item -ItemType Directory -Path $runtimeDir,$downloads,$tempDir -Force | Out-Null
$env:TEMP = $tempDir
$env:TMP = $tempDir
$env:npm_config_cache = Join-Path $stateDir 'npm-cache'
$env:npm_config_userconfig = Join-Path $stateDir 'npmrc'
$env:npm_config_globalconfig = Join-Path $stateDir 'npm-global.rc'
$env:npm_config_update_notifier = 'false'
$env:CI = 'true'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Find-Runtime($pattern, $relativeExe) {
  foreach ($folder in @($runtimeDir, (Join-Path (Split-Path $repoDir -Parent) 'tools'))) {
    if (Test-Path -LiteralPath $folder) {
      foreach ($item in (Get-ChildItem -LiteralPath $folder -Directory -Filter $pattern)) {
        if (Test-Path -LiteralPath (Join-Path $item.FullName $relativeExe)) { return $item.FullName }
      }
    }
  }
  return $null
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Get-ArchiveHash($file) {
  $stream = [IO.File]::OpenRead($file)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '') }
  finally { $stream.Dispose(); $algorithm.Dispose() }
}
function Get-VerifiedArchive($url, $file, $hash) {
  if (!(Test-Path -LiteralPath $file) -or (Get-ArchiveHash $file) -ne $hash) {
    Write-Output ('Downloading ' + [IO.Path]::GetFileName($file) + '. The first setup can take several minutes.')
    $client = New-Object Net.WebClient
    try { $client.DownloadFile($url, $file) } finally { $client.Dispose() }
  }
  if ((Get-ArchiveHash $file) -ne $hash) { throw 'Download verification failed. Run setup again.' }
}
$nodeDir = Find-Runtime 'node-*-win-x64' 'node.exe'
if (!$nodeDir) {
  $archive = Join-Path $downloads 'node-v22.23.3-win-x64.zip'
  Get-VerifiedArchive 'https://nodejs.org/dist/v22.23.3/node-v22.23.3-win-x64.zip' $archive '2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71'
  [IO.Compression.ZipFile]::ExtractToDirectory($archive, $runtimeDir)
  $nodeDir = Find-Runtime 'node-*-win-x64' 'node.exe'
  Remove-Item -LiteralPath $archive
}
$mongoDir = Find-Runtime 'mongodb-*' 'bin\mongod.exe'
if (!$mongoDir) {
  $archive = Join-Path $downloads 'mongodb-windows-x86_64-8.0.20.zip'
  Write-Output 'MongoDB download is about 800 MB. It is needed only once.'
  Get-VerifiedArchive 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.20.zip' $archive '7a98d3eb25f280d562d863f239f8956104bfa25a2391a61691cf8686830fc9de'
  $mongoDir = Join-Path $runtimeDir 'mongodb-8.0.20'
  New-Item -ItemType Directory -Path (Join-Path $mongoDir 'bin') -Force | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::OpenRead($archive)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName.EndsWith('/bin/mongod.exe') } | Select-Object -First 1
    if (!$entry) { throw 'MongoDB archive is missing its server executable.' }
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $mongoDir 'bin\mongod.exe'), $true)
    foreach ($license in ($zip.Entries | Where-Object { $_.Name -match '^(LICENSE|THIRD-PARTY)' -and $_.Length -gt 0 })) {
      [IO.Compression.ZipFileExtensions]::ExtractToFile($license, (Join-Path $mongoDir $license.Name), $true)
    }
  } finally { $zip.Dispose() }
  Remove-Item -LiteralPath $archive
}
# Keep required Visual C++ runtime libraries next to mongod.exe; no system installation.
$cppLibraries = @('msvcp140.dll','msvcp140_1.dll','msvcp140_2.dll','msvcp140_atomic_wait.dll','msvcp140_codecvt_ids.dll','vcruntime140.dll','vcruntime140_1.dll','concrt140.dll')
$missingCpp = @($cppLibraries | Where-Object { !(Test-Path -LiteralPath (Join-Path (Join-Path $mongoDir 'bin') $_)) })
if ($missingCpp.Count) {
  $package = Join-Path $downloads 'Microsoft.VCLibs.x64.14.00.Desktop.appx'
  Get-VerifiedArchive 'https://download.microsoft.com/download/4/7/c/47c6134b-d61f-4024-83bd-b9c9ea951c25/Microsoft.VCLibs.x64.14.00.Desktop.appx' $package 'b56a9101f706f9d95f815f5b7fa6efbac972e86573d378b96a07cff5540c5961'
  $zip = [IO.Compression.ZipFile]::OpenRead($package)
  try {
    foreach ($name in $cppLibraries) {
      $entry = $zip.GetEntry($name)
      if (!$entry) { throw ('Microsoft runtime package is missing ' + $name) }
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path (Join-Path $mongoDir 'bin') $name), $true)
    }
  } finally { $zip.Dispose() }
}
if (!$nodeDir -or !(Test-Path -LiteralPath (Join-Path $mongoDir 'bin\mongod.exe'))) { throw 'Portable runtimes are missing. Run setup again.' }
$nodeExe = Join-Path $nodeDir 'node.exe'
$npmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'
$env:PATH = $nodeDir + ';' + $env:PATH
Push-Location $repoDir
try {
  & $nodeExe $npmCli run setup
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check the error above; rerun setup after fixing it.' }
  & $nodeExe (Join-Path $repoDir 'scripts\init-demo.js')
  if ($LASTEXITCODE -ne 0) { throw 'Configuration setup failed.' }
} finally { Pop-Location }
Write-Output 'SETUP COMPLETE. Next run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-Demo.ps1'
