import { Request, Response } from 'express';
import { prisma } from '../index';
import cloudinary from '../utils/cloudinary';

export class MediaController {

    // GET /api/media
    static async getMedia(req: Request, res: Response): Promise<void> {
        try {
            const { category, type } = req.query;
            
            const where: any = {};
            if (category) where.category = category;
            if (type) where.type = type;

            const media = await prisma.mediaAsset.findMany({
                where,
                orderBy: { dateUploaded: 'desc' }
            });

            res.status(200).json({ media });
        } catch (error) {
            console.error('[MediaController] getMedia error:', error);
            res.status(500).json({ error: 'Failed to fetch media assets.' });
        }
    }

    // POST /api/media/upload
    static async uploadMedia(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded.' });
                return;
            }

            // Optional metadata from body
            const { altText, category, isCommon } = req.body;

            // multer-storage-cloudinary populates req.file with Cloudinary metadata
            const { originalname, mimetype, size } = req.file;
            const cloudinaryFile = req.file as Express.Multer.File & {
                path: string;       // Cloudinary secure URL
                filename: string;   // Cloudinary public_id
            };

            const url      = cloudinaryFile.path;       // e.g. https://res.cloudinary.com/...
            const publicId = cloudinaryFile.filename;   // e.g. cyvhub/media-1234567890

            // Determine file type category
            let type = 'document';
            if (mimetype.startsWith('image/')) type = 'image';
            if (originalname.endsWith('.svg') || originalname.endsWith('.ico')) type = 'icon';

            // Format size for display (e.g., "1.2 MB", "850 KB")
            let formattedSize = `${size} B`;
            if (size > 1024 * 1024) formattedSize = `${(size / (1024 * 1024)).toFixed(1)} MB`;
            else if (size > 1024) formattedSize = `${(size / 1024).toFixed(0)} KB`;

            const asset = await prisma.mediaAsset.create({
                data: {
                    filename: publicId,   // Store Cloudinary public_id for later deletion
                    url,
                    size: formattedSize,
                    type,
                    altText: altText || null,
                    category: category || null,
                    isCommon: isCommon === 'true' || isCommon === true,
                }
            });

            res.status(201).json({ success: true, asset });
        } catch (error) {
            console.error('[MediaController] uploadMedia error:', error);
            res.status(500).json({ error: 'Failed to save media upload to database.' });
        }
    }

    // DELETE /api/media/:id
    static async deleteMedia(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;

            const asset = await prisma.mediaAsset.findUnique({ where: { id } });
            if (!asset) {
                res.status(404).json({ error: 'Media asset not found.' });
                return;
            }

            // Delete from Cloudinary using the stored public_id (filename field)
            // resource_type auto-detected: images vs raw (PDF/icons)
            const resourceType = asset.type === 'document' || asset.type === 'icon' ? 'raw' : 'image';
            try {
                await cloudinary.uploader.destroy(asset.filename, { resource_type: resourceType });
            } catch (cloudinaryErr) {
                // Log but don't block DB cleanup — asset may have already been removed from Cloudinary
                console.error('[MediaController] Cloudinary delete warning:', cloudinaryErr);
            }

            // Delete the database record
            await prisma.mediaAsset.delete({ where: { id } });

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('[MediaController] deleteMedia error:', error);
            res.status(500).json({ error: 'Failed to delete media asset.' });
        }
    }
}
