<#
.SYNOPSIS
  Rebuild the slide 13 phone embed from the vendored web app source.

.DESCRIPTION
  Builds ./web-src (a committed snapshot of the SOB donation web app) and copies
  the produced dist into ./web-dist, which the Vite plugin serves at /phone-app/.

  Everything stays inside this folder/repo — nothing reaches into the top-level
  ../../../../../../../web folder. Anyone who opens this repo can refresh the
  embed by running this script.

  Supabase credentials (so donations persist + the big globe live-syncs) are read
  from the presentation's .env.local if present, or from the VITE_SUPABASE_URL /
  VITE_SUPABASE_ANON_KEY environment variables, or from -SupabaseUrl / -AnonKey.

.EXAMPLE
  ./build.ps1
.EXAMPLE
  ./build.ps1 -SupabaseUrl "https://xxx.supabase.co" -AnonKey "eyJ..."
#>
param(
  [string]$SupabaseUrl,
  [string]$AnonKey
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$webSrc = Join-Path $here "web-src"
$webDist = Join-Path $here "web-dist"
# embed -> slide_13 -> slides -> components -> src -> presentation
$presentationEnv = Join-Path $here "..\..\..\..\..\.env.local"

function Get-EnvFileValue($path, $key) {
  if (-not (Test-Path $path)) { return $null }
  foreach ($line in Get-Content $path) {
    if ($line -match "^\s*$([regex]::Escape($key))\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim()
    }
  }
  return $null
}

if (-not $SupabaseUrl) { $SupabaseUrl = $env:VITE_SUPABASE_URL }
if (-not $AnonKey) { $AnonKey = $env:VITE_SUPABASE_ANON_KEY }
if (-not $SupabaseUrl) { $SupabaseUrl = Get-EnvFileValue $presentationEnv "VITE_SUPABASE_URL" }
if (-not $AnonKey) { $AnonKey = Get-EnvFileValue $presentationEnv "VITE_SUPABASE_ANON_KEY" }

if ($SupabaseUrl -and $AnonKey) {
  $env:VITE_SUPABASE_URL = $SupabaseUrl
  $env:VITE_SUPABASE_ANON_KEY = $AnonKey
  Write-Host "Building with Supabase credentials (live sync enabled)." -ForegroundColor Green
} else {
  Write-Warning "No Supabase credentials found — the embed will build without live sync."
}

Push-Location $webSrc
try {
  if (-not (Test-Path (Join-Path $webSrc "node_modules"))) {
    Write-Host "Installing web-src dependencies..." -ForegroundColor Cyan
    npm install
  }
  Write-Host "Building web-src..." -ForegroundColor Cyan
  npx vite build
} finally {
  Pop-Location
}

Write-Host "Replacing web-dist snapshot..." -ForegroundColor Cyan
if (Test-Path $webDist) { Remove-Item $webDist -Recurse -Force }
$null = robocopy (Join-Path $webSrc "dist") $webDist /E /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

Write-Host "Done. Phone embed refreshed at /phone-app/." -ForegroundColor Green
