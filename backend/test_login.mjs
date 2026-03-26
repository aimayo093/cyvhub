
const url = 'https://cyvhub-backend-wdfv.vercel.app/api/auth/login';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cyvhub.com', password: 'lyangbe@123' })
}).then(async res => {
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}).catch(console.error);

