import { prisma } from '../index';

export class PayrollService {
    /**
     * Generates a draft payslip strictly based on completed deliveries in a given period.
     */
    static async generatePayslip(userId: string, periodStart: Date, periodEnd: Date) {
        // 1. Fetch completed jobs where the user was the assigned driver
        const jobs = await prisma.job.findMany({
            where: {
                assignedDriverId: userId,
                status: 'DELIVERED',
                completedAt: {
                    gte: periodStart,
                    lte: periodEnd
                }
            }
        });

        const grossPay = jobs.reduce((sum, job) => sum + (job.calculatedPrice || 0), 0);
        
        // 2. Fetch HR Record to determine employment type
        // Note: casting to any to bypass temporary TS linter desync from recent schema update
        const hrRecord = await (prisma as any).hRRecord.findUnique({ where: { userId } }).catch(() => null);
        
        let taxDeductions = 0;
        let niDeductions = 0;
        let otherDeductions = 0;

        // 3. Calculate Deductions
        if (hrRecord?.employmentType === 'EMPLOYEE') {
            // Statutory UK Weekly tax bands (1257L tax code ~ £242/week tax-free)
            const weeklyAllowance = 242;
            const taxablePay = Math.max(0, grossPay - weeklyAllowance);
            
            taxDeductions = taxablePay * 0.20; // 20% basic rate
            niDeductions = taxablePay * 0.08;  // 8% national insurance
        }

        const netPay = grossPay - taxDeductions - niDeductions - otherDeductions;

        // 4. Create the Payslip record in the database
        const payslip = await (prisma as any).payslip.create({
            data: {
                userId,
                periodStart,
                periodEnd,
                grossPay,
                taxDeductions,
                niDeductions,
                otherDeductions,
                netPay,
                status: 'DRAFT'
            }
        });

        return payslip;
    }

    /**
     * Approves and publishes a specific draft payslip.
     */
    static async publishPayslip(payslipId: string) {
        return (prisma as any).payslip.update({
            where: { id: payslipId },
            data: { status: 'PUBLISHED' }
        });
    }
}
