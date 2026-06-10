const body = JSON.stringify({ email: 'yanuarhidayat80@gmail.com', password: 'Admin123!', returnSecureToken: true });
const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
});
const data = await r.json();
const token = data.idToken;
console.log('TOKEN:', token);
