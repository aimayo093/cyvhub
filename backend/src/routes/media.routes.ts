import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary';
import { MediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// SEC-7: Restrict uploadable file types to safe formats to prevent arbitrary file execution
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'image/x-icon',
];

// Cloudinary storage — files are streamed directly to Cloudinary, never touch local disk
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req: Express.Request, file: Express.Multer.File) => ({
        folder: 'cyvhub',
        // Preserve original stem, append timestamp for uniqueness
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        // Let Cloudinary auto-detect format for images; force 'raw' for PDFs/icons
        resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    }),
});

// SEC-7: fileFilter rejects disallowed MIME types before the upload even starts
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${file.mimetype}' is not allowed. Permitted types: images and PDFs.`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // SEC-7: Max 10 MB per upload
    },
});

// Routes
router.get('/', authenticate, MediaController.getMedia);
router.post('/upload', authenticate, upload.single('media'), MediaController.uploadMedia);
router.delete('/:id', authenticate, MediaController.deleteMedia);

export default router;
