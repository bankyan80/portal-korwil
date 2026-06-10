const body = JSON.stringify({ email: 'yanuarhidayat80@gmail.com', password: 'Admin123!', returnSecureToken: true });
const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body
});
const data = await r.json();
const token = data.idToken;
console.log('Token length:', token.length);

// Decode payload
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
console.log('Payload keys:', Object.keys(payload));
console.log('user_id:', payload.user_id);
console.log('uid:', payload.uid);
console.log('sub:', payload.sub);
console.log('firebase:', JSON.stringify(payload.firebase));

// Now try calling sync-data
const r2 = await fetch('https://www.portalkorwil.online/api/admin/sync-data', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: '{}'
});
console.log('Status:', r2.status);
const text = await r2.text();
console.log('Response:', text.slice(0, 500));
