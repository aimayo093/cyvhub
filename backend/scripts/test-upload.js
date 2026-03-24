const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

async function testUpload() {
    console.log("Starting File Upload Test...");
    try {
        // 1. Create a dummy image file
        const dummyPath = './test-image.png';
        fs.writeFileSync(dummyPath, 'fake-png-data');

        // 2. We need an auth token. We'll generate one directly.
        const jwt = require('jsonwebtoken');
        // This is the default secret used in CYVhub auth middleware
        const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-me';
        const token = jwt.sign({ userId: 'test-user', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

        if (!token) {
            console.error("Failed to get auth token. Cannot test upload.");
            return;
        }

        // 3. Perform upload
        const form = new FormData();
        form.append('media', fs.createReadStream(dummyPath));

        console.log("Uploading file...");
        const axios = require('axios');
        const uploadRes = await axios.post('http://localhost:3000/api/media/upload', form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        const uploadData = uploadRes.data;
        console.log("Parsed Upload Response:", uploadData);

        // 4. Verify fetch
        console.log("Fetching media library...");
        const fetchRes = await axios.get('http://localhost:3000/api/media', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const fetchData = fetchRes.data;
        console.log(`Successfully fetched ${fetchData.media?.length} media items.`);

        // Cleanup
        fs.unlinkSync(dummyPath);
        console.log("✅ Test Complete");

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testUpload();
