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
        $status = $status.Trim()
        
        if ($status) {
            $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
            $commitMsg = "auto: update $ts"
            git commit -m $commitMsg 2>&1 | Out-Null
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] git commit failed, skipping push"
            } else {
                git fetch origin main 2>&1 | Out-Null
                git push origin main 2>&1 | Write-Host
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "[WARN] push failed - trying pull --rebase + push..."
                    git pull --rebase origin main --autostash 2>&1 | Write-Host
                    git push origin main 2>&1 | Write-Host
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Rebased and pushed successfully"
                    } else {
                        Write-Host "[ERROR] push still failed after rebase - merge conflict possible"
                    }
                } else {
                    Write-Host "Committed and pushed successfully"
                }
            }
        }
        
        $lastWrite = Get-Date
    }
    
    Start-Sleep -Seconds 3
}
