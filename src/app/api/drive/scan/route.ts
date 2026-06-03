import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function getServiceAccount() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try { return JSON.parse(envVal); } catch {}
  try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folderId') || '1dZMi_SQDwu1PD24Qv6CmJHNx1mMHqYMC';
  const deep = req.nextUrl.searchParams.get('deep') === 'true';

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

    const allItems: any[] = [];
    let pageToken: string | undefined;

    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, webViewLink)',
        pageSize: 100,
        pageToken,
      });
      allItems.push(...(res.data.files || []));
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    if (!deep) {
      return NextResponse.json({
        folderId,
        total: allItems.length,
        items: allItems.map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          isFolder: f.mimeType === 'application/vnd.google-apps.folder',
          webViewLink: f.webViewLink,
        })),
      });
    }

    const result: any[] = [];
    for (const item of allItems) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        let files: any[] = [];
        let pt: string | undefined;
        do {
          const r = await drive.files.list({
            q: `'${item.id}' in parents and trashed=false`,
            fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, webViewLink)',
            pageSize: 100,
            pageToken: pt,
          });
          files.push(...(r.data.files || []));
          pt = r.data.nextPageToken || undefined;
        } while (pt);

        result.push({
          folderName: item.name,
          folderId: item.id,
          folderUrl: `https://drive.google.com/drive/folders/${item.id}`,
          files: files.map(f => ({
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            webViewLink: f.webViewLink,
          })),
        });
      } else {
        result.push({
          fileName: item.name,
          fileId: item.id,
          webViewLink: item.webViewLink,
        });
      }
    }

    return NextResponse.json({ folderId, items: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, details: e.errors || [] }, { status: 500 });
  }
}
