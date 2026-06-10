const body = JSON.stringify({ email: 'yanuarhidayat80@gmail.com', password: 'Admin123!', returnSecureToken: true });
const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body
});
const data = await r.json();
const token = data.idToken;

// Test with cookie-based auth
const r2 = await fetch('https://www.portalkorwil.online/api/admin/sync-data', {
  method: 'POST',
  headers: { 'Cookie': `auth-token=${token}`, 'Content-Type': 'application/json' },
  body: '{}',
  redirect: 'manual'
});
console.log('Status:', r2.status, r2.statusText);
const text = await r2.text();
console.log('Response:', text.slice(0, 300));
console.log('Headers:', JSON.stringify([...r2.headers.entries()]));
