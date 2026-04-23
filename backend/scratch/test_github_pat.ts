import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.GITHUB_CMS_PAT;
const repo = process.env.GITHUB_REPO || 'aimayo093/cyvhub';

async function main() {
  if (!token) {
    console.error('No GITHUB_CMS_PAT found in .env');
    return;
  }

  try {
    const res = await axios.get(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }
    });
    console.log(`Success! Accessed repo: ${res.data.full_name}`);
    console.log(`Permissions: ${JSON.stringify(res.data.permissions)}`);
  } catch (error: any) {
    console.error(`Failed to access repo: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

main();
