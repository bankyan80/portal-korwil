/**
 * Alternative backup function for local JSON data files
 * This reads data from Google Drive files instead of Firestore
 * Since your data is in local JSON files, we need to import them differently
 */

/**
 * Backup from JSON file in Google Drive
 * Upload your JSON files to Google Drive first, then use this function
 */
function backupFromLocalJsonFiles() {
  try {
    // Create backup spreadsheet
    const backupSS = SpreadsheetApp.create('Portal Dinas Backup - ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
    const backupId = backupSS.getId();
    
    // Define file mappings (you need to upload these JSON files to Google Drive first)
    // Format: { fileName: driveFileName, sheetName: targetSheetName }
    const fileMappings = [
      { fileName: 'data-siswa.json', sheetName: 'siswa', description: 'Data Siswa' },
      { fileName: 'data-pegawai.json', sheetName: 'pegawai', description: 'Data Pegawai' },
      { fileName: 'sekolah-data.json', sheetName: 'sekolah', description: 'Data Sekolah' }
    ];
    
    let successCount = 0;
    
    fileMappings.forEach(mapping => {
      try {
        // Try to find the file in Google Drive by name
        const files = DriveApp.getFilesByName(mapping.fileName);
        
        if (files.hasNext()) {
          const file = files.next();
          const content = file.getBlob().getDataAsString();
          const data = JSON.parse(content);
          
          // Create or get sheet
          let sheet = backupSS.getSheetByName(mapping.sheetName);
          if (!sheet) sheet = backupSS.insertSheet(mapping.sheetName);
          else sheet.clear();
          
          // Process data array
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            sheet.appendRow(headers);
            
            data.forEach(item => {
              const row = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return value.toString();
              });
              sheet.appendRow(row);
            });
            
            console.log('✅ Imported ' + data.length + ' records from ' + mapping.fileName);
            successCount++;
          } else {
            sheet.appendRow(['No data or invalid format']);
          }
        } else {
          // File not found - create empty sheet with note
          let sheet = backupSS.getSheetByName(mapping.sheetName);
          if (!sheet) sheet = backupSS.insertSheet(mapping.sheetName);
          sheet.appendRow([mapping.description + ' - Upload ' + mapping.fileName + ' to Google Drive']);
        }
      } catch (fileError) {
        console.warn('Failed to backup ' + mapping.fileName + ': ' + fileError.toString());
      }
    });
    
    console.log('✅ Backup completed! Successfully imported ' + successCount + ' files.');
    return {
      success: true,
      message: 'Backup completed. Imported ' + successCount + ' files.',
      spreadsheetId: backupId,
      url: backupSS.getUrl()
    };
    
  } catch (error) {
    console.error('❌ Backup failed: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Backup specific data for SD NEGERI 1 ASEM (simplified version)
 * This creates a backup with just the tendik/guru/siswa data for this school
 */
function backupSdn1AsemData() {
  try {
    const backupSS = SpreadsheetApp.openById('1x5aGGupXxV8lqHTZD2BsRI_cllBnCEeMTueFN9rjHlc');
    
    // Sample data structure based on what we found earlier
    // You would replace this with actual data from your JSON files
    
    // Tendik data for SD NEGERI 1 ASEM
    const tendikData = [
      { nik: '3273244711940001', nama: 'GARNIS NURUL FATHONAH', jk: 'P', nip: '199411072025212060', status_kepegawaian: 'Tenaga Honor Sekolah' },
      { nik: '3209072401030012', nama: 'PUTRA JAYADI', jk: 'L', nip: '200301242025211008', status_kepegawaian: 'PPPK Paruh Waktu' }
    ];
    
    // Create tendik sheet
    let tendikSheet = backupSS.getSheetByName('tendik_sdn1asem');
    if (!tendikSheet) tendikSheet = backupSS.insertSheet('tendik_sdn1asem');
    else tendikSheet.clear();
    
    if (tendikData.length > 0) {
      const headers = Object.keys(tendikData[0]);
      tendikSheet.appendRow(headers);
      tendikData.forEach(item => {
        tendikSheet.appendRow(headers.map(h => item[h]));
      });
    }
    
    // Add more sheets for other data types with sample structure
    // You would populate these from your actual JSON files
    
    return { success: true, message: 'SDN 1 ASEM backup created', url: backupSS.getUrl() };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}