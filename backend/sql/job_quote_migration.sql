ALTER TABLE "Job" ADD COLUMN "quoteRequestId" TEXT;
CREATE UNIQUE INDEX "Job_quoteRequestId_key" ON "Job"("quoteRequestId");
ALTER TABLE "Job" ADD CONSTRAINT "Job_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
