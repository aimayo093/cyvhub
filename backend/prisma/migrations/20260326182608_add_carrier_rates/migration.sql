-- CreateTable
CREATE TABLE "CarrierRate" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "perKmRate" DOUBLE PRECISION NOT NULL,
    "perStopRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weekendSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outOfHoursSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heavyGoodsSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarrierRate_carrierId_idx" ON "CarrierRate"("carrierId");

-- AddForeignKey
ALTER TABLE "CarrierRate" ADD CONSTRAINT "CarrierRate_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "CarrierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
