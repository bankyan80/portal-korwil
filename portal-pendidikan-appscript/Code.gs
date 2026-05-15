/**
 * Portal Pendidikan - Google Apps Script
 * Dinas Pendidikan Kabupaten Cirebon - Kecamatan Lemahabang
 * Login menggunakan Google Account (Session.getActiveUser())
 */

// ==================== KONFIGURASI ====================

const CONFIG = {
  SPREADSHEET_NAME: 'Portal Pendidikan',
  SHEETS: {
    menus: 'menus',
    announcements: 'announcements',
    gallery: 'gallery',
    organizations: 'organizations',
    links: 'links',
    users: 'users',
    settings: 'settings',
  },
};

// ==================== SPREADSHEET INIT ====================

/**
 * Mendapatkan atau membuat Spreadsheet.
 * Prioritas: (1) Aktif di editor, (2) Tersimpan di ScriptProperties, (3) Buat baru
 */
function getSpreadsheet() {
  // 1. Coba spreadsheet aktif (jika script dibuka dari Google Sheets)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      // Simpan ID untuk akses berikutnya
      const id = active.getId();
      PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
      return active;
    }
  } catch (e) {
    // Tidak ada spreadsheet aktif, lanjut ke langkah 2
  }

  // 2. Ambil dari Properties yang tersimpan
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {
      props.deleteProperty('SPREADSHEET_ID');
    }
  }

  // 3. Buat spreadsheet baru (butuh autorisasi)
  const ss = SpreadsheetApp.create('Portal Pendidikan Database');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  console.log('✅ Spreadsheet baru: ' + ss.getUrl());
  return ss;
}

// ==================== DOGET ====================

function doGet(e) {
  const page = e?.parameter?.page || 'portal';

  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Admin Panel - Portal Pendidikan')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Portal Pendidikan - Kecamatan Lemahabang')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ==================== GOOGLE AUTH ====================

/**
 * Mendapatkan email Google user yang sedang login
 * Hanya bisa digunakan ketika Web App dideploy sebagai "Me" dengan akses "Anyone"
 * dan user sudah login ke Google
 */
function getCurrentUserEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return '';
  }
}

/**
 * Mendapatkan informasi user dari session aktif
 * Mengembalikan data user jika email Google terdaftar di sheet users
 */
function getGoogleUser() {
  const email = Session.getActiveUser().getEmail();
  if (!email) return { success: false, message: 'Tidak terdeteksi login Google' };

  const sheet = getSheet_(CONFIG.SHEETS.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = String(row[headers.indexOf('email')] || '').toLowerCase().trim();
    const rowUsername = String(row[headers.indexOf('username')] || '').toLowerCase().trim();

    // Cari berdasarkan email atau username
    if (rowEmail === email.toLowerCase().trim() || rowUsername === email.toLowerCase().trim()) {
      return {
        success: true,
        user: {
          id: row[headers.indexOf('id')],
          email: rowEmail || email,
          displayName: row[headers.indexOf('displayName')] || rowUsername,
          role: row[headers.indexOf('role')] || 'admin',
        },
      };
    }
  }

  // Jika belum terdaftar, cek apakah email di domain yang diizinkan
  // Default: semua email Google bisa akses sebagai viewer, admin jika diizinkan
  const allowedDomains = ['gmail.com']; // bisa ditambah domain lain
  const domain = email.split('@')[1];

  return {
    success: true,
    user: {
      id: 'google_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
      email: email,
      displayName: email.split('@')[0],
      role: 'viewer', // Default viewer, bisa diubah admin melalui sheet users
    },
    isNewUser: true,
    message: 'Email ' + email + ' belum terdaftar. Hubungi admin untuk akses penuh.',
  };
}

function checkGoogleSession() {
  return getGoogleUser();
}

// ==================== LOGIN USERNAME/PASSWORD ====================

/**
 * Login menggunakan username dan password
 * Data user disimpan di sheet 'users' dengan kolom: id, email, username, password, displayName, role, createdAt
 */
