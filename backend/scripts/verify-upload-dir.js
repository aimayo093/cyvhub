const fs = require('fs');
const path = require('path');

// Ensure the public/uploads directory exists before server startup/testing
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("Upload directory verified:", uploadDir);
