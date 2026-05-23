#!/bin/bash

URL="https://www.portalkorwil.online/"

echo "====================================================="
echo "Mulai Audit Website: $URL"
echo "====================================================="

# 1. Install/Update Tools yang diperlukan
echo "[*] Memeriksa dan menginstal tools audit..."
npm install -g lighthouse broken-link-checker

# 2. Audit Performa, Aksesibilitas, & SEO
echo -e "\n[*] Menjalankan Google Lighthouse..."
lighthouse $URL --view --chrome-flags="--headless" --preset=desktop

# 3. Audit Semua Link Berbahaya / Rusak sampai ke akar halaman
echo -e "\n[*] Merayapi semua tautan (Broken Link Checker)..."
blc $URL -ro --filter-level 3

# 4. Audit Keamanan & Celah Sistem (Penetration Testing)
echo -e "\n[*] Memindai celah keamanan mendalam (OWASP ZAP)..."
docker run -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t $URL -g gen.conf -r report.html

# 5. Audit Enkripsi SSL & Kerentanan Server
echo -e "\n[*] Menguji enkripsi SSL/TLS server..."
docker run --rm -ti drwetter/testssl.sh $URL

echo -e "\n====================================================="
echo "Audit Selesai! Periksa file report.html di folder Anda."
echo "====================================================="