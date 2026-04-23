import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up existing data...');
    // Wipe all related tables in correct order to prevent constraint errors
    await prisma.cMSRevision.deleteMany({});
    await prisma.cMSSection.deleteMany({});
    await prisma.cMSPage.deleteMany({});
    await prisma.globalConfig.deleteMany({});
    await prisma.jobOpening.deleteMany({});
    await prisma.industry.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.pageContent.deleteMany({});
    console.log('Database wiped.');

    // 1. Seed Services (10 Professional Services)
    const servicesData = [
        {
            title: 'Same-Day Delivery',
            slug: 'same-day-delivery',
            tagline: 'Critical shipments delivered within hours',
            shortDescription: 'Urgent same-day delivery for time-sensitive business-critical shipments across the UK.',
            fullDescription: 'Our Same-Day Delivery service ensures your most urgent shipments reach their destination on the same day they\'re dispatched. Ideal for last-minute orders, emergency supplies, and time-critical manufacturing components.',
            keyBenefits: ['Next-4-hour delivery window', 'Real-time GPS tracking', 'Professional, insured drivers', 'Electronic proof of delivery'],
            featureBlocks: [],
            icon: 'Zap',
            seoTitle: 'Same-Day Delivery Service UK | CYVhub',
            seoDescription: 'Urgent same-day delivery for business-critical shipments.',
            displayOrder: 1,
            isActive: true,
            // Premium Fields for GlobalConfig
            premium: {
                summary: 'Fast and dependable same-day logistics support for urgent business consignments.',
                heroHeading: 'Same-Day Delivery for Time-Critical Business Requirements',
                heroSubtext: 'CYVhub helps businesses move urgent consignments quickly and professionally.',
                overview: 'Same-day delivery is essential for businesses that cannot afford delays.',
                benefits: ['Faster response', 'Reduced downtime', 'Improved continuity', 'Visibility'],
                useCases: ['Urgent spare parts', 'Documents', 'Medical supplies'],
                whyChooseUs: ['Speed', 'Accountability', 'B2B Focus'],
                howItWorks: 'Assign, track, and deliver in one straight run.',
                ctaHeading: 'Need an urgent delivery?',
                ctaText: 'Contact CYVhub for responsive support.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155'
            }
        },
        {
            title: 'Scheduled Collections',
            slug: 'scheduled-collections',
            tagline: 'Reliable weekly or daily collections',
            shortDescription: 'Regular scheduled collection service tailored to your business demands.',
            fullDescription: 'Scheduled Collections are perfect for businesses with predictable, recurring shipment volumes.',
            keyBenefits: ['Predictable timing', 'Daily/Weekly options', 'Volume pricing'],
            featureBlocks: [],
            icon: 'Calendar',
            seoTitle: 'Scheduled Collection Service | CYVhub',
            seoDescription: 'Reliable weekly and daily collection service.',
            displayOrder: 2,
            isActive: true,
            premium: {
                summary: 'Planned collection services for consistent business movement.',
                heroHeading: 'Scheduled Collections That Support Consistent Operations',
                heroSubtext: 'Simplify recurring collections with reliable logistics.',
                overview: 'Create consistency in the movement of goods between sites.',
                benefits: ['Consistency', 'Time saved', 'Better planning'],
                useCases: ['Supplier pickups', 'Warehouse collections', 'Branch transfers'],
                whyChooseUs: ['Structure', 'Reliability'],
                howItWorks: 'Choose a pattern, we manage the timing.',
                ctaHeading: 'Need recurring collections?',
                ctaText: 'Talk to us about a tailored schedule.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59'
            }
        },
        {
            title: 'Multi-Drop Business Routes',
            slug: 'multi-drop-business-routes',
            tagline: 'Optimized routes for multi-stop deliveries',
            shortDescription: 'Efficient multi-drop delivery routes that maximize efficiency.',
            fullDescription: 'Consolidate multiple deliveries into optimized vehicle routes.',
            keyBenefits: ['Consolidated stops', 'Lower costs', 'Route optimization'],
            featureBlocks: [],
            icon: 'Map',
            seoTitle: 'Multi-Drop Delivery Routes | CYVhub',
            seoDescription: 'Optimized multi-stop delivery routes for business.',
            displayOrder: 3,
            isActive: true,
            premium: {
                summary: 'Efficient multi-stop route delivery support for business locations.',
                heroHeading: 'Efficient Multi-Drop Delivery Routes for Business Operations',
                heroSubtext: 'Manage multiple deliveries on structured routes with improved efficiency.',
                overview: 'Ideal for regular deliveries to multiple destinations.',
                benefits: ['Efficiency', 'Resource optimization', 'Visibility'],
                useCases: ['Retail replenishment', 'Parts routes', 'Trade runs'],
                whyChooseUs: ['Cost reduction', 'Consistency'],
                howItWorks: 'Plan stops, assign resource, track execution.',
                ctaHeading: 'Need better route management?',
                ctaText: 'Speak to us about multi-drop logistics.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c'
            }
        },
        {
            title: 'Dedicated Contract Delivery',
            slug: 'dedicated-contract-delivery',
            tagline: 'Exclusive drivers and vehicles',
            shortDescription: 'Dedicated delivery service with committed resources for your company.',
            fullDescription: 'Your own delivery team as an extension of your business.',
            keyBenefits: ['Exclusive assignment', 'Consistent quality', 'Scalable fleet'],
            featureBlocks: [],
            icon: 'Briefcase',
            seoTitle: 'Dedicated Contract Delivery | CYVhub',
            seoDescription: 'Exclusive delivery fleet and drivers dedicated to your business.',
            displayOrder: 4,
            isActive: true,
            premium: {
                summary: 'Long-term delivery support tailored through dedicated arrangements.',
                heroHeading: 'Dedicated Contract Delivery for Ongoing Business Needs',
                heroSubtext: 'Structured, contract-based logistics designed for consistency.',
                overview: 'Dependable long-term support rather than one-off transport.',
                benefits: ['Predictability', 'Continuity', 'Operational planning'],
                useCases: ['Branch deliveries', 'Contract routes', 'Trade programmes'],
                whyChooseUs: ['Stability', 'Accountability'],
                howItWorks: 'Set up a framework around your specific needs.',
                ctaHeading: 'Need contract-based support?',
                ctaText: 'Talk to us about a dedicated solution.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55'
            }
        },
        {
            title: 'Pallet & Freight Movement',
            slug: 'pallet-and-freight-movement',
            tagline: 'Bulk shipments and palletized freight',
            shortDescription: 'Full-truck and part-load freight services for heavy goods.',
            fullDescription: 'Handle larger shipments with specialized equipment.',
            keyBenefits: ['FTL/PTL options', 'Nationwide network', 'Heavy load experts'],
            featureBlocks: [],
            icon: 'Truck',
            seoTitle: 'Pallet & Freight Movement | CYVhub',
            seoDescription: 'Professional transport for palletised goods and bulk freight.',
            displayOrder: 5,
            isActive: true,
            premium: {
                summary: 'Professional transport support for palletised goods and bulk consignments.',
                heroHeading: 'Reliable Pallet and Freight Movement for supply chains',
                heroSubtext: 'Move palletised goods and freight efficiently and professionally.',
                overview: 'Essential for larger consignments and wholesale movement.',
                benefits: ['Bulk support', 'Reliability', 'Coordinated handling'],
                useCases: ['Warehouse runs', 'Manufacturing stock', 'Wholesale distribution'],
                whyChooseUs: ['Coordination', 'Execution'],
                howItWorks: 'Coordinate collection and route based on load size.',
                ctaHeading: 'Need freight support?',
                ctaText: 'Discuss a freight solution tailored to your business.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276'
            }
        },
        {
            title: 'Returns Logistics',
            slug: 'returns-logistics',
            tagline: 'Streamlined reverse logistics',
            shortDescription: 'Efficient handling of customer returns and reverse supply chain.',
            fullDescription: 'Manage the flow of goods back to point of origin.',
            keyBenefits: ['Asset recovery', 'Consolidated returns', 'Visibility'],
            featureBlocks: [],
            icon: 'ArrowLeftRight',
            seoTitle: 'Returns Logistics | CYVhub',
            seoDescription: 'Structured logistics support for returns and recovery flows.',
            displayOrder: 6,
            isActive: true,
            premium: {
                summary: 'Structured logistics support for returns, recovery, and reverse movement.',
                heroHeading: 'Returns Logistics That Bring Structure to Reverse Flow',
                heroSubtext: 'Manage returns with better visibility, control, and consistency.',
                overview: 'Regain control of reverse movement and failed deliveries.',
                benefits: ['Control', 'Reduced disruption', 'Asset recovery'],
                useCases: ['Customer returns', 'Failed delivery recovery', 'Asset retrieval'],
                whyChooseUs: ['Structure', 'Professionalism'],
                howItWorks: 'Manage the collection and return tracking process.',
                ctaHeading: 'Need a smarter approach to returns?',
                ctaText: 'Talk to us about reverse logistics.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b'
            }
        },
        {
            title: 'SLA-Based Delivery Service',
            slug: 'sla-based-delivery-service',
            tagline: 'Guaranteed performance metrics',
            shortDescription: 'Performance-backed delivery service with agreed SLAs.',
            fullDescription: 'Highest accountability with contractual service levels.',
            keyBenefits: ['Performance guarantees', 'Weekly reviews', 'Priority dispatch'],
            featureBlocks: [],
            icon: 'ShieldCheck',
            seoTitle: 'SLA-Based Delivery Service | CYVhub',
            seoDescription: 'Logistics support built around agreed service levels.',
            displayOrder: 7,
            isActive: true,
            premium: {
                summary: 'Delivery services structured around agreed standards and accountability.',
                heroHeading: 'SLA-Based Delivery Services Built Around Expectations',
                heroSubtext: 'Align logistics to your specific operational priorities.',
                overview: 'Clear response windows and dependable execution.',
                benefits: ['Accountability', 'Predictability', 'Performance control'],
                useCases: ['Managed contracts', 'Healthcare ops', 'Critical routes'],
                whyChooseUs: ['Standards', 'Confidence'],
                howItWorks: 'Define parameters, we deliver through a managed framework.',
                ctaHeading: 'Need SLA-based support?',
                ctaText: 'Speak to us about an SLA model for your business.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f'
            }
        },
        {
            title: 'Live Tracking & Proof of Delivery',
            slug: 'live-tracking-proof-of-delivery',
            tagline: 'Real-time visibility and PODs',
            shortDescription: 'Advanced GPS tracking and integrated digital proof of delivery.',
            fullDescription: 'Complete visibility throughout the delivery journey.',
            keyBenefits: ['GPS tracking', 'Digital signatures', 'Photo evidence'],
            featureBlocks: [],
            icon: 'Target',
            seoTitle: 'Live Tracking & POD | CYVhub',
            seoDescription: 'Real-time visibility and proof of delivery support.',
            displayOrder: 8,
            isActive: true,
            premium: {
                summary: 'Real-time visibility and status updates that keep you informed.',
                heroHeading: 'Live Tracking and Proof of Delivery for Visibility',
                heroSubtext: 'Gain better visibility with real-time tracking and POD records.',
                overview: 'Confidence and confirmation at every stage.',
                benefits: ['Transparency', 'Communication', 'Accountability'],
                useCases: ['Time-sensitive jobs', 'Client-facing work', 'High-value items'],
                whyChooseUs: ['Confidence', 'Communication'],
                howItWorks: 'Track progress live and capture POD on completion.',
                ctaHeading: 'Need better visibility?',
                ctaText: 'Contact us about tracking and POD support.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155'
            }
        },
        {
            title: 'Account-Based Invoicing',
            slug: 'account-based-invoicing',
            tagline: 'Structured billing for business accounts',
            shortDescription: 'Consolidated monthly invoicing and volume discounts.',
            fullDescription: 'Simplify repeat logistics billing and financial administration.',
            keyBenefits: ['Consolidated billing', 'Volume discounts', 'Accounting integration'],
            featureBlocks: [],
            icon: 'FileText',
            seoTitle: 'Account-Based Invoicing | CYVhub',
            seoDescription: 'Business-friendly invoicing for account customers.',
            displayOrder: 9,
            isActive: true,
            premium: {
                summary: 'Structured billing and payment management for business accounts.',
                heroHeading: 'Account-Based Invoicing for Billing Control',
                heroSubtext: 'Simplify repeat logistics billing and improve administration.',
                overview: 'A structured model that supports ongoing delivery arrangements.',
                benefits: ['Easy management', 'Reduced admin', 'Better processing'],
                useCases: ['Repeat customers', 'Contract clients', 'Multi-job accounts'],
                whyChooseUs: ['Commercial ease', 'Professional workflow'],
                howItWorks: 'Logistics support handled under a professional account structure.',
                ctaHeading: 'Need structured invoicing?',
                ctaText: 'Talk to us about account-based billing.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1454165833767-1246e7f2269a'
            }
        },
        {
            title: 'Route Planning & Dispatch Management',
            slug: 'route-planning-dispatch-management',
            tagline: 'Organized route and dispatch control',
            shortDescription: 'Professional route planning and dispatch coordination.',
            fullDescription: 'Improve delivery flow and manage operations more effectively.',
            keyBenefits: ['Efficient routing', 'Dispatch control', 'Operational visibility'],
            featureBlocks: [],
            icon: 'Settings',
            seoTitle: 'Route Planning & Dispatch | CYVhub',
            seoDescription: 'Coordinated route planning and dispatch support.',
            displayOrder: 10,
            isActive: true,
            premium: {
                summary: 'Coordinated route planning and dispatch support for better flow.',
                heroHeading: 'Route Planning and Dispatch for Smarter Operations',
                heroSubtext: 'Manage logistics more effectively through organized planning.',
                overview: 'Structured support for frequent or complex operations.',
                benefits: ['Efficiency', 'Coordination', 'Scalability'],
                useCases: ['Daily routes', 'Multi-drop planning', 'Managed distribution'],
                whyChooseUs: ['Reliability', 'Control'],
                howItWorks: 'Coordinate planning, allocation, and oversight.',
                ctaHeading: 'Need smarter planning?',
                ctaText: 'Contact us about route and dispatch solutions.',
                ctaButtonText: 'Contact Us',
                ctaButtonUrl: '/contact',
                heroImageUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563'
            }
        }
    ];

    for (const s of servicesData) {
        const { premium, ...dbData } = s;
        await prisma.service.create({ data: dbData });
    }

    // 2. Seed Industries (8 Premium Industries - UPDATED COPY)
    const industriesData = [
        {
            title: "Medical & Healthcare",
            slug: "medical-healthcare",
            tagline: "Precision Logistics for Life-Critical Deliveries",
            shortDescription: "Time-critical, compliant delivery for medical supplies, diagnostics, and healthcare equipment — handled with the care your patients deserve.",
            fullDescription: "Healthcare providers operate under zero tolerance for delays. Medical consumables, surgical kits, diagnostic samples, pharmaceutical supplies, and sterile equipment must arrive on time, intact, and within strict handling parameters. A missed or mishandled delivery can have direct consequences for patient safety and clinical outcomes. Standard courier networks were not built for these stakes — they lack the protocols, the accountability, and the urgency that healthcare logistics demands.",
            keyBenefits: [
                "Same-day urgent delivery for surgical and clinical supplies",
                "SLA-guaranteed time windows for clinical scheduling",
                "Live GPS tracking with real-time visibility",
                "Electronic POD with signature and timestamp",
                "Cold-chain handling for temperature-sensitive consignments",
                "Fully auditable records for CQC compliance",
                "Dedicated account management for NHS and private clients"
            ],
            featureBlocks: [],
            icon: "heart-pulse",
            seoTitle: "Medical & Healthcare Logistics | CYVhub",
            seoDescription: "Time-critical, SLA-guaranteed delivery for NHS trusts, private clinics, and medical device companies across the UK. Live tracking, cold-chain handling, full audit trails.",
            displayOrder: 1,
            isActive: true,
            premium: {
                subtitle: "Precision Logistics for Life-Critical Deliveries",
                description: "CYVhub provides dedicated same-day and scheduled medical logistics across the UK, purpose-built for NHS trusts, private hospitals, dental practices, care homes, clinical laboratories, and medical device manufacturers. Every driver handling a medical consignment is briefed on handling requirements, and every delivery is treated with the same precision expected in a clinical environment.\n\nOur SLA-based delivery tiers guarantee defined time windows, giving clinical teams the certainty they need to plan procedures, schedule treatments, and manage patient flow. Live tracking and electronic proof of delivery provide real-time visibility and a fully auditable delivery record — essential for CQC compliance and internal governance.\n\nWe support cold-chain handling for temperature-sensitive consignments including biological samples, vaccines, and pharmaceutical products. Every collection and delivery is logged with GPS confirmation, recipient signature, timestamp, and condition notes — a complete traceability record from dispatch to receipt.\n\nAccount-based invoicing and dedicated account management give healthcare procurement teams consolidated billing, per-department cost coding, and a single point of contact for all logistics queries — eliminating the complexity of managing multiple carriers across multiple sites.",
                layoutTheme: 'center',
                accentColor: "#2563EB",
                overview: "Healthcare providers operate under zero tolerance for delays. Medical consumables, surgical kits, diagnostic samples, pharmaceutical supplies, and sterile equipment must arrive on time, intact, and within strict handling parameters. A missed or mishandled delivery can have direct consequences for patient safety and clinical outcomes. Standard courier networks were not built for these stakes — they lack the protocols, the accountability, and the urgency that healthcare logistics demands.",
                challenges: [
                    { icon: 'ShieldAlert', title: 'Zero Tolerance', desc: 'Medical deliveries cannot wait.' },
                    { icon: 'Thermometer', title: 'Temp Control', desc: 'Cold-chain integrity is non-negotiable.' }
                ],
                features: [
                    { title: 'Validated Fleet', desc: 'Logistics in temperature-validated vehicles.', icon: 'Thermometer', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae' },
                    { title: 'GXP Training', desc: 'Drivers trained in clinical handling.', icon: 'UserCheck', imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118' }
                ],
                useCases: [
                    { title: 'Pathology', desc: 'Regular lab runs.', badge: 'CRITICAL' },
                    { title: 'Pharmacy', desc: 'Daily replenishment.', badge: 'DAILY' }
                ],
                stats: [{ label: 'On-Time', value: '99.9%' }, { label: 'Audit Score', value: '100%' }],
                typicalServices: ['Diagnostic samples', 'Pharma delivery', 'Surgical kits'],
                whyChooseUs: ['Clinical expertise', 'Emergency response'],
                caseStudyTitle: 'Healthcare Success',
                caseStudyQuote: 'Absolute reliability for our clinical teams.',
                caseStudyAuthor: 'NHS Ops Director',
                ctaHeading: 'Secure your medical supply chain',
                ctaText: 'Partner with healthcare logistics specialists.',
                ctaButtonText: 'Contact Medical Team',
                heroImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
                benefits: [
                    "Same-day urgent delivery for surgical and clinical supplies",
                    "SLA-guaranteed time windows for clinical scheduling",
                    "Live GPS tracking with real-time visibility",
                    "Electronic POD with signature and timestamp",
                    "Cold-chain handling for temperature-sensitive consignments",
                    "Fully auditable records for CQC compliance",
                    "Dedicated account management for NHS and private clients"
                ],
                metaTitle: "Medical & Healthcare Logistics | CYVhub",
                metaDesc: "Time-critical, SLA-guaranteed delivery for NHS trusts, private clinics, and medical device companies across the UK. Live tracking, cold-chain handling, full audit trails."
            }
        },
        {
            title: "Construction & Trades",
            slug: "construction-trades",
            tagline: "Keeping Your Site Moving, Every Hour of the Day",
            shortDescription: "Reliable, site-ready delivery of tools, materials, and equipment to active construction sites — timed to your programme, not ours.",
            fullDescription: "Construction projects run on tight programmes and tighter margins. A delayed delivery of fixings, cable, specialist tools, or structural materials means idle operatives, missed milestones, and potential contractual penalties. Sites are often difficult to access, loads are frequently heavy or awkward, and delivery windows are dictated by site management — not by carrier convenience.",
            keyBenefits: [
                "Site-access-aware delivery scheduling",
                "Multi-drop routes for multi-site contractors",
                "Heavy and awkward load handling",
                "Pallet and freight with tail-lift capability",
                "Dedicated contract runs aligned to programme",
                "Live tracking for site managers",
                "Same-day options for urgent material shortages"
            ],
            featureBlocks: [],
            icon: "hard-hat",
            seoTitle: "Construction & Trades Logistics | CYVhub",
            seoDescription: "Site-ready delivery for construction contractors across the UK. Multi-drop routes, pallet freight, and dedicated contract logistics.",
            displayOrder: 2,
            isActive: true,
            premium: {
                subtitle: "Keeping Your Site Moving, Every Hour of the Day",
                description: "CYVhub delivers to active construction sites, merchant yards, and trade depots across the UK using a fleet equipped for heavy, bulky, and awkward loads. We coordinate with site managers to work within access restrictions and unloading windows — ensuring every delivery arrives without disruption to site operations.\n\nOur multi-drop business routes are built for contractors managing multiple active sites simultaneously. A single scheduled run can cover all your project locations efficiently — reducing transport costs and vehicle movements without compromising reliability.\n\nDedicated contract delivery means we become a true extension of your supply chain. We learn your project schedules, material call-off patterns, and site-specific requirements — so your programme stays on track regardless of supply complexity.\n\nOur pallet and freight movement capability handles your heaviest consignments — structural fixings, bulk materials, and plant equipment — using vehicles with tail-lift capability. Every load is secured, tracked, and delivered with proof of receipt.",
                layoutTheme: 'center',
                accentColor: "#D97706",
                overview: "Construction projects run on tight programmes and tighter margins. A delayed delivery of fixings, cable, specialist tools, or structural materials means idle operatives, missed milestones, and potential contractual penalties. Sites are often difficult to access, loads are frequently heavy or awkward, and delivery windows are dictated by site management — not by carrier convenience.",
                challenges: [
                    { icon: 'HardHat', title: 'Site Access', desc: 'Restricted access and safety protocols.' },
                    { icon: 'Weight', title: 'Heavy Loads', desc: 'Awkward dimensions and heavy materials.' }
                ],
                features: [
                    { title: 'Tail-Lift Fleet', desc: 'Vehicles equipped for heavy offloading.', icon: 'Truck', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952' },
                    { title: 'Site Compliance', desc: 'Drivers trained in CSCS and site protocols.', icon: 'CheckCircle', imageUrl: 'https://images.unsplash.com/photo-1541888086425-d81bb19240f5' }
                ],
                useCases: [
                    { title: 'Material Runs', desc: 'Urgent bricks/timber.', badge: 'URGENT' },
                    { title: 'Tool Recovery', desc: 'Site-to-site transfers.', badge: 'SECURE' }
                ],
                stats: [{ label: 'Site Success', value: '99.5%' }, { label: 'Avg Collection', value: '45m' }],
                typicalServices: ['Equipment replacement', 'Material consolidation'],
                whyChooseUs: ['Heavy load specialists', 'Timed site windows'],
                caseStudyTitle: 'Site Success',
                caseStudyQuote: 'They understand site windows perfectly.',
                caseStudyAuthor: 'Project Manager',
                ctaHeading: 'Keep your project on schedule',
                ctaText: 'Get heavy-duty support today.',
                ctaButtonText: 'Get Construction Quote',
                heroImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
                benefits: [
                    "Site-access-aware delivery scheduling",
                    "Multi-drop routes for multi-site contractors",
                    "Heavy and awkward load handling",
                    "Pallet and freight with tail-lift capability",
                    "Dedicated contract runs aligned to programme",
                    "Live tracking for site managers",
                    "Same-day options for urgent material shortages"
                ],
                metaTitle: "Construction & Trades Logistics | CYVhub",
                metaDesc: "Site-ready delivery for construction contractors across the UK. Multi-drop routes, pallet freight, and dedicated contract logistics."
            }
        },
        {
            title: "IT Spare Parts & Field Service",
            slug: "it-spare-parts-field-service",
            tagline: "Zero Downtime Starts with the Right Part, Right Now",
            shortDescription: "Rapid, trackable delivery of IT spare parts and field service kits to engineers across the UK — because every minute of downtime costs money.",
            fullDescription: "Field service engineers depend on receiving the correct part at the right location before stepping on site. IT failures are business-critical — every hour of downtime has a direct measurable cost. SLA clocks start when tickets open. Standard next-day services cannot support break-fix response requirements.",
            keyBenefits: [
                "Same-day and SLA-tier delivery for break-fix",
                "Real-time tracking for dispatch optimisation",
                "Electronic POD before engineer departure",
                "Returns logistics for warranty and loan units",
                "Per-job cost coding for client chargeback",
                "Multi-drop routes for field engineers",
                "UK-wide coverage including remote locations"
            ],
            featureBlocks: [],
            icon: "cpu",
            seoTitle: "IT Spare Parts & Field Service Logistics | CYVhub",
            seoDescription: "Same-day and SLA-based delivery of IT spare parts to field engineers across the UK. Real-time tracking, POD, and returns logistics.",
            displayOrder: 3,
            isActive: true,
            premium: {
                subtitle: "Zero Downtime Starts with the Right Part, Right Now",
                description: "CYVhub specialises in same-day and SLA-tier delivery of IT spare parts, replacement hardware, and field service kits to engineers and client sites across the UK. Our collection and delivery commitment starts the moment your support ticket opens.\n\nLive tracking gives field service dispatch teams real-time visibility of every part in transit. Engineers are updated dynamically on ETA, and electronic proof of delivery confirms receipt before they depart their base — eliminating wasted journeys.\n\nWe support MSPs, break-fix contractors, and hardware distributors with account-based invoicing and per-job cost coding — making client chargeback and internal cost allocation straightforward.\n\nOur returns logistics capability handles the reverse flow of failed components, warranty returns, and loan unit recoveries with full tracking and item-level confirmation at every stage.",
                layoutTheme: 'center',
                accentColor: "#0891B2",
                overview: "Field service engineers depend on receiving the correct part at the right location before stepping on site. IT failures are business-critical — every hour of downtime has a direct measurable cost. SLA clocks start when tickets open. Standard next-day services cannot support break-fix response requirements.",
                challenges: [
                    { icon: 'Cpu', title: 'Fragility', desc: 'Sensitive parts need specialized handling.' },
                    { icon: 'Zap', title: 'SLA Pressure', desc: '4-hour response windows are standard.' }
                ],
                features: [
                    { title: 'Technician Sync', desc: 'Coordinate arrival with engineers.', icon: 'Users', imageUrl: 'https://images.unsplash.com/photo-1531297172867-4d6537b9c9f4' },
                    { title: 'Secure Transit', desc: 'High-value asset protection.', icon: 'Shield', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b' }
                ],
                useCases: [
                    { title: 'Server Swap', desc: 'Mission-critical hardware.', badge: 'CRITICAL' },
                    { title: 'Deployment', desc: 'New laptop rollouts.', badge: 'VOLUME' }
                ],
                stats: [{ label: 'SLA Compliance', value: '99.7%' }, { label: 'Security', value: '100%' }],
                typicalServices: ['Data center relocation', 'Hardware swap-outs'],
                whyChooseUs: ['Tech-sector expertise', '24/7 dispatch'],
                caseStudyTitle: 'Tech Success',
                caseStudyQuote: 'They speak the language of IT support.',
                caseStudyAuthor: 'Service Manager',
                ctaHeading: 'Minimize your hardware downtime',
                ctaText: 'Partner with tech logistics experts.',
                ctaButtonText: 'Contact IT Team',
                heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
                benefits: [
                    "Same-day and SLA-tier delivery for break-fix",
                    "Real-time tracking for dispatch optimisation",
                    "Electronic POD before engineer departure",
                    "Returns logistics for warranty and loan units",
                    "Per-job cost coding for client chargeback",
                    "Multi-drop routes for field engineers",
                    "UK-wide coverage including remote locations"
                ],
                metaTitle: "IT Spare Parts & Field Service Logistics | CYVhub",
                metaDesc: "Same-day and SLA-based delivery of IT spare parts to field engineers across the UK. Real-time tracking, POD, and returns logistics."
            }
        },
        {
            title: "Manufacturing & Wholesale",
            slug: "manufacturing-wholesale",
            tagline: "Powering Your Supply Chain from Factory to Customer",
            shortDescription: "Dependable B2B delivery for manufacturers and wholesalers — scheduled runs, pallet movements, and contract logistics that keep production and orders flowing.",
            fullDescription: "A single missed inbound delivery can halt a production line. A delayed outbound order can damage a trade customer relationship built over years. Manufacturers and wholesalers need logistics partners who understand shift patterns, call-off schedules, and the ripple effect of every late delivery.",
            keyBenefits: [
                "Contract runs aligned to production schedules",
                "Pallet and bulk freight capability",
                "Scheduled factory and warehouse collections",
                "Multi-drop routes for wholesale customers",
                "Account invoicing with job-level reporting",
                "Route planning and dispatch integration",
                "Scalable capacity for seasonal peaks"
            ],
            featureBlocks: [],
            icon: "factory",
            seoTitle: "Manufacturing & Wholesale Logistics | CYVhub",
            seoDescription: "Dedicated contract delivery and pallet freight for UK manufacturers and wholesalers. Scheduled collections and account invoicing.",
            displayOrder: 4,
            isActive: true,
            premium: {
                subtitle: "Powering Your Supply Chain from Factory to Customer",
                description: "CYVhub provides dedicated contract delivery and scheduled collection services built around manufacturing shift patterns and wholesale dispatch schedules — integrating into your operation as a true logistics partner.\n\nPallet and freight movement capability handles bulk consignments, raw material inbound deliveries, and finished goods distribution using curtainsiders and flatbeds with tail-lift options.\n\nRoute planning and multi-drop delivery tools give your team real-time visibility and control, optimising sequences daily across your wholesale customer base.\n\nAccount-based invoicing with job-level reporting simplifies cost allocation for finance teams, and we scale capacity for seasonal peaks without compromising service.",
                layoutTheme: 'center',
                accentColor: "#1E40AF",
                overview: "A single missed inbound delivery can halt a production line. A delayed outbound order can damage a trade customer relationship built over years. Manufacturers and wholesalers need logistics partners who understand shift patterns, call-off schedules, and the ripple effect of every late delivery.",
                challenges: [
                    { icon: 'BarChart', title: 'Scaling', desc: 'Managing 100+ retail locations.' },
                    { icon: 'Layers', title: 'Inventory Flow', desc: 'Just-in-time material intake.' }
                ],
                features: [
                    { title: 'Trunking', desc: 'Hub-to-hub scheduled movement.', icon: 'Repeat', imageUrl: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6' },
                    { title: 'Dedicated Fleet', desc: 'Guaranteed capacity during peaks.', icon: 'Shield', imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155' }
                ],
                useCases: [
                    { title: 'Retail Launch', desc: 'Simultaneous nationwide drops.', badge: 'VOLUME' },
                    { title: 'JIT Intake', desc: 'Production line components.', badge: 'JIT' }
                ],
                stats: [{ label: 'National Coverage', value: '100%' }, { label: 'Peak Capacity', value: '500+' }],
                typicalServices: ['JIT support', 'Bulk replenishment'],
                whyChooseUs: ['Scale readiness', 'Consolidated billing'],
                caseStudyTitle: 'Supply Success',
                caseStudyQuote: 'They scale perfectly with our peaks.',
                caseStudyAuthor: 'Logistics Director',
                ctaHeading: 'Optimize your distribution',
                ctaText: 'Built for the scale of manufacturing.',
                ctaButtonText: 'Get Wholesale Quote',
                heroImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
                benefits: [
                    "Contract runs aligned to production schedules",
                    "Pallet and bulk freight capability",
                    "Scheduled factory and warehouse collections",
                    "Multi-drop routes for wholesale customers",
                    "Account invoicing with job-level reporting",
                    "Route planning and dispatch integration",
                    "Scalable capacity for seasonal peaks"
                ],
                metaTitle: "Manufacturing & Wholesale Logistics | CYVhub",
                metaDesc: "Dedicated contract delivery and pallet freight for UK manufacturers and wholesalers. Scheduled collections and account invoicing."
            }
        },
        {
            title: "AOG & Aviation",
            slug: "aog-aviation",
            tagline: "Aircraft on Ground Won't Wait — Neither Do We",
            shortDescription: "Mission-critical AOG logistics delivering aviation components anywhere in the UK within hours — because a grounded aircraft costs thousands per minute.",
            fullDescription: "An AOG event is among the most financially damaging situations in aviation. Every minute a commercial or private aircraft sits grounded translates directly into lost revenue, passenger disruption, and slot penalties. Components must be delivered with absolute urgency, correct documentation, and an unbroken chain of custody.",
            keyBenefits: [
                "Sub-hour collection response for AOG",
                "24/7 operations desk",
                "Security-cleared drivers with airside access",
                "Full chain-of-custody documentation",
                "Live GPS tracking for AOG desk",
                "SLA agreements with defined response tiers",
                "Coverage across all UK airports and MRO sites"
            ],
            featureBlocks: [],
            icon: "plane",
            seoTitle: "AOG & Aviation Logistics | CYVhub",
            seoDescription: "Sub-hour AOG response and same-day aviation component delivery across the UK. Security-cleared drivers and 24/7 operations.",
            displayOrder: 5,
            isActive: true,
            premium: {
                subtitle: "Aircraft on Ground Won't Wait — Neither Do We",
                description: "CYVhub operates a dedicated AOG response service providing same-day collection and delivery of aviation components, tooling, and documentation across the UK — responding within the hour with constant communication throughout.\n\nSecurity-cleared drivers with airside access experience handle documentation requirements including traceability records and chain-of-custody logs to meet airworthiness regulatory requirements.\n\nLive GPS tracking gives your AOG desk real-time consignment visibility. Our 24/7 operations team manages urgent requests, re-routes, and escalations immediately.\n\nSLA-based agreements with MRO operators, airlines, and ground handlers define response tiers, escalation paths, and reporting standards — a logistics partner you can rely on without exception.",
                layoutTheme: 'center',
                accentColor: "#0066FF",
                overview: "An AOG event is among the most financially damaging situations in aviation. Every minute a commercial or private aircraft sits grounded translates directly into lost revenue, passenger disruption, and slot penalties. Components must be delivered with absolute urgency, correct documentation, and an unbroken chain of custody.",
                challenges: [
                    { icon: 'Zap', title: 'Urgency', desc: 'Immediate dispatch day or night.' },
                    { icon: 'Shield', title: 'Security', desc: 'Hangar-direct access requirements.' }
                ],
                features: [
                    { title: 'Hot-Shot Dispatch', desc: '15-minute dispatch guarantee.', icon: 'Zap', imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3' },
                    { title: '24/7 Live Monitoring', desc: 'Dedicated AOG coordinators.', icon: 'Target', imageUrl: 'https://images.unsplash.com/photo-1556388275-bb554bc9ce9b' }
                ],
                useCases: [
                    { title: 'Emergency AOG', desc: 'Critical fuel pump delivery.', badge: 'EMERGENCY' },
                    { title: 'Hangar Supply', desc: 'Engine overhaul components.', badge: 'PLANNED' }
                ],
                stats: [{ label: 'Avg Response', value: '12m' }, { label: 'Success Rate', value: '100%' }],
                typicalServices: ['AOG parts delivery', 'Engine transport'],
                whyChooseUs: ['Specialist knowledge', 'Direct-to-Hangar'],
                caseStudyTitle: 'Aviation Success',
                caseStudyQuote: 'Our first and only call for AOG.',
                caseStudyAuthor: 'AOG Desk Manager',
                ctaHeading: 'Return your aircraft to service',
                ctaText: 'Emergency response specialists.',
                ctaButtonText: 'Contact AOG Desk',
                heroImageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3',
                benefits: [
                    "Sub-hour collection response for AOG",
                    "24/7 operations desk",
                    "Security-cleared drivers with airside access",
                    "Full chain-of-custody documentation",
                    "Live GPS tracking for AOG desk",
                    "SLA agreements with defined response tiers",
                    "Coverage across all UK airports and MRO sites"
                ],
                metaTitle: "AOG & Aviation Logistics | CYVhub",
                metaDesc: "Sub-hour AOG response and same-day aviation component delivery across the UK. Security-cleared drivers and 24/7 operations."
            }
        },
        {
            title: "Reverse Logistics",
            slug: "reverse-logistics",
            tagline: "Closing the Loop on Returns, Cleanly and Efficiently",
            shortDescription: "End-to-end returns collection and reverse logistics for B2B operations — tracked, documented, and processed without the operational chaos.",
            fullDescription: "Without a structured reverse logistics process, returned goods accumulate unprocessed, warranty claims stall, and credit notes are delayed. Most carriers treat returns as secondary — the result is poor tracking, missed collections, and no audit trail.",
            keyBenefits: [
                "Scheduled and on-demand returns collection",
                "Item-level POC with condition notes",
                "Full audit trail for warranty processing",
                "Multi-drop consolidated collection routes",
                "Integration with outbound contract routes",
                "Reduced cost per return",
                "Supports IT, healthcare, and manufacturing"
            ],
            featureBlocks: [],
            icon: "refresh-cw",
            seoTitle: "Reverse Logistics & Returns | CYVhub",
            seoDescription: "Structured B2B reverse logistics across the UK. Item-level tracking, audit trails, and consolidated multi-drop collection routes.",
            displayOrder: 6,
            isActive: true,
            premium: {
                subtitle: "Closing the Loop on Returns, Cleanly and Efficiently",
                description: "CYVhub provides a fully documented reverse logistics service for B2B clients across manufacturing, IT, healthcare, and distribution — collecting returns with item-level logging at point of pickup.\n\nEvery return is recorded with item details, condition notes, and collection confirmation — creating the audit trail needed for warranty, refurbishment, credit notes, or disposal processing.\n\nMulti-drop consolidated collection routes make it cost-effective to recover returns from multiple locations in a single run — reducing per-unit reverse logistics costs significantly.\n\nWhere possible, returns are integrated into existing outbound contract routes — maximising vehicle utilisation and eliminating empty return miles entirely.",
                layoutTheme: 'center',
                accentColor: "#4F46E5",
                overview: "Without a structured reverse logistics process, returned goods accumulate unprocessed, warranty claims stall, and credit notes are delayed. Most carriers treat returns as secondary — the result is poor tracking, missed collections, and no audit trail.",
                challenges: [
                    { icon: 'Eye', title: 'Lost Assets', desc: 'Slow returns sit in limbo for months.' },
                    { icon: 'Truck', title: 'Collection Friction', desc: 'Picking up from disparate sites.' }
                ],
                features: [
                    { title: 'Tracking Portal', desc: 'Integrated customer return booking.', icon: 'Check', imageUrl: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59' },
                    { title: 'Verified Pickup', desc: 'Driver condition checks at door.', icon: 'Search', imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8' }
                ],
                useCases: [
                    { title: 'Asset Recovery', desc: 'Offboarded employee laptops.', badge: 'SECURE' },
                    { title: 'Warranty', desc: 'Faulty component retrieval.', badge: 'URGENT' }
                ],
                stats: [{ label: 'Recovery Speed', value: '+40%' }, { label: 'Admin Saved', value: '15h/wk' }],
                typicalServices: ['Equipment recovery', 'Return consolidation'],
                whyChooseUs: ['Chain-of-custody', 'Asset focus'],
                caseStudyTitle: 'Reverse Success',
                caseStudyQuote: 'Recover assets in half the time.',
                caseStudyAuthor: 'Operations Manager',
                ctaHeading: 'Streamline your returns',
                ctaText: 'Turn costs into advantages.',
                ctaButtonText: 'Contact Returns Team',
                heroImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
                benefits: [
                    "Scheduled and on-demand returns collection",
                    "Item-level POC with condition notes",
                    "Full audit trail for warranty processing",
                    "Multi-drop consolidated collection routes",
                    "Integration with outbound contract routes",
                    "Reduced cost per return",
                    "Supports IT, healthcare, and manufacturing"
                ],
                metaTitle: "Reverse Logistics & Returns | CYVhub",
                metaDesc: "Structured B2B reverse logistics across the UK. Item-level tracking, audit trails, and consolidated multi-drop collection routes."
            }
        },
        {
            title: "Automotive Parts",
            slug: "automotive-parts",
            tagline: "The Right Part at the Right Bay, Right on Time",
            shortDescription: "Fast, accurate delivery of automotive parts to dealerships, bodyshops, and garages across the UK — keeping workshop bays productive and technicians earning.",
            fullDescription: "A vehicle in a workshop bay is a direct cost to both owner and repairer. Dealerships and garages depend on consistent, accurate parts supply to keep technicians productive. Delays mean customer complaints, extended courtesy car costs, and lost workshop revenue.",
            keyBenefits: [
                "Scheduled morning delivery runs",
                "Same-day for urgent unplanned requirements",
                "Multi-drop across dealership networks",
                "Electronic POD with named recipient",
                "Careful handling of precision components",
                "Dedicated contract for high-volume distributors",
                "Returns logistics for warranty parts"
            ],
            featureBlocks: [],
            icon: "car",
            seoTitle: "Automotive Parts Logistics | CYVhub",
            seoDescription: "Scheduled and same-day automotive parts delivery to UK dealerships and garages. Morning workshop runs, multi-drop routes, electronic POD.",
            displayOrder: 7,
            isActive: true,
            premium: {
                subtitle: "The Right Part at the Right Bay, Right on Time",
                description: "CYVhub delivers to franchised dealerships, independent garages, bodyshops, and fleet maintenance centres with scheduled morning runs timed to workshop windows — so technicians have what they need before the first job card.\n\nSame-day delivery handles unexpected part requirements mid-repair — collecting from your supplier within the hour and delivering to the workshop the same day, keeping the bay productive.\n\nMulti-drop routes service multiple accounts in a single optimised run, with route planning tools giving distributors full delivery sequence and ETA visibility.\n\nElectronic POD captures recipient name, timestamp, and signature at every delivery — providing the documentation needed for customer service, disputes, and warranty administration.",
                layoutTheme: 'center',
                accentColor: "#EF4444",
                overview: "A vehicle in a workshop bay is a direct cost to both owner and repairer. Dealerships and garages depend on consistent, accurate parts supply to keep technicians productive. Delays mean customer complaints, extended courtesy car costs, and lost workshop revenue.",
                challenges: [
                    { icon: 'Shield', title: 'Fragile Panels', desc: 'Body panels need specialist handling.' },
                    { icon: 'Wrench', title: 'Bay Blocking', desc: 'Every hour without parts costs revenue.' }
                ],
                features: [
                    { title: 'Bay-Direct', desc: 'Delivery before the workshop opens.', icon: 'CheckCircle', imageUrl: 'https://images.unsplash.com/photo-1486262715619-6733060a97cb' },
                    { title: 'Careful Handling', desc: 'Racks for glass and panels.', icon: 'Package', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e' }
                ],
                useCases: [
                    { title: 'Dealership Trunking', desc: 'Branch-to-branch movement.', badge: 'NETWORK' },
                    { title: 'Urgent VOR', desc: 'Same-day repair support.', badge: 'URGENT' }
                ],
                stats: [{ label: 'On-Time', value: '99.6%' }, { label: 'Damage-Free', value: '100%' }],
                typicalServices: ['VOR parts delivery', 'Daily replenishment'],
                whyChooseUs: ['Workshop-ready timing', 'Expert handling'],
                caseStudyTitle: 'Auto Success',
                caseStudyQuote: 'Improved our turnaround significantly.',
                caseStudyAuthor: 'Parts Manager',
                ctaHeading: 'Optimize your parts flow',
                ctaText: 'Partner with automotive specialists.',
                ctaButtonText: 'Get Automotive Quote',
                heroImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
                benefits: [
                    "Scheduled morning delivery runs",
                    "Same-day for urgent unplanned requirements",
                    "Multi-drop across dealership networks",
                    "Electronic POD with named recipient",
                    "Careful handling of precision components",
                    "Dedicated contract for high-volume distributors",
                    "Returns logistics for warranty parts"
                ],
                metaTitle: "Automotive Parts Logistics | CYVhub",
                metaDesc: "Scheduled and same-day automotive parts delivery to UK dealerships and garages. Morning workshop runs, multi-drop routes, electronic POD."
            }
        },
        {
            title: "Hospitality",
            slug: "hospitality",
            tagline: "Behind Every Perfect Guest Experience is a Perfect Supply Chain",
            shortDescription: "Reliable, time-critical delivery for hotels, restaurants, and event venues — so your front of house never suffers for what happens out back.",
            fullDescription: "Hospitality runs on precision timing and uncompromising standards. A restaurant short of a critical ingredient, a hotel missing its linen before check-in, or a venue without equipment on event morning — these are reputational events, not operational inconveniences.",
            keyBenefits: [
                "Same-day emergency delivery for urgent shortages",
                "Scheduled runs timed to prep windows",
                "Hour-specific event logistics",
                "Live tracking for operations teams",
                "Multi-site account management",
                "Careful handling of fragile and perishable goods",
                "Consolidated invoicing across properties"
            ],
            featureBlocks: [],
            icon: "utensils",
            seoTitle: "Hospitality Logistics | CYVhub",
            seoDescription: "Time-critical delivery for UK hotels, restaurants, and event venues. Scheduled supplier runs, event logistics, and multi-site account invoicing.",
            displayOrder: 8,
            isActive: true,
            premium: {
                subtitle: "Behind Every Perfect Guest Experience is a Perfect Supply Chain",
                description: "CYVhub provides same-day and scheduled delivery for hotels, restaurants, bars, event venues, and catering companies — planned around your operational windows, not ours.\n\nScheduled collections from food distributors, linen services, and specialist wholesalers are timed to arrive before your kitchen, housekeeping, and events teams need them.\n\nFor events, we provide hour-specific delivery of furniture, AV equipment, and catering supplies — with live tracking giving your events team real-time delivery visibility for efficient setup sequencing.\n\nAccount-based invoicing lets hospitality groups code deliveries by site or cost centre with monthly consolidated statements — giving finance teams visibility without administrative overhead.",
                layoutTheme: 'center',
                accentColor: "#7C3AED",
                overview: "Hospitality runs on precision timing and uncompromising standards. A restaurant short of a critical ingredient, a hotel missing its linen before check-in, or a venue without equipment on event morning — these are reputational events, not operational inconveniences.",
                challenges: [
                    { icon: 'Lock', title: 'Access Windows', desc: 'Narrow off-peak delivery windows.' },
                    { icon: 'Clock', title: 'Event Deadlines', desc: 'No second chances for live events.' }
                ],
                features: [
                    { title: 'Discreet Ops', desc: 'Clean vehicles and branded drivers.', icon: 'Check', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0' },
                    { title: 'Event Precision', desc: 'Timed-to-the-hour deliveries.', icon: 'Zap', imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622' }
                ],
                useCases: [
                    { title: 'Hotel Supply', desc: 'Multi-site replenishment.', badge: 'CONSISTENT' },
                    { title: 'Event Setup', desc: 'AV and decor delivery.', badge: 'TIMED' }
                ],
                stats: [{ label: 'Venues Served', value: '80+' }, { label: 'Event Success', value: '100%' }],
                typicalServices: ['Linen delivery', 'AV transport'],
                whyChooseUs: ['Discretion-first', 'Event-grade precision'],
                caseStudyTitle: 'Guest Success',
                caseStudyQuote: 'Logistics should be invisible to guests.',
                caseStudyAuthor: 'Events Operations Lead',
                ctaHeading: 'Elevate your logistics',
                ctaText: 'Partner with hospitality experts.',
                ctaButtonText: 'Get Hospitality Quote',
                heroImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd458ad20',
                benefits: [
                    "Same-day emergency delivery for urgent shortages",
                    "Scheduled runs timed to prep windows",
                    "Hour-specific event logistics",
                    "Live tracking for operations teams",
                    "Multi-site account management",
                    "Careful handling of fragile and perishable goods",
                    "Consolidated invoicing across properties"
                ],
                metaTitle: "Hospitality Logistics | CYVhub",
                metaDesc: "Time-critical delivery for UK hotels, restaurants, and event venues. Scheduled supplier runs, event logistics, and multi-site account invoicing."
            }
        }
    ];

    for (const i of industriesData) {
        const { premium, ...dbData } = i;
        await prisma.industry.create({ data: dbData });
    }

    // 3. Seed Global Configs
    const servicesPage = {
        title: "Services",
        heroHeading: "Professional B2B Logistics Services Built for Speed and Control",
        heroSubtext: "CYVhub supports businesses with practical solutions for urgent movement, scheduled operations, and dispatch management.",
        introSection: "Every business has different delivery pressures. We provide a flexible range of B2B logistics services designed for both urgent and planned movement.",
        cardIntroText: "Explore our services and discover how CYVhub helps businesses deliver with confidence.",
        ctaHeading: "Need a logistics service tailored to your business?",
        ctaText: "Speak to CYVhub about a delivery solution designed around your operational needs.",
        ctaButton: "Get in Touch",
        heroImageUrl: "https://images.unsplash.com/photo-1566846108151-512140c83a54"
    };

    const industriesPage = {
        title: "Industries We Serve",
        heroHeading: "B2B Logistics Solutions Built Around Your Industry",
        heroSubtext: "Dependable, time-critical, and scheduled logistics solutions tailored to your sector.",
        introSection: "Every industry has its own operational pressure. CYVhub is built to support a wide range of sectors with flexible logistics services.",
        cardIntroHeading: "Sector Expertise",
        cardIntroText: "Specialized solutions for the most demanding industry sectors in the UK.",
        ctaHeading: "Tailored Logistics for Your Industry",
        ctaText: "Optimize your specific supply chain requirements with our expertise.",
        ctaButton: "Contact Specialists"
    };

    const aboutPage = {
        heroTitle: "Redefining Logistics through Intelligent Dispatch",
        heroSubtitle: "CYVhub is the next-generation logistics platform that bridges the gap between carriers, drivers, and businesses through real-time automation.",
        heroImageUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59",
        
        stats: [
            { label: "Deliveries", value: "2M+" },
            { label: "Active Drivers", value: "15k" },
            { label: "UK Coverage", value: "99%" },
            { label: "SLA Adherence", value: "99.8%" }
        ],

        storyTag: "OUR STORY",
        storyTitle: "From Local Couriers to a Global Logistics Network",
        storyDesc: "Founded on the principle that logistics should be transparent and effortless, CYVhub has evolved into a leading technology-driven delivery partner.",
        storyImageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c",

        missionTitle: "Empowering the Movement of Goods",
        missionDesc: "To provide businesses with the most efficient, transparent, and reliable dispatch network in the UK.",
        visionTitle: "The Future of Smart Logistics",
        visionDesc: "A world where every delivery is optimized, every driver is empowered, and every business has complete control over their supply chain.",

        teamTag: "LEADERSHIP",
        teamTitle: "The Minds Behind CYVhub",
        teamDesc: "Our leadership team brings together decades of experience in logistics, technology, and operational excellence.",
        teamHighlights: [
            {
                name: "James Wilson",
                role: "Chief Executive Officer",
                bio: "20+ years in global logistics and supply chain optimization.",
                imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a"
            },
            {
                name: "Sarah Chen",
                role: "Chief Technology Officer",
                bio: "Expert in AI-driven dispatch algorithms and scalable cloud architecture.",
                imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"
            }
        ],

        valuesTitle: "Core Values That Drive Us",
        values: [
            { title: "Reliability", desc: "We deliver on our promises, every single time.", icon: "Shield" },
            { title: "Innovation", desc: "Constant improvement through technology.", icon: "Zap" },
            { title: "Transparency", desc: "Real-time visibility for everyone in the chain.", icon: "Eye" }
        ],

        officeAddress: "Unit 14, Gateway Logistics Park, London, E16 1AB",

        milestonesTitle: "Our Journey So Far",
        milestones: [
            { year: "2020", title: "Inception", desc: "CYVhub was founded in London." },
            { year: "2022", title: "Expansion", desc: "Reached 10,000 active drivers nationwide." },
            { year: "2024", title: "Innovation", desc: "Launched AI-driven route optimization." }
        ],

        sustainabilityTitle: "Commitment to Sustainability",
        sustainabilityItems: [
            { title: "Route Optimization", desc: "Reducing mileage by 30% through smart algorithms.", icon: "Leaf" },
            { title: "EV Network", desc: "Prioritizing electric vehicles for urban deliveries.", icon: "Zap" }
        ],

        ctaTitle: "Join the Logistics Revolution",
        ctaDesc: "Experience a smarter, faster way to manage your business deliveries.",
        ctaButtonText: "Partner with Us",
        ctaButtonUrl: "/contact"
    };

    const contactPage = {
        heroTitle: "We're Here to Help Your Business Move",
        heroSubtitle: "Get in touch with our logistics experts to discuss how CYVhub can optimize your supply chain and delivery operations.",
        heroImageUrl: "https://images.unsplash.com/photo-1516387784530-4c6f48ec7f2c",

        contactTag: "GET IN TOUCH",
        contactSideTitle: "Let's Start a Conversation",
        contactMethods: [
            { id: '1', icon: 'Phone', label: 'Call Us', value: '0800 123 4567', subtext: 'Mon-Fri, 8am-6pm' },
            { id: '2', icon: 'Mail', label: 'Email Us', value: 'hello@cyvhub.com', subtext: '24/7 Support Desk' }
        ],

        officeAddress: "Unit 14, Gateway Logistics Park, London, E16 1AB",
        officeEmail: "hq@cyvhub.com",
        officePhone: "+44 20 1234 5678",

        departmentsTitle: "Our Specialized Departments",
        departments: [
            { id: '1', name: 'General Inquiries', desc: 'For general questions about our services.', email: 'hello@cyvhub.com', phone: '0800 123 4567', icon: 'Info' },
            { id: '2', name: 'Sales & Partnerships', desc: 'Discuss business accounts and integration.', email: 'partners@cyvhub.com', phone: '0800 123 4568', icon: 'Briefcase' }
        ],

        formTitle: "Send an Inquiry",
        formDesc: "Fill out the form below and a logistics specialist will contact you within 2 hours.",

        hubsTitle: "Our Strategic Distribution Hubs",
        hubs: [
            { id: '1', city: 'London', address: 'Gateway Park, E16', coverage: 'South East UK' },
            { id: '2', city: 'Manchester', address: 'Logistics North, M29', coverage: 'Northern England' }
        ],

        faqsTitle: "Frequently Asked Questions",
        faqs: [
            { id: '1', question: 'How fast can you dispatch a driver?', answer: 'For same-day requests, we typically dispatch within 15 minutes of booking.' },
            { id: '2', question: 'Do you offer international shipping?', answer: 'Currently, we focus on nationwide UK logistics and specialized European routes.' }
        ]
    };

    // Prepare detail maps for GlobalConfig
    const serviceDetailsMap = servicesData.reduce((acc, s) => ({
        ...acc,
        [s.slug]: {
            ...s.premium,
            id: s.slug,
            slug: s.slug,
            title: s.title,
            icon: s.icon,
            publishStatus: true,
            order: s.displayOrder
        }
    }), {});

    const industryDetailsMap = industriesData.reduce((acc, i) => ({
        ...acc,
        [i.slug]: {
            ...i.premium,
            id: i.slug,
            slug: i.slug,
            title: i.title,
            icon: i.icon,
            publishStatus: true,
            order: i.displayOrder
        }
    }), {});

    // Create the master bundle
    await prisma.globalConfig.create({
        data: {
            key: 'global_cms_bundle',
            config: {
                servicesPage,
                industriesPage,
                aboutPage,
                contactPage,
                serviceDetails: serviceDetailsMap,
                industryDetails: industryDetailsMap,
                homepageData: {
                    cms_industriesConfig: {
                        title: "Industries We Serve",
                        subtitle: "Specialised solutions for your sector.",
                        showSlider: false,
                        industries: industriesData.map(ind => ({
                            id: ind.slug,
                            slug: ind.slug,
                            title: ind.title,
                            desc: ind.shortDescription,
                            imageUrl: ind.premium.heroImageUrl
                        }))
                    }
                }
            } as any,
            updatedBy: 'admin'
        }
    });

    // Individual keys for redundancy and granular fetch
    await prisma.globalConfig.create({
        data: { key: 'cms_serviceDetails', config: serviceDetailsMap as any, updatedBy: 'admin' }
    });
    await prisma.globalConfig.create({
        data: { key: 'cms_industryDetails', config: industryDetailsMap as any, updatedBy: 'admin' }
    });
    await prisma.globalConfig.create({
        data: { key: 'services_page', config: servicesPage as any, updatedBy: 'admin' }
    });
    await prisma.globalConfig.create({
        data: { key: 'industries_page', config: industriesPage as any, updatedBy: 'admin' }
    });
    await prisma.globalConfig.create({
        data: { key: 'about_page', config: aboutPage as any, updatedBy: 'admin' }
    });
    await prisma.globalConfig.create({
        data: { key: 'contact_page', config: contactPage as any, updatedBy: 'admin' }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
