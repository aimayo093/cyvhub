import { prisma } from './src/index';

async function main() {
    try {
        console.log("prisma.vehicleClass exists:", !!(prisma as any).vehicleClass);
    } catch (e) {
        console.error(e);
    }
}
main();
