$url = "https://www.portalkorwil.online/api/admin/naik-kelas"
$headers = @{"x-api-key" = "temp-naik-kelas-bypass"}
$cursor = ""
$totalProcessed = 0
$totalNaik = 0
$totalAlumni = 0
$totalErrors = 0
$round = 0

do {
    $round++
    $uri = if ($cursor) { "$url?cursor=$cursor" } else { $url }
    Write-Host "[$round] Calling with cursor: $cursor"
    try {
        $r = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ContentType "application/json" -TimeoutSec 45
        Write-Host "  -> processed:$($r.processed) naik:$($r.naikKelas) alumni:$($r.jadiAlumni) err:$($r.errors) done:$($r.done)"
        $totalProcessed += $r.processed
        $totalNaik += $r.naikKelas
        $totalAlumni += $r.jadiAlumni
        $totalErrors += $r.errors
        $cursor = $r.nextCursor
        if ($r.done) { break }
    } catch {
        Write-Host "  -> Error: $_"
        break
    }
} while ($cursor)

Write-Host "=== SELESAI ==="
Write-Host "Total: $totalProcessed processed, $totalNaik naik, $totalAlumni alumni, $totalErrors error"