function login(username, password) {
  const sheet = getSheet_(CONFIG.SHEETS.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Cari username di sheet
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUsername = String(row[headers.indexOf('username')] || '').toLowerCase().trim();
    const rowPassword = String(row[headers.indexOf('password')] || '');
    const rowEmail = String(row[headers.indexOf('email')] || '');
    const rowDisplayName = String(row[headers.indexOf('displayName')] || '');
    const rowRole = String(row[headers.indexOf('role')] || '');

    // Cek username atau email
    if (rowUsername === username.toLowerCase().trim() || rowEmail.toLowerCase().trim() === username.toLowerCase().trim()) {
      // Cek password
      if (rowPassword === password) {
        // Update last login
        const loginTimeCol = headers.indexOf('lastLogin');
        if (loginTimeCol >= 0) {
          sheet.getRange(i + 1, loginTimeCol + 1).setValue(Date.now().toString());
        }
        return {
          success: true,
          user: {
            id: row[headers.indexOf('id')],
            email: rowEmail || rowUsername,
            username: rowUsername,
            displayName: rowDisplayName || rowUsername,
            role: rowRole || 'viewer',
          },
        };
      } else {
        return { success: false, message: 'Password salah' };
      }
    }
  }

  // Default admin jika sheet users kosong
  if (username === 'admin' && password === 'admin123') {
    return {
      success: true,
      user: {
        id: 'default_admin',
        email: 'admin@portal.sch.id',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
      },
    };
  }

  return { success: false, message: 'Username tidak ditemukan' };
}

/**
 * Get current logged in user (for session persistence)
 */
function getCurrentUser(username) {
  const sheet = getSheet_(CONFIG.SHEETS.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[headers.indexOf('username')] || '').toLowerCase().trim() === username.toLowerCase().trim()) {
      return {
        success: true,
        user: {
          id: row[headers.indexOf('id')],
          email: row[headers.indexOf('email')] || username,
          username: row[headers.indexOf('username')],
          displayName: row[headers.indexOf('displayName')] || username,
          role: row[headers.indexOf('role')] || 'viewer',
        },
      };
    }
  }
  return { success: false };
}

// ==================== INISIALISASI SPREADSHEET ====================

function getSheet_(sheetName) {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak tersedia. Pastikan sudah di-set. Buka File > Spreadsheet > Tambahkan.');
  }
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    switch (sheetName) {
      case CONFIG.SHEETS.menus:
        sheet.appendRow(['id', 'title', 'icon', 'url', 'active', 'order', 'category']);
        break;
      case CONFIG.SHEETS.announcements:
        sheet.appendRow(['id', 'title', 'content', 'createdAt', 'pinned', 'author']);
        break;
      case CONFIG.SHEETS.gallery:
        sheet.appendRow(['id', 'title', 'description', 'imageUrl', 'category', 'authorName', 'authorRole', 'status', 'createdAt']);
        break;
      case CONFIG.SHEETS.organizations:
        sheet.appendRow(['id', 'name', 'logo', 'leader', 'contact', 'active']);
        break;
      case CONFIG.SHEETS.links:
        sheet.appendRow(['id', 'name', 'logo', 'url', 'active', 'order']);
        break;
      case CONFIG.SHEETS.users:
        sheet.appendRow(['id', 'email', 'username', 'password', 'displayName', 'role', 'createdAt']);
        break;
      case CONFIG.SHEETS.settings:
        sheet.appendRow(['id', 'key', 'value']);
        sheet.appendRow(['1', 'kepalaDinas', 'H. Asep Hilman, S.Pd., M.Pd.']);
        sheet.appendRow(['2', 'jabatan', 'Kepala Dinas Pendidikan Kab. Cirebon']);
        sheet.appendRow(['3', 'sambutan', 'Selamat Datang di Portal Pendidikan Kecamatan Lemahabang. DISDIK BERBENAH (Bersih, Edukatif, Religius, Berintegritas, Empati, Normatif, Amanah, Humanis)']);
        sheet.appendRow(['4', 'fotoKepalaDinas', 'https://placehold.co/400x500/0d3b66/ffffff?text=Kadis']);
        break;
    }
  }
  return sheet;
}

// ==================== GENERATE ID ====================

function generateId_() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// ==================== CRUD MENUS ====================

function getMenus() {
  const sheet = getSheet_(CONFIG.SHEETS.menus);
  const data = sheet.getDataRange().getValues();
  return parseSheetData_(data);
}

function saveMenu(menu) {
  const sheet = getSheet_(CONFIG.SHEETS.menus);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (menu.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === menu.id) {
        for (let key in menu) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(menu[key]);
        }
        return { success: true };
      }
    }
  }

  menu.id = generateId_();
  const row = headers.map(h => menu[h] || '');
  sheet.appendRow(row);
  return { success: true, id: menu.id };
}

