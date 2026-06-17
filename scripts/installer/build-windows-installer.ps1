param(
  [string]$SuiteDir = (Resolve-Path "$PSScriptRoot\..\..").Path
)

$ErrorActionPreference = "Stop"

$releaseDir = Join-Path $SuiteDir "release"
$issPath = Join-Path $SuiteDir "scripts\installer\StanleySyncInstaller.iss"
$isccCandidates = @(
  "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
  "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
)
$iscc = $isccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

Write-Host "StanleySync Windows installer build"
Write-Host "Suite: $SuiteDir"
Write-Host ""

Set-Location $SuiteDir

Write-Host "Installing dependencies..."
npm.cmd install

Write-Host "Generating Prisma client..."
npm.cmd run db:generate

Write-Host "Validating Prisma schema..."
npm.cmd run prisma:validate

Write-Host "Building production app..."
npm.cmd run build:production

if (!(Test-Path $releaseDir)) {
  New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

if (!$iscc) {
  Write-Warning "Inno Setup 6 was not found. Install Inno Setup, then run this script again."
  Write-Host "Installer definition:"
  Write-Host "  $issPath"
  Write-Host "Expected output:"
  Write-Host "  $releaseDir\StanleySync-App-Setup.exe"
  exit 0
}

Write-Host "Compiling installer with Inno Setup..."
& $iscc $issPath

Write-Host ""
Write-Host "Installer created:"
Write-Host "  $releaseDir\StanleySync-App-Setup.exe"
