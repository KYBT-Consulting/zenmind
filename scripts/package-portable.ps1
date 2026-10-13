param (
    [string]$Version = "0.1.2"
)

$ErrorActionPreference = "Stop"

Write-Host "Building ZenMind desktop binary for portable package..." -ForegroundColor Cyan
npm run build
npm run tauri build -- --no-bundle

$exeSource = "src-tauri/target/release/zenmind.exe"
if (-not (Test-Path $exeSource)) {
    $found = Get-ChildItem -Path "src-tauri/target/release" -Filter "*.exe" -Recurse | Where-Object { $_.Name -match "zenmind|ZenMind" } | Select-Object -First 1
    if ($found) {
        $exeSource = $found.FullName
    } else {
        throw "Could not locate compiled zenmind.exe in src-tauri/target/release."
    }
}

$outputDir = "dist-portable/ZenMind-v$Version-windows-portable-x64"
if (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
New-Item -ItemType Directory -Path "$outputDir/data" -Force | Out-Null
New-Item -ItemType File -Path "$outputDir/.portable" -Force | Out-Null

Copy-Item $exeSource -Destination "$outputDir/ZenMind.exe" -Force
Copy-Item "README.md" -Destination "$outputDir/README.md" -Force
Copy-Item "LICENSE" -Destination "$outputDir/LICENSE" -Force

$zipPath = "dist-portable/ZenMind-v$Version-windows-x64-portable.zip"
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}
Compress-Archive -Path "$outputDir/*" -DestinationPath $zipPath -Force

Write-Host "ZenMind portable ZIP created successfully:" -ForegroundColor Green
Write-Host "  Folder:  $outputDir" -ForegroundColor Green
Write-Host "  Archive: $zipPath" -ForegroundColor Green