function deleteMenu(id) {
  return deleteRow_(CONFIG.SHEETS.menus, id);
}

// ==================== CRUD ANNOUNCEMENTS ====================

function getAnnouncements() {
  const sheet = getSheet_(CONFIG.SHEETS.announcements);
  const data = sheet.getDataRange().getValues();
  const items = parseSheetData_(data);
  items.forEach(item => { item.createdAt = parseInt(item.createdAt) || Date.now(); });
  return items;
}

function saveAnnouncement(item) {
  const sheet = getSheet_(CONFIG.SHEETS.announcements);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (item.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === item.id) {
        for (let key in item) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(item[key]);
        }
        return { success: true };
      }
    }
  }

  item.id = generateId_();
  item.createdAt = Date.now().toString();
  item.pinned = item.pinned || 'false';
  const row = headers.map(h => item[h] || '');
  sheet.appendRow(row);
  return { success: true, id: item.id };
}

function deleteAnnouncement(id) {
  return deleteRow_(CONFIG.SHEETS.announcements, id);
}

// ==================== CRUD GALLERY ====================

function getGallery() {
  const sheet = getSheet_(CONFIG.SHEETS.gallery);
  const data = sheet.getDataRange().getValues();
  const items = parseSheetData_(data);
  items.forEach(item => { item.createdAt = parseInt(item.createdAt) || Date.now(); });
  return items;
}

function saveGalleryItem(item) {
  const sheet = getSheet_(CONFIG.SHEETS.gallery);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (item.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === item.id) {
        for (let key in item) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(item[key]);
        }
        return { success: true };
      }
    }
  }

  item.id = generateId_();
  item.createdAt = Date.now().toString();
  item.status = item.status || 'approved';
  const row = headers.map(h => item[h] || '');
  sheet.appendRow(row);
  return { success: true, id: item.id };
}

function deleteGalleryItem(id) {
  return deleteRow_(CONFIG.SHEETS.gallery, id);
}

// ==================== CRUD ORGANIZATIONS ====================

function getOrganizations() {
  const sheet = getSheet_(CONFIG.SHEETS.organizations);
  const data = sheet.getDataRange().getValues();
  return parseSheetData_(data);
}

function saveOrganization(org) {
  const sheet = getSheet_(CONFIG.SHEETS.organizations);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (org.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === org.id) {
        for (let key in org) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(org[key]);
        }
        return { success: true };
      }
    }
  }

  org.id = generateId_();
  org.active = org.active || 'true';
  const row = headers.map(h => org[h] || '');
  sheet.appendRow(row);
  return { success: true, id: org.id };
}

function deleteOrganization(id) {
  return deleteRow_(CONFIG.SHEETS.organizations, id);
}

// ==================== CRUD LINKS ====================

function getLinks() {
  const sheet = getSheet_(CONFIG.SHEETS.links);
  const data = sheet.getDataRange().getValues();
  return parseSheetData_(data);
}

function saveLink(link) {
  const sheet = getSheet_(CONFIG.SHEETS.links);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (link.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === link.id) {
        for (let key in link) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(link[key]);
        }
        return { success: true };
      }
    }
  }

  link.id = generateId_();
  link.active = link.active || 'true';
  const row = headers.map(h => link[h] || '');
  sheet.appendRow(row);
  return { success: true, id: link.id };
}

function deleteLink(id) {
  return deleteRow_(CONFIG.SHEETS.links, id);
}

// ==================== SETTINGS ====================

function getSettings() {
  const sheet = getSheet_(CONFIG.SHEETS.settings);
  const data = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < data.length; i++) {
    result[data[i][1]] = data[i][2];
  }
  return result;
}

function saveSetting(key, value) {
  const sheet = getSheet_(CONFIG.SHEETS.settings);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === key) {
      sheet.getRange(i + 1, 3).setValue(value);
      return { success: true };
    }
  }
  const id = generateId_();
  sheet.appendRow([id, key, value]);
  return { success: true };
}

// ==================== CRUD USERS (Google) ====================

function getUsers() {
  const sheet = getSheet_(CONFIG.SHEETS.users);
  const data = sheet.getDataRange().getValues();
  const users = parseSheetData_(data);
  // Hapus field sensitif
  users.forEach(u => { delete u.password; });
  return users;
}

