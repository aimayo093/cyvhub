import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Default password 'Password123!'
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
        {
            email: 'admin@cyvhub.com',
            firstName: 'System',
            lastName: 'Admin',
            role: 'admin',
        },
        {
            email: 'driver@cyvhub.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'driver',
        },
        {
            email: 'customer@cyvhub.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'customer',
        },
        {
            email: 'carrier@cyvhub.com',
            firstName: 'Global',
            lastName: 'Logistics',
            role: 'carrier',
        }
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                emailVerified: true,
                status: 'ACTIVE',
            },
            create: {
                ...user,
                passwordHash,
                emailVerified: true,
                status: 'ACTIVE',
            },
        });
        console.log(`Created/Ensured user: ${user.email}`);
    }

    // Seed mock Carriers
    const carrier = await prisma.carrierProfile.create({
        data: {
            companyName: 'Swift Transport Solutions',
            tradingName: 'Swift Logistics',
            contactFirstName: 'David',
            contactLastName: 'Miller',
            email: 'operations@swiftlogistics.co.uk',
            phone: '0800 123 4567',
            registrationNumber: 'GB12345678',
            vatNumber: 'GB 123 4567 89',
            insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
            operatorLicence: 'OL-987654321',
            operatorLicenceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            coverageRegions: JSON.stringify(['London', 'South East', 'Midlands']),
            status: 'APPROVED',
            totalJobsCompleted: 1450,
            slaScore: 98.5,
            rating: 4.8,
            vehicles: {
                create: [
                    {
                        registration: 'LD24 ABC',
                        type: 'Medium Van',
                        make: 'Ford',
                        model: 'Transit Custom',
                        year: 2024,
                        capacity: '1000kg',
                        motExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
                        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        lastService: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    },
                    {
                        registration: 'MA23 XYZ',
                        type: 'Luton Van',
                        make: 'Mercedes-Benz',
                        model: 'Sprinter',
                        year: 2023,
                        capacity: '1200kg / Tail Lift',
                        motExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
                        insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        lastService: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    }
                ]
            },
            complianceDocs: {
                create: [
                    {
                        type: 'INSURANCE',
                        status: 'VALID',
                        fileUrl: 'https://example.com/insurance.pdf',
                        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                    },
                    {
                        type: 'LICENCE',
                        status: 'VALID',
                        fileUrl: 'https://example.com/licence.pdf',
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    }
                ]
            }
        }
    });

    console.log(`Seeded carrier profile: ${carrier.companyName}`);

    // Seed Business Account
    const business = await prisma.businessAccount.create({
        data: {
            tradingName: 'TechCorp Solutions',
            companyName: 'TechCorp Ltd',
            contactEmail: 'billing@techcorp.com',
            status: 'ACTIVE',
            billingTerms: 'Net 30',
            currentBalance: 1250.00
        }
    });

    // Link Jane Smith to this business
    const jane = await prisma.user.findUnique({ where: { email: 'customer@cyvhub.com' } });
    if (jane) {
        await prisma.user.update({
            where: { id: jane.id },
            data: { businessAccountId: business.id }
        });
    }

    // Seed some Jobs for invoicing
    await prisma.job.create({
        data: {
            jobNumber: 'JOB-9901',
            status: 'DELIVERED',
            priority: 'NORMAL',
            pickupContactName: 'Warehouse 1',
            pickupContactPhone: '0123456789',
            pickupAddressLine1: 'Swansea Industrial Estate',
            pickupCity: 'Swansea',
            pickupPostcode: 'SA1 1AA',
            pickupLatitude: 51.6214,
            pickupLongitude: -3.9436,
            pickupWindowStart: '09:00',
            pickupWindowEnd: '11:00',
            dropoffContactName: 'TechCorp HQ',
            dropoffContactPhone: '0987654321',
            dropoffAddressLine1: 'Cardiff Business Park',
            dropoffCity: 'Cardiff',
            dropoffPostcode: 'CF10 1AA',
            dropoffLatitude: 51.4816,
            dropoffLongitude: -3.1791,
            dropoffWindowStart: '13:00',
            dropoffWindowEnd: '15:00',
            vehicleType: 'Small Van',
            calculatedPrice: 85.00,
            customerId: jane?.id || 'placeholder',
            businessAccountId: business.id,
            completedAt: new Date()
        }
    });

    // Seed Invoices
    await prisma.invoice.create({
        data: {
            invoiceNumber: 'INV-2023-001',
            status: 'PENDING',
            amount: 1250.00,
            date: new Date(Date.now() - 86400000 * 5),
            dueDate: new Date(Date.now() + 86400000 * 25),
            businessAccountId: business.id,
            description: 'Monthly Logistics Retainer - October'
        }
    });

    // Seed Activity Logs
    await prisma.activityLog.createMany({
        data: [
            {
                type: 'delivery_created',
                title: 'New Delivery Created',
                message: 'Your delivery from Swansea to Cardiff is being processed.',
                severity: 'info',
                userId: jane?.id
            },
            {
                type: 'payment',
                title: 'Payment Received',
                message: 'Payment for INV-2023-002 has been confirmed.',
                severity: 'info',
                amount: 450.50,
                userId: jane?.id
            }
        ]
    });

    // Seed Vehicle Classes & Pricing Engine
    const vehicleClasses = [
        { 
            name: 'SMALL_VAN', 
            maxWeight: 400.0, 
            length: 1.0, 
            width: 1.2, 
            height: 1.0, 
            baseFee: 35.00, 
            mileage: 1.25,
            desc: 'Small Van (1x1.2x1m)'
        },
        { 
            name: 'MEDIUM_VAN', 
            maxWeight: 800.0, 
            length: 2.0, 
            width: 1.2, 
            height: 1.0, 
            baseFee: 45.00, 
            mileage: 1.45,
            desc: 'Medium Van (2x1.2x1m)'
        },
        { 
            name: 'LARGE_VAN', 
            maxWeight: 1100.0, 
            length: 3.0, 
            width: 1.2, 
            height: 1.7, 
            baseFee: 65.00, 
            mileage: 1.75,
            desc: 'Large Van (3x1.2x1.7m)'
        },
        { 
            name: 'HGV', 
            maxWeight: 5000.0, 
            length: 6.0, 
            width: 2.4, 
            height: 2.5, 
            baseFee: 150.00, 
            mileage: 3.50,
            desc: 'HGV / Large Truck (6x2.4x2.5m)'
        }
    ];

    for (const vc of vehicleClasses) {
        await (prisma as any).vehicleClass.upsert({
            where: { name: vc.name },
            update: {
                maxWeightKg: vc.maxWeight,
                maxLengthCm: vc.length * 100, // Convert to CM
                maxWidthCm: vc.width * 100,
                maxHeightCm: vc.height * 100,
                baseFee: vc.baseFee,
                mileageRate: vc.mileage
            },
            create: {
                name: vc.name,
                maxWeightKg: vc.maxWeight,
                maxLengthCm: vc.length * 100,
                maxWidthCm: vc.width * 100,
                maxHeightCm: vc.height * 100,
                baseFee: vc.baseFee,
                mileageRate: vc.mileage,
                pricingRules: {
                    create: [
                        { name: 'Base Pickup Fee', type: 'BASE_FEE', amount: vc.baseFee },
                        { name: 'Standard Mileage Rate', type: 'MILEAGE', amount: vc.mileage }
                    ]
                }
            }
        });
    console.log('Ensured Vehicle Class: ${vc.name}');
    }

    // Seed Services
    const services = [
        {
            title: 'Same-Day Delivery',
            slug: 'same-day-delivery',
            tagline: 'Critical shipments delivered within hours',
            shortDescription: 'Urgent same-day delivery for time-sensitive business-critical shipments across the UK.',
            fullDescription: 'Our Same-Day Delivery service ensures your most urgent shipments reach their destination on the same day they\'re dispatched. Ideal for last-minute orders, emergency supplies, and time-critical manufacturing components. We maintain a network of available drivers ready to pick up and deliver throughout the day.\n\nWith real-time GPS tracking and dedicated driver support, you\'ll know exactly when your shipment will arrive. Our same-day service covers major UK cities and surrounding regions, with guaranteed collection and delivery windows.\n\nWe handle everything from small parcels to full van loads, with professional drivers trained in careful handling and time management. Perfect for e-commerce, manufacturing, and service industries where delays cost money.',
            keyBenefits: [
                'Next-4-hour delivery window',
                'Real-time GPS tracking',
                'Professional, insured drivers',
                'Damage-free guarantee',
                'Competitive hourly rates',
                ' Collections from anywhere in the UK',
                'Electronic proof of delivery'
            ],
            featureBlocks: [],
            icon: 'Zap',
            seoTitle: 'Same-Day Delivery Service UK | CYVhub',
            seoDescription: 'Urgent same-day delivery for business-critical shipments. Next 4-hour windows, real-time tracking, guaranteed delivery.',
            displayOrder: 1,
            isActive: true
        },
        {
            title: 'Scheduled Collections',
            slug: 'scheduled-collections',
            tagline: 'Reliable weekly or daily collections on your schedule',
            shortDescription: 'Regular scheduled collection service tailored to your business demands.',
            fullDescription: 'Scheduled Collections are perfect for businesses with predictable, recurring shipment volumes. Whether you need daily pick-ups or weekly collections, we coordinate with your operational schedule to ensure seamless logistics integration.\n\nOur scheduling system integrates with your order management, allowing automated collection requests based on your inventory levels and sales patterns. We collect at the same time each day or week, building reliability into your supply chain.\n\nIdeal for retail businesses, manufacturers, and service providers who need consistent outbound logistics. You benefit from guaranteed capacity, priority driver assignment, and stable pricing through our collection contracts.',
            keyBenefits: [
                'Predictable collection times',
                'Weekly or daily service options',
                'Dedicated driver routes',
                'Volume-based pricing',
                'Integration with your systems',
                'Automated invoicing',
                'Flexible contract terms'
            ],
            featureBlocks: [],
            icon: 'Clock',
            seoTitle: 'Scheduled Collection Service | CYVhub',
            seoDescription: 'Reliable weekly and daily collection service for businesses. Predictable logistics, dedicated routes, volume-based pricing.',
            displayOrder: 2,
            isActive: true
        },
        {
            title: 'Multi-Drop Business Routes',
            slug: 'multi-drop-business-routes',
            tagline: 'Optimized routes for multi-stop deliveries',
            shortDescription: 'Efficient multi-drop delivery routes that maximize efficiency and minimize costs.',
            fullDescription: 'Multi-Drop Business Routes consolidate multiple deliveries into optimized vehicle routes, reducing per-delivery costs and environmental impact. Perfect for businesses with customers spread across regional territories.\n\nWe use advanced route optimization algorithms to sequence your deliveries for maximum efficiency. A single vehicle handles 8-15 stops per route, reducing fuel consumption and delivery times compared to individual shipments.\n\nOur drivers are trained in professional customer service and secure signature collection. Real-time tracking keeps your customers informed, while our dispatch center monitors all vehicles for performance and on-time delivery.\n\nIdeal for wholesale distributors, service technicians, and field sales teams who need to visit multiple locations daily.',
            keyBenefits: [
                '8-15 stops per route optimized',
                'Reduced per-delivery costs',
                'Lower carbon footprint',
                'Professional customer interaction',
                'Real-time stop tracking',
                'Digital signature proof',
                'Performance analytics'
            ],
            featureBlocks: [],
            icon: 'MapPin',
            seoTitle: 'Multi-Drop Delivery Routes | CYVhub',
            seoDescription: 'Optimized multi-stop delivery routes. Reduce costs, improve efficiency, serve more customers per route.',
            displayOrder: 3,
            isActive: true
        },
        {
            title: 'Dedicated Contract Delivery',
            slug: 'dedicated-contract-delivery',
            tagline: 'Exclusive drivers and vehicles for your business',
            shortDescription: 'Dedicated delivery service with committed resources exclusively for your company.',
            fullDescription: 'Dedicated Contract Delivery provides your business with exclusive access to assigned drivers and vehicles. Your dedicated team becomes an extension of your logistics department, with consistent service delivery and deep familiarity with your operational requirements.\n\nThis model is perfect for businesses with consistent volume that requires specialized handling or specific service requirements. Your dedicated driver learns your customer base, understands your product requirements, and builds relationships with your key accounts.\n\nWe provide flexibility with scalable vehicle options (small van to HGV) and can expand or contract your fleet as seasonal demand fluctuates. Your team receives priority support and customized reporting aligned to your KPIs.\n\nCommonly used by e-commerce companies, specialized retailers, and manufacturers with significant outbound logistics needs.',
            keyBenefits: [
                'Dedicated driver assignment',
                'Exclusive vehicle fleet',
                'Consistent service quality',
                'Customized collection schedule',
                'Direct performance accountability',
                'Flexible fleet sizing',
                'Priority customer support'
            ],
            featureBlocks: [],
            icon: 'Truck',
            seoTitle: 'Dedicated Contract Delivery Service | CYVhub',
            seoDescription: 'Exclusive delivery fleet and drivers dedicated to your business. Consistent quality, customized service, scalable resources.',
            displayOrder: 4,
            isActive: true
        },
        {
            title: 'Pallet & Freight Movement',
            slug: 'pallet-freight-movement',
            tagline: 'Bulk shipments and palletized freight nationwide',
            shortDescription: 'Full-truck and part-load freight services for heavy, bulky, and palletized goods.',
            fullDescription: 'Pallet & Freight Movement handles larger shipments that require specialized equipment and professional handling. Whether you need a full truck (FTL), part load (PTL), or LTL services, we coordinate efficient freight consolidation to optimize your transportation costs.\n\nOur fleet includes standard flat-bed trucks, refrigerated vehicles, and bespoke solutions for oversized loads. All drivers are trained in safe loading, weight distribution, and secure cargo fastening.\n\nWe offer nationwide coverage with hub-and-spoke consolidation points for cost-effective part-load shipping. Your freight is tracked from collection through final delivery, with photographic evidence at each handling stage.\n\nPerfect for manufacturing, construction, retail, and wholesale businesses moving significant volumes between locations.',
            keyBenefits: [
                'Full and part-load options',
                'Nationwide hub-and-spoke network',
                'Refrigerated vehicle options',
                'Specialist equipment available',
                'Real-time freight tracking',
                'Photo documentation',
                'Competitive consolidation pricing'
            ],
            featureBlocks: [],
            icon: 'Package',
            seoTitle: 'Pallet & Freight Movement Services | CYVhub',
            seoDescription: 'Full and part-load freight services. Palletized goods, bulk shipments, specialized equipment, nationwide delivery.',
            displayOrder: 5,
            isActive: true
        },
        {
            title: 'Returns Logistics',
            slug: 'returns-logistics',
            tagline: 'Streamlined reverse logistics and product returns',
            shortDescription: 'Efficient handling of customer returns, refurbishment, and reverse supply chain logistics.',
            fullDescription: 'Returns Logistics provides end-to-end management of reverse supply chains. We collect returns from end customers, sort by condition, and route items to refurbishment, recycling, or disposal as required.\n\nOur service reduces the complexity and cost of managing returned goods. We coordinate collection from customers, maintain secure chain-of-custody documentation, and process items according to your specifications.\n\nIdeal for e-commerce businesses managing high return volumes. We integrate with your returns portal, allowing customers to schedule collections and providing tracking for their return shipments.\n\nWe handle inspection, categorization, and disposition decisions based on your guidelines. Refurbished items can be restocked, while non-repairable items are responsibly recycled or disposed of.\n\nTypically reduces logistics costs by 25-40% compared to handling returns manually.',
            keyBenefits: [
                'Customer collection coordination',
                'Automated return intake portal',
                'Condition assessment',
                'Refurbishment routing',
                'Responsible disposal',
                'Return tracking for customers',
                'Cost reduction vs. manual handling'
            ],
            featureBlocks: [],
            icon: 'Recycle',
            seoTitle: 'Returns Logistics & Reverse Supply Chain | CYVhub',
            seoDescription: 'End-to-end returns management. Customer collections, inspection, refurbishment routing, responsible disposal.',
            displayOrder: 6,
            isActive: true
        },
        {
            title: 'SLA-Based Delivery Service',
            slug: 'sla-based-delivery',
            tagline: 'Guaranteed delivery performance with SLA penalties',
            shortDescription: 'Performance-backed delivery service with guaranteed SLA metrics and penalty clauses.',
            fullDescription: 'SLA-Based Delivery Service provides the highest level of accountability with contractual service levels and performance penalties. We guarantee specific delivery times (e.g., 95% on-time delivery) and compensate you if we miss targets.\n\nThis service is designed for mission-critical deliveries where operational failures have significant business consequences. Common SLAs include on-time delivery percentage, damage rates, customer satisfaction scores, and response times for issues.\n\nWe provide detailed performance reporting, weekly reviews, and continuous improvement initiatives to maintain your SLAs. Our dispatch center prioritizes SLA deliveries and has backup drivers on standby.\n\nCommonly used by financial services, healthcare supply chains, and high-value retail where service failure directly impacts revenue or patient care.',
            keyBenefits: [
                'Contractual delivery guarantees',
                'Performance penalties if missed',
                'Detailed tracking and reporting',
                'Weekly SLA reviews',
                'Backup driver contingency',
                'Proactive issue management',
                'Priority dispatch routing'
            ],
            featureBlocks: [],
            icon: 'ShieldCheck',
            seoTitle: 'SLA-Based Delivery Service | CYVhub',
            seoDescription: 'Guaranteed delivery performance with contractual SLAs and penalty clauses. Mission-critical logistics support.',
            displayOrder: 7,
            isActive: true
        },
        {
            title: 'Live Tracking & Proof of Delivery',
            slug: 'live-tracking-pod',
            tagline: 'Real-time tracking with digital proof of delivery',
            shortDescription: 'Advanced live GPS tracking and integrated digital proof of delivery for complete visibility.',
            fullDescription: 'Live Tracking & Proof of Delivery (POD) gives your business and customers complete visibility throughout the delivery journey. Real-time GPS tracking shows exact vehicle location, with estimated arrival times updated continuously.\n\nOur mobile POD system captures digital signature, photo evidence, delivery time, and driver notes at each stop. This creates a legally defensible record of delivery and addresses any customer disputes immediately.\n\nCustomers receive SMS/email notifications when the driver is 30 minutes away, at delivery, and upon completion. QR codes on parcels allow instant access to tracking information.\n\nPerfect for high-value deliveries, customer-facing businesses, and operations where accountability is critical. Integrates with your inventory and customer systems for seamless status updates.\n\nReduces delivery disputes by 95% compared to traditional methods.',
            keyBenefits: [
                'Real-time GPS tracking',
                'Digital signature capture',
                'Photo evidence at delivery',
                'Customer SMS/email notifications',
                'QR-code enabled tracking',
                'Dispute resolution documentation',
                'Integration with your systems'
            ],
            featureBlocks: [],
            icon: 'Target',
            seoTitle: 'Live Tracking & Proof of Delivery | CYVhub',
            seoDescription: 'Real-time GPS tracking and digital proof of delivery. Complete visibility, customer notifications, dispute resolution.',
            displayOrder: 8,
            isActive: true
        },
        {
            title: 'Account-Based Invoicing',
            slug: 'account-based-invoicing',
            tagline: 'Consolidated monthly invoicing for business accounts',
            shortDescription: 'Flexible invoicing solutions for large businesses with multiple locations and volume discounts.',
            fullDescription: 'Account-Based Invoicing consolidates all your logistics transactions into a single monthly invoice with volume-based discounts. Perfect for large businesses with multiple departments, locations, or franchise operations.\n\nWe offer flexible billing arrangements including cost-per-delivery, cost-per-km, or fixed monthly contracts. Detailed line-item invoicing shows breakdown by location, service type, and cost center for easy accounting integration.\n\nAutomated invoicing integrates with your accounting software (Sage, Xero, QuickBooks), reducing manual data entry and accelerating month-end close processes.\n\nLarge volume accounts receive tiered discounts, dedicated account management, and custom reporting. Payment terms can be negotiated from C.O.D. to 60-day net accounts depending on creditworthiness.\n\nCommon for national retailers, logistics service providers, and multi-location service businesses.',
            keyBenefits: [
                'Consolidated monthly invoicing',
                'Volume-based discount tiers',
                'Flexible billing arrangements',
                'Accounting software integration',
                'Detailed cost center reporting',
                'Negotiable payment terms',
                'Dedicated account management'
            ],
            featureBlocks: [],
            icon: 'FileText',
            seoTitle: 'Account-Based Invoicing | CYVhub',
            seoDescription: 'Consolidated invoicing for businesses. Volume discounts, accounting integration, detailed reporting.',
            displayOrder: 9,
            isActive: true
        },
        {
            title: 'Route Planning & Dispatch Management',
            slug: 'route-planning-dispatch',
            tagline: 'Advanced dispatch system with AI-powered route optimization',
            shortDescription: 'Professional dispatch management with AI optimization for efficient multi-stop routes.',
            fullDescription: 'Route Planning & Dispatch Management uses advanced algorithms to automatically optimize delivery routes based on real-time traffic, customer time windows, vehicle capacity, and driver availability.\n\nOur system analyzes historical delivery data to predict optimal routes and continuously adapts as conditions change. Machine learning models improve efficiency over time, with typical savings of 15-25% in distance and fuel consumption.\n\nDrivers receive turn-by-turn navigation with alternate route options if traffic develops. The system automatically handles dynamic requests (same-day additions, cancellations, re-sequences) without requiring manual intervention.\n\nDispatch staff monitor all vehicles in real-time with exception alerts for late deliveries, traffic incidents, or customer issues. Mobile alerts notify customers of delay updates automatically.\n\nPerfect for businesses with complex logistics needs like delivery networks, service technician fleets, and field sales teams managing 50+ daily deliveries.',
            keyBenefits: [
                'AI-powered route optimization',
                'Real-time traffic adaptation',
                'Time-window compliance',
                'Dynamic request handling',
                'Vehicle utilization maximization',
                'Fuel savings 15-25%',
                'Exception-based alerts'
            ],
            featureBlocks: [],
            icon: 'BarChart3',
            seoTitle: 'Route Planning & Dispatch Management | CYVhub',
            seoDescription: 'AI-powered dispatch optimization. Real-time route management, time-window compliance, fuel efficiency.',
            displayOrder: 10,
            isActive: true
        }
    ];

    for (const service of services) {
        await (prisma as any).service.upsert({
            where: { slug: service.slug },
            update: service,
            create: service
        });
        console.log(`Seeded Service: ${service.title}`);
    }

    // Seed Industries
    const industries = [
        {
            title: 'Medical & Healthcare',
            slug: 'medical-healthcare',
            tagline: 'Specialist logistics for healthcare and pharmaceutical supply chains',
            shortDescription: 'Temperature-controlled and secure delivery for medical supplies, pharmaceuticals, and healthcare products.',
            fullDescription: 'The medical and healthcare sector demands absolute reliability, temperature control, and strict compliance with regulatory requirements. We provide specialized logistics for hospitals, clinics, pharmacies, and healthcare suppliers.\n\nOur temperature-controlled vehicles maintain precise conditions for pharmaceutical products, vaccines, and perishable medical supplies. All drivers undergo DBS checks and receive healthcare-specific training.\n\nWe maintain comprehensive audit trails for regulatory compliance and can handle controlled substances with appropriate security measures. Our understanding of healthcare supply chains includes emergency protocols for urgent shipments (blood products, transplant organs).\n\nQuick turnaround times ensure medical supplies reach healthcare facilities when needed, minimizing disruption to patient care. We work with major pharmaceutical distributors and private healthcare providers.',
            keyBenefits: [
                'Temperature-controlled vehicles',
                'DBS-checked drivers',
                'Regulatory compliance documentation',
                'Emergency handling protocols',
                'Chain-of-custody tracking',
                'Healthcare training',
                'Secure handling for controlled substances'
            ],
            featureBlocks: [],
            icon: 'BriefcaseMedical',
            seoTitle: 'Healthcare & Pharmaceutical Logistics | CYVhub',
            seoDescription: 'Specialist healthcare logistics. Temperature control, regulatory compliance, urgent medical supply delivery.',
            displayOrder: 1,
            isActive: true
        },
        {
            title: 'Construction & Trades',
            slug: 'construction-trades',
            tagline: 'Robust logistics for building materials, tools, and site supplies',
            shortDescription: 'Heavy-duty delivery service for construction materials, tools, and building site supplies.',
            fullDescription: 'Construction and trades businesses need logistics that handles heavy materials, awkward shapes, and tight site delivery windows. We specialize in delivering everything from bricks and timber to scaffolding and heavy machinery.\n\nOur vehicles include flatbeds for materials, enclosed vans for tools and equipment, and specialized vehicles with tail lifts for heavy items. Drivers trained in site safety and material handling ensure safe delivery to busy construction sites.\n\nWe coordinate with site managers to ensure deliveries align with construction schedules, minimizing site delays and congestion. Early morning and weekend delivery options accommodate site requirements.\n\nCommon services include bulk building material consolidation, tool delivery to multiple sites, and equipment rental delivery. We handle everything from small electrician supply runs to major material shipments.',
            keyBenefits: [
                'Heavy-duty vehicle fleet',
                'Tail-lift equipment',
                'Flatbed and enclosed options',
                'Early morning/weekend delivery',
                'Site safety trained drivers',
                'Material consolidation',
                'Multiple site delivery efficiency'
            ],
            featureBlocks: [],
            icon: 'Factory',
            seoTitle: 'Construction Material Delivery | CYVhub',
            seoDescription: 'Heavy-duty construction logistics. Building materials, site supplies, equipment delivery to construction sites.',
            displayOrder: 2,
            isActive: true
        },
        {
            title: 'IT Spare Parts & Field Service',
            slug: 'it-spare-parts-field-service',
            tagline: 'Express delivery for IT equipment and field service technician support',
            shortDescription: 'Fast, reliable delivery for IT spare parts, components, and technician support logistics.',
            fullDescription: 'IT and technology businesses operate on tight timelines where equipment downtime directly impacts business operations and revenue. We understand the urgency of IT logistics and provide express delivery for spare parts and field service support.\n\nOur network ensures rapid delivery of replacement parts to corporate offices, data centers, and customer sites. We handle sensitive electronics with appropriate packaging and anti-static protection.\n\nSupporting field service technicians is our core competency. We coordinate technician visits with parts delivery, ensuring technicians arrive with all necessary components to complete jobs first-time. This reduces customer site visits and accelerates issue resolution.\n\nWe integrate with your inventory and ticketing systems, automatically routing parts to jobs and confirming technician arrival. Same-day delivery is available for London and major UK cities.\n\nCommon for IT support companies, hardware manufacturers, and corporate IT departments.',
            keyBenefits: [
                'Express same-day delivery available',
                'Technician-coordinated logistics',
                'Anti-static secure packaging',
                'Inventory system integration',
                'Multiple site delivery optimization',
                'Technician appointment coordination',
                'First-time fix success rate focus'
            ],
            featureBlocks: [],
            icon: 'Monitor',
            seoTitle: 'IT Parts & Field Service Delivery | CYVhub',
            seoDescription: 'Express IT spare parts delivery. Field service support coordination, technician logistics, same-day delivery.',
            displayOrder: 3,
            isActive: true
        },
        {
            title: 'Manufacturing & Wholesale',
            slug: 'manufacturing-wholesale',
            tagline: 'B2B logistics for manufacturing and wholesale distribution',
            shortDescription: 'High-volume distribution and manufacturing logistics with consolidation and warehousing options.',
            fullDescription: 'Manufacturing and wholesale businesses operate at scale, requiring efficient logistics that handles high volumes while maintaining cost control. We provide tailored solutions for manufacturers distributing products and wholesalers managing inventory across multiple retail locations.\n\nOur services include finished goods consolidation, cross-docking, and hub-and-spoke distribution networks. We optimize shipping costs through part-load consolidation, reducing per-unit delivery costs significantly.\n\nFor manufacturers, we handle new product launches with rapid inventory distribution to retail partners, managing time-sensitive delivery windows and promotional support.\n\nWholesale businesses benefit from our inventory visibility and route optimization, ensuring product reaches retail partners in optimal condition. We can provide dedicated account management and implement special handling for fragile products.\n\nScalable solutions grow with your business, from 5-van fleets to 100+ vehicles managing national distribution.',
            keyBenefits: [
                'High-volume consolidation',
                'Hub-and-spoke network',
                'Cross-docking capabilities',
                'Dedicated account management',
                'Fragile product specialization',
                'National retail distribution',
                'Scalable fleet options'
            ],
            featureBlocks: [],
            icon: 'Factory',
            seoTitle: 'Manufacturing & Wholesale Distribution | CYVhub',
            seoDescription: 'B2B logistics and distribution. Consolidation, retail delivery, manufacturing support, wholesale optimization.',
            displayOrder: 4,
            isActive: true
        },
        {
            title: 'AOG & Aviation',
            slug: 'aog-aviation',
            tagline: 'Time-critical aircraft on-ground logistics and aviation support',
            shortDescription: 'Emergency logistics for aircraft on-ground (AOG) situations and aviation industry support.',
            fullDescription: 'Aircraft on-ground (AOG) situations are high-pressure emergencies where every hour of aircraft downtime costs airlines tens of thousands of pounds. We provide emergency logistics support for critical spare parts and components needed to return aircraft to service.\n\nOur AOG-trained team coordinates with airlines and maintenance contractors to identify, source, and deliver critical parts with absolute minimum delay. We maintain relationships with parts distributors globally and can arrange international sourcing when needed.\n\nDedicated AOG drivers operate 24/7 with priority access to airport facilities and maintenance hangars. We understand airport security protocols and can expedite paperwork for international parts imports.\n\nBeyond AOG, we support aviation supply chains for routine maintenance, cabin supplies, catering, and passenger services. Our drivers have aviation security clearance and training.\n\nCommon for airlines, maintenance contractors, parts distributors, and aviation support companies.',
            keyBenefits: [
                '24/7 emergency response',
                'AOG-trained operations',
                'Global parts sourcing',
                'Airport facility access',
                'Aviation security clearance',
                'International import coordination',
                'Strict time accountability'
            ],
            featureBlocks: [],
            icon: 'Plane',
            seoTitle: 'AOG & Aviation Logistics | CYVhub',
            seoDescription: 'Emergency AOG logistics. Aircraft on-ground support, critical parts delivery, aviation supply chain management.',
            displayOrder: 5,
            isActive: true
        },
        {
            title: 'Reverse Logistics',
            slug: 'reverse-logistics',
            tagline: 'Specialized reverse supply chain and product return management',
            shortDescription: 'Comprehensive reverse logistics for returns, refurbishment, and sustainable disposal.',
            fullDescription: 'Reverse logistics manages the flow of products backwards through the supply chain—from customers back to retailers, manufacturers, or disposal facilities. This growing sector requires different expertise than forward logistics.\n\nWe handle consumer returns from retail and e-commerce customers, coordinating collections, inspecting condition, and routing items to refurbishment, resale channels, or responsible recycling.\n\nFor manufacturers, we manage end-of-life product returns for warranty claims, safety recalls, or upgrade programs. We maintain secure chain-of-custody documentation and can handle sensitive electronics with data security protocols.\n\nSustainability-focused businesses use our services to maximize circular economy outcomes, refurbishing products rather than disposing them. We work with certified refurbishment centers and recyclers meeting environmental standards.\n\nWe reduce logistics costs 25-40% versus manual handling and improve sustainability metrics simultaneously.',
            keyBenefits: [
                'Consumer returns collection',
                'Condition assessment',
                'Refurbishment routing',
                'Recycling coordination',
                'Data security compliance',
                'Cost reduction vs. manual',
                'Sustainability reporting'
            ],
            featureBlocks: [],
            icon: 'Recycle',
            seoTitle: 'Reverse Logistics & Returns Management | CYVhub',
            seoDescription: 'Reverse logistics, product returns, refurbishment, sustainable recycling, end-of-life management.',
            displayOrder: 6,
            isActive: true
        },
        {
            title: 'Automotive Parts',
            slug: 'automotive-parts',
            tagline: 'Specialized automotive and aftermarket parts distribution',
            shortDescription: 'Expert logistics for automotive parts, components, and aftermarket products.',
            fullDescription: 'The automotive aftermarket requires specialized logistics for parts distribution to garages, dealerships, and retailers. We understand the urgency when repair shops need components to complete vehicle repairs and return customers\' cars quickly.\n\nOur automotive-experienced drivers know how to handle fragile components—engines, transmissions, electronics—with appropriate packaging and anti-static protection. We maintain climate-controlled vehicles for temperature-sensitive components.\n\nWe support auto parts distributors managing high volumes across multiple locations, with same-day delivery available for major UK cities. Our route optimization ensures parts reach repair facilities efficiently, minimizing delays.\n\nWe handle hazardous materials certifications for items like batteries and fluids, managing compliance documentation automatically.\n\nCommon for auto parts distributors, dealership networks, independent repair shops, and automotive manufacturers.',
            keyBenefits: [
                'Automotive-trained drivers',
                'Anti-static packaging',
                'Climate-controlled vehicles',
                'Same-day delivery available',
                'Hazmat compliance handling',
                'High-frequency delivery optimization',
                'Fragile component care'
            ],
            featureBlocks: [],
            icon: 'Truck',
            seoTitle: 'Automotive Parts Distribution | CYVhub',
            seoDescription: 'Automotive parts delivery. Aftermarket distribution, dealer network support, repair shop logistics.',
            displayOrder: 7,
            isActive: true
        },
        {
            title: 'Hospitality',
            slug: 'hospitality',
            tagline: 'Reliable supply chain for hotels, restaurants, and hospitality venues',
            shortDescription: 'Specialist delivery for food, beverages, linens, and hospitality supplies.',
            fullDescription: 'Hospitality businesses depend on reliable supply chains to serve guests consistently. We provide coordinated logistics for everything from fresh food and beverages to linens, amenities, and equipment.\n\nOur refrigerated vehicles maintain proper temperatures for food safety, with drivers trained in food handling and HACCP protocols. We understand kitchen timing and coordinate deliveries for meal preparation—early morning for breakfast, mid-day for lunch, evening for dinner services.\n\nFor hotels, we manage linen delivery and collection services, coordinating room service delivery schedules with housekeeping operations.\n\nWe handle complex multi-stop routes consolidating deliveries from multiple suppliers (food, beverages, linens, equipment) into single efficient visits, reducing supplier congestion and improving cost control.\n\nOur scheduling system integrates with hospitality PMS systems, automating delivery coordination and tracking.\n\nCommon for hotels, restaurants, catering companies, and hospitality groups managing multiple locations.',
            keyBenefits: [
                'Refrigerated food delivery',
                'HACCP-trained drivers',
                'Meal-timing coordination',
                'Linen delivery/collection',
                'Multi-supplier consolidation',
                'PMS system integration',
                'Multiple venue scheduling'
            ],
            featureBlocks: [],
            icon: 'Utensils',
            seoTitle: 'Hospitality Supply Chain Logistics | CYVhub',
            seoDescription: 'Food and beverage delivery for hotels and restaurants. Linen services, HACCP compliance, hospitality supply chain.',
            displayOrder: 8,
            isActive: true
        }
    ];

    for (const industry of industries) {
        await (prisma as any).industry.upsert({
            where: { slug: industry.slug },
            update: industry,
            create: industry
        });
        console.log(`Seeded Industry: ${industry.title}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
