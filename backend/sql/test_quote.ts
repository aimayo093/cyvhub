import { CommercialService } from '../src/services/commercial.service';

async function testEngine() {
    try {
        console.log("Generating B2B Margin Engine Quote...");
        
        const payload = {
            pickupPostcode: "M1 1AA",
            dropoffPostcode: "E1 6AN",
            distanceMiles: 200,
            items: [
                { weightKg: 200, lengthCm: 100, widthCm: 100, heightCm: 100 }
            ],
            flags: { stairs: true }
        };
        
        const result = await CommercialService.requestQuote(payload);
        console.dir(result, { depth: null });
        process.exit(0);
    } catch(err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}

testEngine();
