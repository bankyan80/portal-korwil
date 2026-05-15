$excelDir = "C:\Users\Bank Yan\Downloads\data_sekolah\data_siswa"
$scriptPath = "C:\Users\Bank Yan\portal-dinas\scripts\sync-from-excel.mjs"

# Mapping nama file -> nama sekolah kanonikal + jenjang
$map = @{
  "SD NEGERI 1 BELAWA KECAMATAN LEMAHABANG" = @("SD NEGERI 1 BELAWA", "SD")
  "SD NEGERI 1 CIPEUJEUH KULON KECAMATAN LEMAHABANG" = @("SD NEGERI 1 CIPEUJEUH KULON", "SD")
  "SD NEGERI 1 CIPEUJEUH WETAN KECAMATAN LEMAHABANG" = @("SD NEGERI 1 CIPEUJEUH WETAN", "SD")
  "SD NEGERI 1 LEMAHABANG KECAMATAN LEMAHABANG" = @("SD NEGERI 1 LEMAHABANG", "SD")
  "SD NEGERI 1 LEMAHABANG KULON KECAMATAN LEMAHABANG" = @("SD NEGERI 1 LEMAHABANG KULON", "SD")
  "SD NEGERI 1 LEUWIDINGDING KECAMATAN LEMAHABANG" = @("SD NEGERI 1 LEUWIDINGDING", "SD")
  "SD NEGERI 1 PICUNGPUGUR KECAMATAN LEMAHABANG" = @("SD NEGERI 1 PICUNGPUGUR", "SD")
  "SD NEGERI 1 SARAJAYA KECAMATAN LEMAHABANG" = @("SD NEGERI 1 SARAJAYA", "SD")
  "SD NEGERI 1 SIGONG KECAMATAN LEMAHABANG" = @("SD NEGERI 1 SIGONG", "SD")
  "SD NEGERI 1 SINDANGLAUT KECAMATAN LEMAHABANG" = @("SD NEGERI 1 SINDANGLAUT", "SD")
  "SD NEGERI 1 TUK KARANGSUWUNG KECAMATAN LEMAHABANG" = @("SD NEGERI 1 TUK KARANGSUWUNG", "SD")
  "SD NEGERI 1 WANGKELANG KECAMATAN LEMAHABANG" = @("SD NEGERI 1 WANGKELANG", "SD")
  "SD NEGERI 2 BELAWA KECAMATAN LEMAHABANG" = @("SD NEGERI 2 BELAWA", "SD")
  "SD NEGERI 2 CIPEUJEUH KULON KECAMATAN LEMAHABANG" = @("SD NEGERI 2 CIPEUJEUH KULON", "SD")
  "SD NEGERI 2 CIPEUJEUH WETAN KECAMATAN LEMAHABANG" = @("SD NEGERI 2 CIPEUJEUH WETAN", "SD")
  "SD NEGERI 2 LEMAHABANG KECAMATAN LEMAHABANG" = @("SD NEGERI 2 LEMAHABANG", "SD")
  "SD NEGERI 2 SARAJAYA KECAMATAN LEMAHABANG" = @("SD NEGERI 2 SARAJAYA", "SD")
  "SD NEGERI 3 CIPEUJEUH WETAN KECAMATAN LEMAHABANG" = @("SD NEGERI 3 CIPEUJEUH WETAN", "SD")
  "SD NEGERI 4 SIGONG KECAMATAN LEMAHABANG" = @("SD NEGERI 4 SIGONG", "SD")
  "SDN 3 SIGONG" = @("SD NEGERI 3 SIGONG", "SD")
  "SD IT AL IRSYAD AL ISLAMIYYAH" = @("SD IT AL IRSYAD AL ISLAMIYYAH", "SD")
  "TK NEGERI LEMAHABANG" = @("TK NEGERI LEMAHABANG", "TK")
  "TK AISYIYAH LEMAHABANG" = @("TK AISYIYAH LEMAHABANG", "TK")
  "TK AL-IRSYAD AL-ISLAMIYYAH" = @("TK AL-IRSYAD AL-ISLAMIYYAH", "TK")
  "TK BPP KENANGA" = @("TK BPP KENANGA", "TK")
  "TK GELATIK" = @("TK GELATIK", "TK")
  "TK MELATI" = @("TK MELATI", "TK")
  "TK MUSLIMAT NU" = @("TK MUSLIMAT NU", "TK")
  "KB AH PLUS" = @("KB A.H. PLUS", "KB")
  "KB AMALIA SALSABILA" = @("KB AMALIA SALSABILA", "KB")
  "KB AZ-ZAHRA" = @("KB AZ-ZAHRA", "KB")
  "KB PALAPA" = @("KB PALAPA", "KB")
  "PAUD AL-HUSNA" = @("PAUD AL-HUSNA", "KB")
  "PAUD AMANAH" = @("PAUD AMANAH", "KB")
  "PAUD AN NAIM" = @("PAUD AN NAIM", "KB")
  "PAUD ASY - SYAFIIYAH" = @("PAUD ASY-SYAFIIYAH", "KB")
  "PAUD BUDGENVIL" = @("PAUD BUDGENVIL", "KB")
  "PAUD SPS MELATI" = @("PAUD SPS MELATI", "KB")
  "PAUD TUNAS HARAPAN" = @("PAUD TUNAS HARAPAN", "KB")
}

# Special case for the differently-named file
$specialMap = @{
  "DAFTAR PD 12052026 - SDN 3 SIGONG" = @("SD NEGERI 3 SIGONG", "SD")
}

$total = 0
Get-ChildItem -LiteralPath $excelDir -Filter *.xlsx | ForEach-Object {
  $file = $_
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  
  # Check special map first
  $info = $null
  if ($specialMap.ContainsKey($baseName)) {
    $info = $specialMap[$baseName]
  } else {
    # Extract school name from pattern: daftar_pd-{SCHOOL}-{DATE}
    if ($baseName -match "^daftar_pd-(.+?)-\d{4}-\d{2}-\d{2}") {
      $schoolNameFromFile = $matches[1]
      if ($map.ContainsKey($schoolNameFromFile)) {
        $info = $map[$schoolNameFromFile]
      }
    }
  }
  
  if ($info) {
    $canonicalName = $info[0]
    $jenjang = $info[1]
    Write-Host "Memproses: $canonicalName ($jenjang)..."
    node $scriptPath "`"$($file.FullName)`"" "$canonicalName" $jenjang
    if ($?) { $total++ }
    Write-Host ""
  } else {
    Write-Host "WARNING: Tidak bisa mapping: $baseName" -ForegroundColor Yellow
  }
}

Write-Host "Selesai! $total file berhasil diproses."
