import { Request, Response } from 'express';
import { prisma } from '../index';
import axios from 'axios';

export class PublishController {

    // POST /api/cms/publish
    static async publishToLive(req: Request, res: Response): Promise<void> {
        try {
            console.log('[PublishController] Starting hard publish pipeline...');

            const GITHUB_TOKEN = process.env.GITHUB_CMS_PAT;
            const GITHUB_REPO = process.env.GITHUB_REPO || 'aimayo093/cyvhub'; // Default based on context
            const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
            const FILE_PATH = 'frontend/constants/cms-bundle.json';

            if (!GITHUB_TOKEN) {
                res.status(500).json({ error: 'GITHUB_CMS_PAT is not configured in environment variables.' });
                return;
            }

            // 1. GATHER ALL CMS DATA
            const [pages, sections, config] = await Promise.all([
                prisma.cMSPage.findMany({ include: { sections: { orderBy: { order: 'asc' } } } }),
                prisma.cMSSection.findMany(), // Redundant but good for backup
                prisma.globalConfig.findMany()
            ]);

            const bundle = {
                pages,
                config: config.reduce((acc: any, c) => ({ ...acc, [c.key]: c.config }), {}),
                publishedAt: new Date().toISOString(),
                environment: process.env.NODE_ENV
            };

            const contentBase64 = Buffer.from(JSON.stringify(bundle, null, 2)).toString('base64');

            // 2. GET CURRENT FILE SHA (if it exists) TO COMMIT
            let sha: string | undefined;
            try {
                const getFileResponse = await axios.get(
                    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`,
                    {
                        headers: {
                            Authorization: `token ${GITHUB_TOKEN}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                sha = getFileResponse.data.sha;
            } catch (error: any) {
                // Ignore 404 - file might not exist yet
                if (error.response?.status !== 404) {
                    throw error;
                }
            }

            // 3. COMMIT TO GITHUB
            const commitResponse = await axios.put(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
                {
                    message: `chore(cms): automated publish - ${new Date().toLocaleString()}`,
                    content: contentBase64,
                    branch: GITHUB_BRANCH,
                    sha,
                },
                {
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                    }
                }
            );

            console.log('[PublishController] GitHub commit successful:', commitResponse.data.commit.sha);

            res.status(200).json({
                success: true,
                message: 'CMS content published to GitHub successfully. Vercel deployment triggered.',
                commitSha: commitResponse.data.commit.sha,
                deploymentUrl: `https://github.com/${GITHUB_REPO}/commit/${commitResponse.data.commit.sha}`
            });

        } catch (error: any) {
            console.error('[PublishController] Publish error:', error.response?.data || error.message);
            res.status(500).json({ 
                error: 'Failed to publish to GitHub.', 
                details: error.response?.data?.message || error.message 
            });
        }
    }
}