function saveUser(user) {
  const sheet = getSheet_(CONFIG.SHEETS.users);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (user.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('id')] === user.id) {
        for (let key in user) {
          const colIndex = headers.indexOf(key);
          if (colIndex >= 0) sheet.getRange(i + 1, colIndex + 1).setValue(user[key]);
        }
        return { success: true };
      }
    }
  }

  // Cek duplikat email
  for (let i = 1; i < data.length; i++) {
    const existingEmail = String(data[i][headers.indexOf('email')] || '').toLowerCase().trim();
    if (user.email && existingEmail === user.email.toLowerCase().trim()) {
      return { success: false, message: 'Email sudah terdaftar' };
    }
  }

  user.id = generateId_();
  user.createdAt = Date.now().toString();
  const row = headers.map(h => user[h] || '');
  sheet.appendRow(row);
  return { success: true, id: user.id };
}

function deleteUser(id) {
  return deleteRow_(CONFIG.SHEETS.users, id);
}

// ==================== UTILITY ====================

function parseSheetData_(data) {
  if (data.length < 2) return [];
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx].toString() : '';
    });
    result.push(obj);
  }
  return result;
}

function deleteRow_(sheetName, id) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return { success: false, message: 'No id column' };
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Item not found' };
}

function getAllData() {
  return {
    menus: getMenus(),
    announcements: getAnnouncements(),
    gallery: getGallery(),
    organizations: getOrganizations(),
    links: getLinks(),
    settings: getSettings(),
  };
}

// ==================== IMPORT DATA FROM JSON ====================

/**
 * Import data dari JSON (hasil export Firestore)
 * Format: { "menus": [...], "announcements": [...], "gallery": [...], ... }
 */
