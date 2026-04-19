import axios from 'axios';
import { prisma } from '../index';

export class GithubSyncService {
    private static GITHUB_TOKEN = process.env.GITHUB_CMS_PAT;
    private static GITHUB_REPO = process.env.GITHUB_REPO || 'aimayo093/cyvhub';
    private static GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
    private static FILE_PATH = 'frontend/constants/cms-bundle.json';
    private static SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cyvhub.com';
    private static REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

    /**
     * Syncs the current CMS configuration from the database to GitHub.
     */
    static async syncToGithub(): Promise<string> {
        if (!this.GITHUB_TOKEN) {
            console.warn('[GithubSyncService] GITHUB_CMS_PAT not configured. Skipping GitHub sync.');
            return 'SKIPPED';
        }

        console.log('[GithubSyncService] Starting GitHub sync...');

        // 1. Gather all CMS data from DB
        const [pages, config] = await Promise.all([
            prisma.cMSPage.findMany({ include: { sections: { orderBy: { updatedAt: 'desc' } } } }),
            prisma.globalConfig.findMany()
        ]);

        const bundle = {
            pages,
            config: config.reduce((acc: any, c) => ({ ...acc, [c.key]: c.config }), {}),
            publishedAt: new Date().toISOString(),
            environment: process.env.NODE_ENV
        };

        const contentBase64 = Buffer.from(JSON.stringify(bundle, null, 2)).toString('base64');

        // 2. Get current file SHA to update
        let sha: string | undefined;
        try {
            const getFileResponse = await axios.get(
                `https://api.github.com/repos/${this.GITHUB_REPO}/contents/${this.FILE_PATH}?ref=${this.GITHUB_BRANCH}`,
                {
                    headers: {
                        Authorization: `token ${this.GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                    }
                }
            );
            sha = getFileResponse.data.sha;
        } catch (error: any) {
            if (error.response?.status !== 404) throw error;
        }

        // 3. Commit to GitHub
        const commitResponse = await axios.put(
            `https://api.github.com/repos/${this.GITHUB_REPO}/contents/${this.FILE_PATH}`,
            {
                message: `chore(cms): automated sync - ${new Date().toLocaleString()}`,
                content: contentBase64,
                branch: this.GITHUB_BRANCH,
                sha,
            },
            {
                headers: {
                    Authorization: `token ${this.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );

        const commitSha = commitResponse.data.commit.sha;
        console.log('[GithubSyncService] GitHub commit successful:', commitSha);
        return commitSha;
    }

    /**
     * Triggers Next.js on-demand revalidation.
     */
    static async triggerRevalidation(paths: string[]): Promise<void> {
        if (!this.REVALIDATE_SECRET) {
            console.warn('[GithubSyncService] REVALIDATE_SECRET not configured. Skipping revalidation.');
            return;
        }

        console.log(`[GithubSyncService] Triggering revalidation for: ${paths.join(', ')}`);

        try {
            for (const path of paths) {
                await axios.get(`${this.SITE_URL}/api/revalidate`, {
                    params: {
                        secret: this.REVALIDATE_SECRET,
                        path
                    }
                });
            }
            console.log('[GithubSyncService] Revalidation successful.');
        } catch (error: any) {
            console.error('[GithubSyncService] Revalidation failed:', error.message);
        }
    }
}
