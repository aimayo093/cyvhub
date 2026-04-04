const { calculateMiles } = require('./src/utils/google-maps.service');

async function testPostcodes() {
    try {
        console.log('Testing SA11 2AY to CF8 1AF...');
        const miles = await calculateMiles('SA11 2AY', 'CF8 1AF');
        console.log('Miles:', miles);
    } catch (err) {
        console.error('Error calculating miles:', err.message);
    }
}

testPostcodes().then(() => process.exit(0));
