-- ENSURE HGV VEHICLE CLASS AND PRICING RULES ARE PRESENT
-- Run this in the Supabase SQL Editor (https://app.supabase.com)

-- 1. Insert/Update HGV Vehicle Class
INSERT INTO "VehicleClass" ("id", "name", "isActive", "maxWeightKg", "maxLengthCm", "maxWidthCm", "maxHeightCm", "baseFee", "mileageRate", "driverPickupFee", "driverMileageRate", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(), 
    'HGV', 
    true, 
    5000.0, 
    600.0, 
    240.0, 
    250.0, 
    150.00, 
    3.50, 
    80.00, 
    2.50, 
    NOW(), 
    NOW()
)
ON CONFLICT ("name") DO UPDATE SET
    "maxWeightKg" = EXCLUDED."maxWeightKg",
    "maxLengthCm" = EXCLUDED."maxLengthCm",
    "maxWidthCm" = EXCLUDED."maxWidthCm",
    "maxHeightCm" = EXCLUDED."maxHeightCm",
    "baseFee" = EXCLUDED."baseFee",
    "mileageRate" = EXCLUDED."mileageRate",
    "updatedAt" = NOW();

-- 2. Add Pricing Rules for HGV (Optional but recommended for the engine)
INSERT INTO "PricingRule" ("id", "name", "vehicleClassId", "type", "conditionKey", "conditionMin", "conditionMax", "amount", "isPercentage", "createdAt")
SELECT 
    gen_random_uuid(), 
    'Base Pickup Fee (' || v.name || ')', 
    v.id, 
    'BASE_FEE', 
    NULL, 
    NULL, 
    NULL, 
    v."baseFee", 
    false, 
    NOW()
FROM "VehicleClass" v
WHERE v.name = 'HGV'
AND NOT EXISTS (
    SELECT 1 FROM "PricingRule" pr 
    WHERE pr."vehicleClassId" = v.id AND pr.type = 'BASE_FEE'
);

INSERT INTO "PricingRule" ("id", "name", "vehicleClassId", "type", "conditionKey", "conditionMin", "conditionMax", "amount", "isPercentage", "createdAt")
SELECT 
    gen_random_uuid(), 
    'Standard Mileage Rate (' || v.name || ')', 
    v.id, 
    'MILEAGE', 
    NULL, 
    NULL, 
    NULL, 
    v."mileageRate", 
    false, 
    NOW()
FROM "VehicleClass" v
WHERE v.name = 'HGV'
AND NOT EXISTS (
    SELECT 1 FROM "PricingRule" pr 
    WHERE pr."vehicleClassId" = v.id AND pr.type = 'MILEAGE'
);

-- 3. Verify the classes
SELECT * FROM "VehicleClass";
