
const url = 'https://cyvhub-backend-eta.vercel.app/api/auth/login';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cyvhub.com', password: 'Iyangbe@123' })
}).then(async res => {
  const text = await res.text();
  console.log('Status:', res.status);
  try { console.log(JSON.parse(text)); } catch(e) { console.log(text.substring(0,300)); }
}).catch(console.error);

