import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase-admin';

function normalizeName(raw: string): string {
  return raw
    .replace(/,?\s*(S\.\w+|M\.\w+|A\.\w+|S[12])\b.*/gi, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getServiceAccount() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try { return JSON.parse(envVal); } catch {}
  try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const nip = req.nextUrl.searchParams.get('nip');
  const halaman = req.nextUrl.searchParams.get('halaman') || '1';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10);

  if (!nip) {
    return NextResponse.json({ error: 'Parameter nip wajib' }, { status: 400 });
  }

  const sa = getServiceAccount();
  if (!sa) {
    return NextResponse.json({ error: 'Service account not configured' }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: sa,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Cari pegawai dari data-pegawai.json via /api/pegawai/all
    const pegRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.portalkorwil.online'}/api/pegawai/all?all=true`);
    const pegData = await pegRes.json();
    const pegawaiList: any[] = pegData?.items || [];
    const pegawai = pegawaiList.find((p: any) => p.nip === nip);

    if (!pegawai) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan', pegawaiCount: pegawaiList.length }, { status: 404 });
    }

    const sekolahName: string = pegawai.sekolah || '';
    if (!sekolahName) {
      return NextResponse.json({ error: 'Pegawai tidak memiliki data sekolah' }, { status: 404 });
    }

    // 2. Cari NPSN sekolah
    const sekolahNormalized = normalizeName(sekolahName);
    const { data: sekolahData } = await supabaseAdmin
      .from('app_data')
      .select('data')
      .eq('collection', 'schools')
      .filter('data->>name', 'ilike', `%${sekolahName}%`)
      .limit(1)
      .maybeSingle();

    const npsn = sekolahData?.data?.npsn || '';

    // 3. Cari folder ID dari mapping
    const { data: mappingData } = await supabaseAdmin
      .from('app_data')
      .select('data')
      .eq('collection', 'drive_folders')
      .eq('id', npsn)
      .maybeSingle();

    let folderId: string | null = mappingData?.data?.folderId || null;

    if (!folderId) {
      return NextResponse.json({
        error: 'Folder Drive untuk sekolah ini belum diatur',
        sekolah: sekolahName,
        npsn: npsn || '(tidak ditemukan)',
      }, { status: 404 });
    }

    // 4. List subfolder pegawai
    const allFolders: any[] = [];
    let pt: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
        fields: 'nextPageToken, files(id, name)',
        pageSize: 100,
        pageToken: pt,
      });
      allFolders.push(...(r.data.files || []));
      pt = r.data.nextPageToken || undefined;
    } while (pt);

    // 5. Cari folder pegawai berdasarkan nama
    const pegawaiName = normalizeName(pegawai.nama || '');
    const matchedFolder = allFolders.find((f: any) => normalizeName(f.name || '') === pegawaiName);

    // Fallback: partial match
    const matchedFolderPartial = !matchedFolder
      ? allFolders.find((f: any) => normalizeName(f.name || '').includes(pegawaiName) || pegawaiName.includes(normalizeName(f.name || '')))
      : null;

    const targetFolder = matchedFolder || matchedFolderPartial;

    if (!targetFolder) {
      return NextResponse.json({
        error: 'Folder pegawai tidak ditemukan',
        pegawai: pegawai.nama,
        sekolah: sekolahName,
        allFolders: allFolders.map((f: any) => f.name),
      }, { status: 404 });
    }

    // 6. List files di folder pegawai
    const files: any[] = [];
    let fpt: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${targetFolder.id}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, createdTime)',
        pageSize: 100,
        pageToken: fpt,
      });
      files.push(...(r.data.files || []));
      fpt = r.data.nextPageToken || undefined;
    } while (fpt);

    return NextResponse.json({
      pegawai: pegawai.nama,
      nip: pegawai.nip,
      sekolah: sekolahName,
      npsn,
      folder: {
        name: targetFolder.name,
        id: targetFolder.id,
      },
      total: files.length,
      files: files.map((f: any) => ({
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        url: f.webViewLink,
        createdTime: f.createdTime,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, details: e.errors || [] }, { status: 500 });
  }
}
