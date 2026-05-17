/**
 * Menu function for backup - This adds a backup menu item
 * Comment this out if you don't want ANY menu changes at all
 */
// function createBackupMenu() {
//   const ui = SpreadsheetApp.getUi();
//   ui.createMenu('🔧 Tools')
//     .addItem('💾 Backup Firestore', 'backupFirestoreToSheets')
//     .addToUi();
// }

/**
 * Function to manually trigger backup to specific spreadsheet
 */
function manualBackup() {
  return backupFirestoreToSheets();
}

/**
 * Backup to specific spreadsheet (for your existing spreadsheet)
 */
function backupToYourSpreadsheet() {
  return backupFirestoreToSheets('1x5aGGupXxV8lqHTZD2BsRI_cllBnCEeMTueFN9rjHlc');
}

/**
 * Function to set up automatic daily backup trigger
 * Run this once to set up daily backup
 */
function setupDailyBackupTrigger() {
  // Remove existing triggers for this function (to avoid duplicates)
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'manualBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 2 AM
  ScriptApp.newTrigger('manualBackup')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
    
  console.log('✅ Daily backup trigger set for 2 AM daily');
}

/**
 * Function to remove backup trigger
 */
function removeBackupTrigger() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'manualBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  console.log('🗑️ Backup trigger removed');
}

/**
 * Backup Firestore data to Google Sheets - Debug version
 * This function creates a backup of all Firestore collections
 * with detailed logging for troubleshooting
 */
