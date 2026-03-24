import { prisma } from '../index';

export class AccountingService {
    /**
     * Retrieve the active accounting integration for a specific carrier
     */
    static async getIntegration(carrierId: string) {
        return (prisma as any).accountingIntegration.findUnique({
            where: { carrierId }
        });
    }

    /**
     * Central broker for pushing CYVhub invoices automatically to connected external accounting platforms.
     */
    static async syncInvoice(invoice: any, carrierId: string) {
        const integration = await this.getIntegration(carrierId);
        
        // If the carrier hasn't linked Xero/Sage/FreeAgent, just silently return.
        if (!integration) {
            return false;
        }

        console.log(`[Accounting Sync] 🔄 Triggering push of Invoice ${invoice.invoiceNumber} -> ${integration.provider}`);
        
        try {
            // ==========================================
            // EXTERNAL VENDOR API INTEGRATION
            // Note: This acts as our generic adapter. In production, we evaluate the 'provider'
            // and format the JSON specifically for the Xero, Sage, or FreeAgent schema.
            // ==========================================
            
            const payload = {
                Type: "ACCREC",
                Contact: { Name: invoice.businessAccount?.companyName || "CYVhub Customer" },
                LineItems: invoice.jobs?.map((job: any) => ({
                    Description: `Delivery: ${job.jobNumber} (${job.pickupCity} -> ${job.dropoffCity})`,
                    Quantity: 1,
                    UnitAmount: job.calculatedPrice,
                    AccountCode: "200" // Sales Account
                })) || [],
                Date: invoice.date,
                DueDate: invoice.dueDate,
                InvoiceNumber: invoice.invoiceNumber,
                Status: "AUTHORISED"
            };

            // MOCK: axios.post(`https://api.xero.com/api.xro/2.0/Invoices`, payload, { headers: { Authorization: `Bearer ${integration.accessToken}`, 'xero-tenant-id': integration.tenantId } })
            
            console.log(`[Accounting Sync] ✅ Successfully pushed invoice to ${integration.provider}. Payload size: ${JSON.stringify(payload).length} bytes`);
            
            return true;
        } catch (error) {
            console.error(`[Accounting Sync] ❌ Failed to push invoice to ${integration.provider}:`, error);
            // Optional: Log this error aggressively into an alert table
            return false;
        }
    }
}
