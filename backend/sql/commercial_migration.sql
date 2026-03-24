CREATE TABLE "VehicleClass" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "maxWeightKg" DOUBLE PRECISION NOT NULL,
  "maxLengthCm" DOUBLE PRECISION NOT NULL,
  "maxWidthCm" DOUBLE PRECISION NOT NULL,
  "maxHeightCm" DOUBLE PRECISION NOT NULL,
  "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "mileageRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "driverPickupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "driverMileageRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleClass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleClass_name_key" ON "VehicleClass"("name");

CREATE TABLE "PricingRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vehicleClassId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "conditionKey" TEXT,
  "conditionMin" DOUBLE PRECISION,
  "conditionMax" DOUBLE PRECISION,
  "amount" DOUBLE PRECISION NOT NULL,
  "isPercentage" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayoutRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vehicleClassId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "conditionKey" TEXT,
  "conditionMin" DOUBLE PRECISION,
  "conditionMax" DOUBLE PRECISION,
  "amount" DOUBLE PRECISION NOT NULL,
  "isPercentage" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayoutRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequest" (
  "id" TEXT NOT NULL,
  "pickupPostcode" TEXT NOT NULL,
  "dropoffPostcode" TEXT NOT NULL,
  "distanceMiles" DOUBLE PRECISION NOT NULL,
  "actualWeightKg" DOUBLE PRECISION NOT NULL,
  "volumetricWeightKg" DOUBLE PRECISION NOT NULL,
  "chargeableWeightKg" DOUBLE PRECISION NOT NULL,
  "recommendedVehicleId" TEXT NOT NULL,
  "customerTotal" DOUBLE PRECISION NOT NULL,
  "driverPayoutTotal" DOUBLE PRECISION NOT NULL,
  "marginPercentage" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AUTO_APPROVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteLineItem" (
  "id" TEXT NOT NULL,
  "quoteRequestId" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ManualReviewCase" (
  "id" TEXT NOT NULL,
  "quoteRequestId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reviewedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManualReviewCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManualReviewCase_quoteRequestId_key" ON "ManualReviewCase"("quoteRequestId");

ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutRule" ADD CONSTRAINT "PayoutRule_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_recommendedVehicleId_fkey" FOREIGN KEY ("recommendedVehicleId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VehicleClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayoutRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteLineItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManualReviewCase" ENABLE ROW LEVEL SECURITY;
