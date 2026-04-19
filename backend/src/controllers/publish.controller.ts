import { Request, Response } from 'express';
import { prisma } from '../index';
import axios from 'axios';

export class PublishController {

    // POST /api/cms/publish
    static async publishToLive(req: Request, res: Response): Promise<void> {
        try {
            console.log('[PublishController] Starting hard publish pipeline via GithubSyncService...');
            const { GithubSyncService } = require('../services/github-sync.service');
            
            const commitSha = await GithubSyncService.syncToGithub();
            
            // Trigger broad revalidation on explicit publish
            await GithubSyncService.triggerRevalidation([
                '/',
                '/industries',
                '/services',
                '/about',
                '/contact'
            ]);

            res.status(200).json({
                success: true,
                message: 'CMS content published to GitHub successfully. Revalidation triggered.',
                commitSha
            });

        } catch (error: any) {
            console.error('[PublishController] Publish error:', error.message);
            res.status(500).json({ 
                error: 'Failed to publish to GitHub.', 
                details: error.message 
            });
        }
    }
}
