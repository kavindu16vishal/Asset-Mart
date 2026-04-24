# Build a shareable zip for GitHub (no node_modules, .git, local DB, caches).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/create-github-upload-zip.ps1
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
# Output next to the repo; change $zipBaseName / $stageName for new releases.
$zipBaseName = "Saranga V7"
$outZip = Join-Path $root "$zipBaseName.zip"
# Single top-level folder inside the zip when extracted.
$stageName = "Saranga-V7"
$tmpRoot = $env:TEMP
$stage = Join-Path $tmpRoot $stageName
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$robocopyArgs = @(
  $root, $stage, "/E",
  "/XD", ".git", "node_modules", "dist", ".vite", "uploads", "__pycache__", ".cursor", ".idea", ".vscode"
)
& robocopy @robocopyArgs /XF "database.sqlite" ".env" ".DS_Store" "Thumbs.db" 2>&1 | Out-Null
$rc = $LASTEXITCODE
if ($rc -ge 8) { throw "Robocopy failed with exit code $rc" }

if (Test-Path $outZip) { Remove-Item $outZip -Force }
Compress-Archive -Path $stage -DestinationPath $outZip -Force
Remove-Item $stage -Recurse -Force
Write-Host "Created: $outZip" -ForegroundColor Green
try { Get-Item $outZip | Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}} } catch {}
