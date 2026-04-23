
const url = 'https://cyvhub-backend-eta.vercel.app/api/auth/login';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cyvhub.com', password: 'Iyangbe@123' })
}).then(async res => {
  const text = await res.text();
  console.log('Status cyvhub-backend-eta:', res.status, text.substring(0, 100));
}).catch(console.error);

const url2 = 'https://backend-cyvrix.vercel.app/api/auth/login';
fetch(url2, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cyvhub.com', password: 'Iyangbe@123' })
}).then(async res => {
  const text = await res.text();
  console.log('Status backend-cyvrix:', res.status, text.substring(0, 100));
}).catch(console.error);

