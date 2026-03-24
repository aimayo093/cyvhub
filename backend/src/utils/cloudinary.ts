import { v2 as cloudinary } from 'cloudinary';

// Validate required Cloudinary environment variables at startup
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const key of requiredVars) {
    if (!process.env[key]) {
        console.warn(`⚠️  WARNING: ${key} is not set. Media uploads will fail.`);
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export default cloudinary;
