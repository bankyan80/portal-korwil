$watchPath = Get-Location
$lastWrite = (Get-Date).AddSeconds(-5)

Write-Host "Watching for changes in $watchPath..."
Write-Host "Press Ctrl+C to stop."

while ($true) {
    $changes = Get-ChildItem -Recurse -File -Exclude "*.lock","*.log","node_modules",".next",".git" | Where-Object { $_.LastWriteTime -gt $lastWrite }
    
    if ($changes.Count -gt 0) {
        Write-Host "Changes detected at $(Get-Date -Format 'HH:mm:ss')"
        
        git add -A
        $status = git status --porcelain
        
        if ($status) {
            git commit -m "auto: update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            if ($?) {
                git push origin main
                Write-Host "Committed and pushed successfully"
            }
        }
        
        $lastWrite = Get-Date
    }
    
    Start-Sleep -Seconds 3
}
