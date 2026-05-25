import { NextResponse } from 'next/server';
import { google } from 'googleapis';

function getServiceAccount() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try {
    return JSON.parse(envVal);
  } catch {
    try {
      return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
}

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check env var
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  results.envVarSet = !!envVal;
  results.envVarLength = envVal?.length || 0;

  if (!envVal) {
    return NextResponse.json({ ...results, status: 'error', message: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' });
  }

  // 2. Parse service account
  const sa = getServiceAccount();
  results.serviceAccountParsed = !!sa;
  results.serviceAccountEmail = sa?.client_email || 'N/A';
  results.serviceAccountProject = sa?.project_id || 'N/A';

  if (!sa) {
    return NextResponse.json({ ...results, status: 'error', message: 'Invalid service account format' });
  }

  try {
    // 3. Test Google Drive API connection
    const auth = new google.auth.GoogleAuth({
      credentials: sa,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get root folder or list files
    const driveRes = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ'}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, createdTime)',
      pageSize: 10,
    });

    results.driveApiConnected = true;
    results.folderId = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ';
    results.filesInFolder = driveRes.data.files?.length || 0;
    results.files = driveRes.data.files?.map(f => ({
      name: f.name,
      mimeType: f.mimeType,
      id: f.id,
    })) || [];

    // 4. Test Google Sheets API
    const sheetsAuth = new google.auth.GoogleAuth({
      credentials: sa,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

    // Try to create a test spreadsheet
    const testSheet = await drive.files.create({
      requestBody: {
        name: 'Test Connection - Portal Korwil',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ'],
      },
      fields: 'id, name, webViewLink',
    });

    results.sheetsApiConnected = true;
    results.testSheetCreated = true;
    results.testSheetUrl = testSheet.data.webViewLink;
    results.testSheetId = testSheet.data.id;

    // Clean up test sheet
    await drive.files.delete({ fileId: testSheet.data.id! });
    results.testSheetDeleted = true;

    return NextResponse.json({ ...results, status: 'connected', message: 'Google Drive & Sheets API connected successfully!' });
  } catch (error: any) {
    results.driveApiConnected = false;
    results.error = error.message;
    results.errorDetails = error.errors || [];

    // Check if it's the API not enabled error
    if (error.message?.includes('not been used') || error.message?.includes('disabled')) {
      results.suggestion = 'Enable Google Drive API at: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=' + sa.project_id;
    }

    return NextResponse.json({ ...results, status: 'error' });
  }
}