function backupFirestoreToSheets(targetSpreadsheetId) {
  console.log('Starting Firestore backup...');
  
  try {
    // Get Firebase configuration
    const firebaseConfig = getFirebaseConfig_();
    console.log('Firebase config:', JSON.stringify({
      projectId: firebaseConfig?.projectId,
      hasApiKey: !!firebaseConfig?.apiKey
    }));
    
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      throw new Error('Firebase configuration not found. Set FIREBASE_API_KEY in Script Properties.');
    }
    
    // Open target spreadsheet
    let backupSS;
    if (targetSpreadsheetId) {
      try {
        backupSS = SpreadsheetApp.openById(targetSpreadsheetId);
        console.log('Opened spreadsheet:', targetSpreadsheetId);
      } catch (e) {
        console.warn('Failed to open spreadsheet, creating new one:', e.toString());
        backupSS = SpreadsheetApp.create('Firestore Backup ' + new Date().toISOString());
      }
    } else {
      backupSS = SpreadsheetApp.create('Firestore Backup ' + new Date().toISOString());
    }
    
    // Try multiple possible collection names
    const collectionAttempts = [
      ['sekolah', 'schools'],
      ['siswa', 'students'],
      ['guru', 'teachers'],
      ['tendik', 'staff', 'employees'],
      ['menus', 'menu_items'],
      ['announcements', 'announcements'],
      ['gallery', 'gallery_items'],
      ['organizations', 'organizations'],
      ['links', 'links'],
      ['settings', 'settings'],
      ['users', 'users']
    ];
    
    for (const names of collectionAttempts) {
      for (const collectionName of names) {
        try {
          console.log('Trying to fetch collection:', collectionName);
          const data = fetchCollectionFromFirestore_(firebaseConfig, collectionName);
          
          if (data && data.length > 0) {
            console.log('SUCCESS: Got ' + data.length + ' records from ' + collectionName);
            
            let sheet = backupSS.getSheetByName(collectionName);
            if (!sheet) sheet = backupSS.insertSheet(collectionName);
            else sheet.clear();
            
            // Create header and rows
            const headers = Object.keys(data[0]);
            sheet.appendRow(headers);
            data.forEach(item => {
              sheet.appendRow(headers.map(h => {
                const v = item[h];
                return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
              }));
            });
            
            console.log('Written to sheet:', collectionName);
            break; // Success, don't try other names
          }
        } catch (err) {
          console.log('Failed for ' + collectionName + ': ' + err.toString().substring(0, 100));
        }
      }
    }
    
    console.log('Backup completed! Check spreadsheet:', backupSS.getUrl());
    return { success: true, message: 'Backup completed', url: backupSS.getUrl() };
    
  } catch (error) {
    console.error('Backup FAILED:', error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Get Firebase configuration from script properties or use fallback
 * @private
 */
function getFirebaseConfig_() {
  try {
    const props = PropertiesService.getScriptProperties();
    const projectId = props.getProperty('FIREBASE_PROJECT_ID');
    const apiKey = props.getProperty('FIREBASE_API_KEY');
    
    if (projectId && apiKey) {
      return {
        projectId: projectId,
        apiKey: apiKey,
        databaseURL: 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents'
      };
    }
    
    // Fallback to hardcoded values (for backup purposes)
    // In production, set these via Script Properties for security
    return {
      projectId: 'kedinasan-e5317',
      apiKey: 'AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4',
      databaseURL: 'https://firestore.googleapis.com/v1/projects/kedinasan-e5317/databases/(default)/documents'
    };
  } catch (e) {
    console.error('Error getting Firebase config: ' + e.toString());
    return null;
  }
}

/**
 * Fetch data from a Firestore collection using REST API
 * @param {Object} firebaseConfig - Firebase configuration object
 * @param {string} collectionName - Name of the collection to fetch
 * @private
 */
function fetchCollectionFromFirestore_(firebaseConfig, collectionName) {
  try {
    const url = firebaseConfig.databaseURL + '/' + collectionName;
    const uriWithKey = url + '?key=' + firebaseConfig.apiKey;
    
    const options = {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const response = UrlFetchApp.fetch(uriWithKey, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      const result = JSON.parse(response.getContentText());
      if (result && result.documents) {
        return result.documents.map(doc => {
          const data = {};
          if (doc.fields) {
            Object.keys(doc.fields).forEach(fieldKey => {
              const fieldValue = doc.fields[fieldKey];
              data[fieldKey] = extractFirestoreValue_(fieldValue);
            });
          }
          data.id = doc.name.split('/').pop();
          return data;
        });
      }
      return [];
    } else if (responseCode === 403 || responseCode === 401) {
      // Try alternative with proper authentication
      return fetchCollectionWithServiceAccount_(firebaseConfig, collectionName);
    } else {
      throw new Error('HTTP ' + responseCode + ': ' + response.getContentText());
    }
  } catch (error) {
    throw new Error('Failed to fetch collection ' + collectionName + ': ' + error.toString());
  }
}

/**
 * Extract value from Firestore field format
 * @private
 */
function extractFirestoreValue_(firestoreValue) {
  if (!firestoreValue) return null;
  
  const type = Object.keys(firestoreValue)[0];
  const value = firestoreValue[type];
  
  switch (type) {
    case 'nullValue': return null;
    case 'booleanValue': return value === true;
    case 'integerValue':
    case 'doubleValue': return parseFloat(value);
    case 'timestampValue': return value;
    case 'stringValue': return value;
    case 'arrayValue':
      if (value && value.values) {
        return value.values.map(v => extractFirestoreValue_(v));
      }
      return [];
    case 'mapValue':
      if (value && value.fields) {
        const obj = {};
        Object.keys(value.fields).forEach(key => {
          obj[key] = extractFirestoreValue_(value.fields[key]);
        });
        return obj;
      }
      return {};
    default: return typeof value === 'string' ? value : JSON.stringify(value);
  }
}

/**
 * Fetch collection with service account (fallback method)
 * @private
 */
function fetchCollectionWithServiceAccount_(firebaseConfig, collectionName) {
  try {
    const props = PropertiesService.getScriptProperties();
    const serviceAccountJson = props.getProperty('FIREBASE_SERVICE_ACCOUNT');
    
    if (!serviceAccountJson) {
      throw new Error('Service account not configured. Set FIREBASE_SERVICE_ACCOUNT in Script Properties.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    const jwt = createServiceAccountJwt_(serviceAccount, firebaseConfig.projectId);
    
    const url = firebaseConfig.databaseURL + '/' + collectionName;
    const options = {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'Authorization': 'Bearer ' + jwt,
        'Accept': 'application/json'
      }
    };
    
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      if (result && result.documents) {
        return result.documents.map(doc => {
          const data = {};
          if (doc.fields) {
            Object.keys(doc.fields).forEach(fieldKey => {
              data[fieldKey] = extractFirestoreValue_(doc.fields[fieldKey]);
            });
          }
          data.id = doc.name.split('/').pop();
          return data;
        });
      }
    }
    throw new Error('HTTP ' + response.getResponseCode());
  } catch (e) {
    throw new Error('Service account fetch failed: ' + e.toString());
  }
}

/**
 * Create JWT for service account authentication
 * @private
 */
function createServiceAccountJwt_(serviceAccount, projectId) {
  // Note: Full JWT signing requires the private key
  // For simplicity, try to use the access token endpoint
  return getAccessTokenFromServiceAccount_(serviceAccount);
}

/**
 * Get access token using service account credentials
 * @private
 */
function getAccessTokenFromServiceAccount_(serviceAccount) {
  try {
    const url = 'https://oauth2.googleapis.com/token';
    const payload = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJwtAssertion_(serviceAccount)
    };
    
    const options = {
      method: 'post',
      payload: JSON.stringify(payload),
      contentType: 'application/json',
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      return result.access_token;
    }
    throw new Error('Failed to get access token');
  } catch (e) {
    throw new Error('Service account token error: ' + e.toString());
  }
}

/**
 * Create JWT assertion for service account
 * @private
 */
function createJwtAssertion_(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  
  // Encode and sign (simplified - would need proper crypto in production)
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  
  // For production, use proper JWT signing with the private key
  // This is a placeholder that will need the actual private key signature
  return encodedHeader + '.' + encodedPayload + '.SIGNATURE_PLACEHOLDER';
}