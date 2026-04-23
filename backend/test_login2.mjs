
const url = 'https://cyvhub-backend.vercel.app/api/auth/login';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cyvhub.com', password: 'Iyangbe@123' })
}).then(async res => {
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}).catch(console.error);

