$root = 'C:\Users\Kavindu Vishal\Downloads\Asset Mart'
$zipName = 'Asset_Mart_Github_Upload.zip'
$zipPath = Join-Path $root $zipName
$tempDir = Join-Path $root 'github_zip_temp'

Write-Host "Creating clean zip for Github..."

if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# List of things to exclude from root copy
$excludeList = @('node_modules', '*.zip', 'github_zip_temp', '.git', '.gemini')

Get-ChildItem -Path $root | ForEach-Object {
    $item = $_
    $skip = $false
    foreach ($p in $excludeList) {
        if ($item.Name -like $p) {
            $skip = $true
            break
        }
    }
    
    if (-not $skip) {
        Write-Host "Copying $($item.Name)..."
        Copy-Item -Path $item.FullName -Destination $tempDir -Recurse -Force
    }
}

# Clean backend folder specifically
$backendTemp = Join-Path $tempDir 'backend'
if (Test-Path $backendTemp) {
    Write-Host "Cleaning backend folder in temp..."
    $backendExcludes = @('node_modules', '.env', 'database.sqlite', 'uploads')
    foreach ($ex in $backendExcludes) {
        $exPath = Join-Path $backendTemp $ex
        if (Test-Path $exPath) {
            Write-Host "Removing $exPath..."
            Remove-Item -Path $exPath -Recurse -Force
        }
    }
}

if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }

Write-Host "Compressing files..."
# We use -Path "$tempDir\*" to include all contents without the parent folder name
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath

Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Zip created successfully: $zipPath"
