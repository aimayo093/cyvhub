import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('[SEED] Starting UK-Wide Pricing Reset and Initialization...');

    // 1. Wipe old rules as requested
    console.log('[SEED] Deleting old Pricing and Payout rules...');
    await prisma.pricingRule.deleteMany({});
    await prisma.payoutRule.deleteMany({});

    // 2. Define the new UK-Wide Global Config
    const pricingConfig = {
        base_vehicle_fees: {
            CAR: 15.00,
            SMALL_VAN: 25.00,
            MEDIUM_VAN: 39.00,
            LARGE_VAN: 45.00,
            LUTON_VAN: 55.00
        },
        mileage_rates: {
            CAR: 0.85,
            SMALL_VAN: 1.10,
            MEDIUM_VAN: 1.35,
            LARGE_VAN: 1.55,
            LUTON_VAN: 1.85
        },
        parcel_handling_fees: {
            first_parcel_included: true,
            tier_1_max: 5,
            tier_1_fee: 2.50, // Parcels 2-5
            tier_2_fee: 1.50  // Parcels 6+
        },
        service_levels: [
            { id: 'ECONOMY', name: 'Economy (Next Day Window)', multiplier: 0.90 },
            { id: 'STANDARD', name: 'Standard Same Day', multiplier: 1.00 },
            { id: 'PRIORITY', name: 'Priority (Door-to-Door)', multiplier: 1.15 },
            { id: 'URGENT', name: 'Urgent / ASAP', multiplier: 1.30 }
        ],
        surcharges: {
            remote_area_flat: 15.00,
            out_of_hours_flat: 20.00,
            vat_percentage: 20.0
        },
        remote_postcode_prefixes: [
            'IV', 'KW', 'HS', 'ZE', 'AB', 'DD', 'PH', 'PA', 
            'GY', 'JE', 'IM', 'BT', 'TR21', 'TR22', 'TR23', 'TR24', 'TR25',
            'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41'
        ]
    };

    // 3. Upsert into GlobalConfig
    console.log('[SEED] Initializing GlobalConfig: pricing_engine_config');
    await prisma.globalConfig.upsert({
        where: { key: 'pricing_engine_config' },
        update: { config: pricingConfig },
        create: {
            key: 'pricing_engine_config',
            config: pricingConfig
        }
    });

    console.log('[SEED] Reset and Initialization Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
