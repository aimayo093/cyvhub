const axios = require('axios');

async function testSanitization(postcode) {
    const clean = postcode.replace(/\s/g, '').toUpperCase();
    console.log(`Testing: "${postcode}" -> "${clean}"`);
    try {
        const res = await axios.get(`https://api.postcodes.io/postcodes/${clean}`);
        console.log(`Success for ${clean}: Lat ${res.data.result.latitude}, Lon ${res.data.result.longitude}`);
    } catch (e) {
        console.log(`Failed for ${clean} as expected (or API down): ${e.message}`);
    }
}

async function run() {
    await testSanitization('sa11 2ay');
    await testSanitization('SA112AY');
    await testSanitization(' cf8 1af ');
}

run();