function importData(jsonData) {
  try {
    let data;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    const results = {};
    const sheetMapping = {
      'menus': { sheet: CONFIG.SHEETS.menus, fields: ['id','title','icon','url','active','order','category'] },
      'announcements': { sheet: CONFIG.SHEETS.announcements, fields: ['id','title','content','createdAt','pinned','author'] },
      'gallery': { sheet: CONFIG.SHEETS.gallery, fields: ['id','title','description','imageUrl','category','authorName','authorRole','status','createdAt'] },
      'organizations': { sheet: CONFIG.SHEETS.organizations, fields: ['id','name','logo','leader','contact','active'] },
      'links': { sheet: CONFIG.SHEETS.links, fields: ['id','name','logo','url','active','order'] },
      'institution_links': { sheet: CONFIG.SHEETS.links, fields: ['id','name','logo','url','active','order'] },
      'settings': { sheet: CONFIG.SHEETS.settings, fields: ['id','key','value'] },
      'users': { sheet: CONFIG.SHEETS.users, fields: ['id','email','username','displayName','role','createdAt'] },
    };

    for (const [key, items] of Object.entries(data)) {
      const mapping = sheetMapping[key] || sheetMapping[key.toLowerCase()];
      if (!mapping || !Array.isArray(items) || items.length === 0) continue;

      const sheetName = mapping.sheet;
      const fields = mapping.fields;
      const sheet = getSheet_(sheetName);

      // Clear existing data (keep header)
      const existingData = sheet.getDataRange().getValues();
      if (existingData.length > 1) {
        sheet.deleteRows(2, existingData.length - 1);
      }

      // Insert data
      let importedCount = 0;
      const rowsToInsert = [];

      items.forEach((item, idx) => {
        const row = [];
        fields.forEach(field => {
          let val = item[field];
          if (val === undefined || val === null) {
            val = '';
          } else if (typeof val === 'boolean') {
            val = val ? 'true' : 'false';
          } else if (typeof val === 'object') {
            // Handle arrays (like gallery.images)
            if (Array.isArray(val) && field === 'imageUrl') {
              val = val[0] || '';
            } else if (Array.isArray(val)) {
              val = JSON.stringify(val);
            } else {
              val = JSON.stringify(val);
            }
          } else {
            val = String(val);
          }
          row.push(val);
        });

        // Ensure id exists
        if (!row[0] || row[0] === '') {
          row[0] = generateId_();
        }

        rowsToInsert.push(row);
        importedCount++;
      });

      if (rowsToInsert.length > 0) {
        const range = sheet.getRange(2, 1, rowsToInsert.length, fields.length);
        range.setValues(rowsToInsert);
      }

      results[key] = { sheet: sheetName, count: importedCount };
    }

    return { success: true, results };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Export data dari Sheets ke JSON (untuk backup)
 */
function exportData() {
  return JSON.stringify(getAllData(), null, 2);
}

// ==================== SEED DEFAULT DATA ====================

function seedDefaultData() {
  const menus = getMenus();
  if (menus.length === 0) {
    const defaultMenus = [
      { title: 'Data Pokok Pendidikan', icon: 'Database', url: '#', category: 'Data Pokok', active: 'true', order: '1' },
      { title: 'Data Sekolah', icon: 'School', url: '#', category: 'Daftar Sekolah', active: 'true', order: '2' },
      { title: 'Data TK', icon: 'Baby', url: '#', category: 'Pendidikan Anak', active: 'true', order: '3' },
      { title: 'Data SD', icon: 'GraduationCap', url: '#', category: 'Pendidikan Dasar', active: 'true', order: '4' },
      { title: 'Data PAUD', icon: 'HeartHandshake', url: '#', category: 'PAUD', active: 'true', order: '5' },
      { title: 'Data GTK', icon: 'Users', url: '#', category: 'Guru & Tendik', active: 'true', order: '6' },
      { title: 'Data PD', icon: 'BookOpen', url: '#', category: 'Peserta Didik', active: 'true', order: '7' },
      { title: 'Data Rombel', icon: 'Target', url: '#', category: 'Rombel', active: 'true', order: '8' },
      { title: 'BOS & ARKAS', icon: 'WalletMinimal', url: '#', category: 'Keuangan', active: 'true', order: '9' },
      { title: 'DAPODIK', icon: 'BarChart3', url: '#', category: 'Pendataan', active: 'true', order: '10' },
      { title: 'E-Kinerja', icon: 'FileText', url: '#', category: 'Kinerja', active: 'true', order: '11' },
      { title: 'SPMB SD', icon: 'Send', url: '#', category: 'Penerimaan', active: 'true', order: '12' },
      { title: 'Kalender', icon: 'CalendarDays', url: '#', category: 'Agenda', active: 'true', order: '13' },
      { title: 'Administrasi', icon: 'FolderOpen', url: '#', category: 'Admin', active: 'true', order: '14' },
      { title: 'Laporan', icon: 'Mail', url: '#', category: 'Laporan', active: 'true', order: '15' },
      { title: 'Website Sekolah', icon: 'Globe', url: '#', category: 'Website', active: 'true', order: '16' },
    ];
    const sheet = getSheet_(CONFIG.SHEETS.menus);
    defaultMenus.forEach(menu => {
      menu.id = generateId_();
      const row = ['id', 'title', 'icon', 'url', 'active', 'order', 'category'].map(h => menu[h]);
      sheet.appendRow(row);
    });
  }

  const gallery = getGallery();
  if (gallery.length === 0) {
    const sheet = getSheet_(CONFIG.SHEETS.gallery);
    const sampleItems = [
      { title: 'Kegiatan Belajar Mengajar', description: 'Suasana belajar di kelas', imageUrl: 'https://placehold.co/800x600/0d3b66/ffffff?text=KBM', category: 'Kegiatan', authorName: 'Admin', authorRole: 'Admin', status: 'approved', createdAt: Date.now().toString() },
      { title: 'Rapat Koordinasi', description: 'Rapat koordinasi dengan kepala sekolah', imageUrl: 'https://placehold.co/800x600/1a5276/ffffff?text=Rapat', category: 'Rapat', authorName: 'Admin', authorRole: 'Admin', status: 'approved', createdAt: Date.now().toString() },
      { title: 'Upacara Bendera', description: 'Upacara bendera hari Senin', imageUrl: 'https://placehold.co/800x600/2c3e50/ffffff?text=Upacara', category: 'Kegiatan', authorName: 'Admin', authorRole: 'Admin', status: 'approved', createdAt: Date.now().toString() },
    ];
    sampleItems.forEach(item => {
      item.id = generateId_();
      const row = ['id', 'title', 'description', 'imageUrl', 'category', 'authorName', 'authorRole', 'status', 'createdAt'].map(h => item[h]);
      sheet.appendRow(row);
    });
  }
}