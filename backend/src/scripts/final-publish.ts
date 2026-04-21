const { GithubSyncService } = require('../services/github-sync.service');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        console.log('Triggering GitHub sync...');
        const commitSha = await GithubSyncService.syncToGithub();
        console.log('Commit SHA:', commitSha);

        console.log('Attempting revalidation for industry pages...');
        const paths = [
            '/',
            '/industries',
            '/industries/medical-healthcare',
            '/industries/construction-trades',
            '/industries/it-spare-parts-field-service',
            '/industries/manufacturing-wholesale',
            '/industries/aog-aviation',
            '/industries/reverse-logistics',
            '/industries/automotive-parts',
            '/industries/hospitality'
        ];
        await GithubSyncService.triggerRevalidation(paths);

        console.log('Done.');
    } catch (e) {
        console.error('Failed:', e);
    }
}

run();
