// --- Types ---
export type HeaderMenuItem = {
    id: string;
    label: string;
    url: string;
};

export type HeaderConfig = {
    logoUrl: string;
    enableSticky: boolean;
    enableAnnouncement: boolean;
    announcementText: string;
    announcementLink: string;
    announcementBgColor: string;
    menuItems: HeaderMenuItem[];
    loginBtnText: string;
    loginBtnUrl: string;
};

export type HeroConfig = {
    headline: string;
    subheading: string;
    ctaText: string;
    ctaLink: string;
    bgImages: string[];
    animated: boolean;
    showGuestWidget: boolean;
    guestWidgetTitle: string;
    guestWidgetSubtitle: string;
    showVehicleSelection: boolean;
    showDateSelection: boolean;
    guestWidgetButtonText: string;
    showTrackWidget: boolean;
    trackWidgetTitle: string;
    trackWidgetSubtitle: string;
    trackWidgetButtonText: string;
};

export type SlideConfig = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
};

export type StepConfig = { id: string; num: string; title: string; desc: string; icon: string; };
export type WhyCardConfig = { id: string; title: string; desc: string; icon: string; };
export type ServiceBannerConfig = { id: string; title: string; desc: string; imageUrl: string; link: string; };

export type CustomSectionConfig = {
    id: string;
    title: string;
    subtitle: string;
    content: string;
    buttonText: string;
    buttonLink: string;
    imageUrl: string;
    alignment: 'left' | 'center' | 'right';
    backgroundColor: string;
};

export type HowItWorksConfig = {
    title: string;
    subtitle: string;
    steps: StepConfig[];
};

export type WhyUsConfig = {
    tag: string;
    title: string;
    cards: WhyCardConfig[];
};

export type ServicesConfig = {
    title: string;
    subtitle: string;
    showSlider: boolean;
    banners: ServiceBannerConfig[];
};

export type StatConfig = { id: string; label: string; value: string; icon: string; };
export type StatsConfig = {
    title: string;
    subtitle: string;
    stats: StatConfig[];
};

export type IndustryConfig = { id: string; title: string; desc: string; imageUrl: string; };
export type IndustriesConfig = {
    title: string;
    subtitle: string;
    showSlider: boolean;
    industries: IndustryConfig[];
};

export type TestimonialConfig = { id: string; author: string; role: string; content: string; avatarUrl: string; rating: number; };
export type TestimonialsConfig = {
    title: string;
    subtitle: string;
    testimonials: TestimonialConfig[];
};

export type CtaConfig = {
    title: string;
    desc: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
};

export type FooterLink = { id: string; label: string; url: string; };

export type FooterConfig = {
    companyBio: string;
    address: string;
    email: string;
    phone: string;
    twitterUrl: string;
    linkedinUrl: string;
    facebookUrl: string;
    copyright: string;
    solutionsLinks: FooterLink[];
    companyLinks: FooterLink[];
    legalLinks: FooterLink[];
};

export type VehicleOption = {
    id: string;
    title: string;
    dimensions: string;
    weight: string;
    priceEx: number;
    priceInc: number;
};

export type ServiceTier = {
    id: string;
    title: string;
    description: string;
    vehicles: VehicleOption[];
};

export type GuestQuoteConfig = {
    pageTitle: string;
    validityText: string;
    tiers: ServiceTier[];
};

export type IndustryDetail = {
    id: string;
    title: string;
    subtitle: string;
    heroImageUrl: string;
    icon: string;
    problemTitle: string;
    problemContent: string;
    solutionTitle: string;
    solutionContent: string;
    features: string[];
    stats: { label: string; value: string }[];
    equipment: { title: string; desc: string; icon: string }[];
    processSteps: { title: string; desc: string }[];
    caseStudyTitle: string;
    caseStudyQuote: string;
    caseStudyAuthor: string;
};

export type ServiceDetailConfig = {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
    imageUrl: string;
};

export type ServicesPageConfig = {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    mainServices: ServiceDetailConfig[];
    whatWeDeliverTitle: string;
    deliveryItems: WhyCardConfig[];
    ctaTitle: string;
    ctaDesc: string;
    ctaBtnText: string;
    ctaBtnUrl: string;
};

export type AboutPageConfig = {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    storyTag: string;
    storyTitle: string;
    storyContent: string;
    missionTitle: string;
    missionContent: string;
    visionTitle: string;
    visionContent: string;
    stats: { label: string; value: string; icon: string }[];
    valuesTitle: string;
    values: WhyCardConfig[];
    milestonesTitle: string;
    milestones: { year: string; title: string; desc: string }[];
    sustainabilityTag: string;
    sustainabilityTitle: string;
    sustainabilityDesc: string;
    sustainabilityItems: WhyCardConfig[];
    ctaTitle: string;
    ctaDesc: string;
    ctaBtnText: string;
    ctaBtnUrl: string;
};

export type FAQConfig = {
    id: string;
    question: string;
    answer: string;
};

export type ContactMethodConfig = {
    id: string;
    label: string;
    value: string;
    icon: string;
    subtext: string;
};

export type ContactPageConfig = {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string;
    contactTag: string;
    contactSideTitle: string;
    contactMethods: ContactMethodConfig[];
    departmentsTitle: string;
    departments: { id: string; name: string; email: string; phone: string; icon: string; desc: string }[];
    formTitle: string;
    formDesc: string;
    hubsTag: string;
    hubsTitle: string;
    hubs: { id: string; city: string; address: string; coverage: string }[];
    faqsTitle: string;
    faqs: FAQConfig[];
    officeAddress: string;
    officeEmail: string;
    officePhone: string;
    mapLatitude: number;
    mapLongitude: number;
};

// --- Mock Initial Data ---
export const initialHeader: HeaderConfig = {
    logoUrl: 'https://cyvhub.com/logo.png',
    enableSticky: true,
    enableAnnouncement: true,
    announcementText: '🚀 Breaking News: CYVhub expands nationwide! Click here for details.',
    announcementLink: '/b2b-logistics',
    announcementBgColor: '#1E40AF', // Colors.primary
    menuItems: [
        { id: '1', label: 'Home', url: '/' },
        { id: '2', label: 'Services', url: '/services' },
        { id: '3', label: 'About Us', url: '/about' },
        { id: '4', label: 'Contact', url: '/contact' },
    ],
    loginBtnText: 'Sign up / Login',
    loginBtnUrl: '/login',
};

export const initialHero: HeroConfig = {
    headline: 'Simple, speedy and secure delivery.',
    subheading: 'The UK\'s smarter B2B same day courier network. Designed for businesses that move fast.',
    ctaText: 'Get an Instant Quote',
    ctaLink: '/guest-quote',
    bgImages: [
        'https://images.unsplash.com/photo-1586528116311-ad8669966155?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1519003722824-192d992a6058?auto=format&fit=crop&q=80&w=2000',
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=2000'
    ],
    animated: true,
    showGuestWidget: true,
    guestWidgetTitle: 'Get a Quote',
    guestWidgetSubtitle: 'Instant B2B pricing in seconds.',
    showVehicleSelection: true,
    showDateSelection: true,
    guestWidgetButtonText: 'Get Instant Quote',
    showTrackWidget: true,
    trackWidgetTitle: 'Track a Parcel',
    trackWidgetSubtitle: 'Enter your tracking number below.',
    trackWidgetButtonText: 'Track Delivery',
};

export const initialSlides: SlideConfig[] = [
    {
        id: '1',
        title: 'Same Day Delivery',
        description: 'When it needs to be there today, trust our rapid response fleet.',
        imageUrl: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242',
        ctaText: 'Learn More',
        ctaLink: '/services/same-day',
    },
    {
        id: '2',
        title: 'B2B Logistics',
        description: 'Contracted runs and multi-drop delivery for enterprise clients.',
        imageUrl: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59',
        ctaText: 'View Solutions',
        ctaLink: '/services/b2b',
    },
];

export const initialHowItWorks: HowItWorksConfig = {
    title: 'How It Works',
    subtitle: 'Three simple steps to smarter logistics.',
    steps: [
        { id: '1', num: '01', title: 'Get an Instant Quote', desc: 'Enter your postcodes to instantly see available vehicles and transparent pricing.', icon: 'Calculator' },
        { id: '2', num: '02', title: 'Book Securely', desc: 'Provide basic details and securely confirm your booking in under 60 seconds.', icon: 'CheckCircle' },
        { id: '3', num: '03', title: 'Track to Delivery', desc: 'Receive live tracking and instant proof of delivery notifications.', icon: 'MapPin' },
    ]
};

export const initialWhyUs: WhyUsConfig = {
    tag: 'Why CYVhub',
    title: 'The smarter choice for B2B logistics',
    cards: [
        { id: '1', title: 'Lightning Fast', desc: 'Same day specialists with 60-minute collection nationwide.', icon: 'Zap' },
        { id: '2', title: 'Fully Insured', desc: 'Total peace of mind with comprehensive transit cover.', icon: 'ShieldCheck' },
        { id: '3', title: 'B2B Optimised', desc: 'Volume discounts, invoicing, and powerful API integrations.', icon: 'TrendingUp' },
        { id: '4', title: '24/7 Support', desc: 'Our dedicated logistics experts are always on hand to help.', icon: 'Headset' },
    ]
};

export const initialServices: ServicesConfig = {
    title: 'Our Services',
    subtitle: 'Tailored solutions for every delivery requirement.',
    showSlider: false,
    banners: [
        { id: '1', title: 'Same Day Delivery', desc: 'Direct, dedicated vehicles when speed is critical.', imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c', link: '/services' },
        { id: '2', title: 'B2B Logistics', desc: 'Scalable solutions for modern supply chains.', imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55', link: '/services' },
        { id: '3', title: 'Green Fleet', desc: 'Eco-friendly delivery options for a sustainable future.', imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276', link: '/services' },
        { id: '4', title: 'Medical & Healthcare', desc: 'Specialist handling for time-sensitive medical goods.', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f', link: '/services' },
        { id: '5', title: 'Scheduled Routes', desc: 'Regular, reliable deliveries for your recurring needs.', imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155', link: '/services' },
        { id: '6', title: 'AOG & Aviation', desc: 'Time-critical parts delivery for aircraft on ground support.', imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1', link: '/services/aviation-aog' },
    ]
};

export const initialStats: StatsConfig = {
    title: 'Trusted by the UK',
    subtitle: 'Delivering excellence every single day.',
    stats: [
        { id: '1', label: 'Deliveries Made', value: '2M+', icon: 'Package' },
        { id: '2', label: 'Active Drivers', value: '5,000+', icon: 'Users' },
        { id: '3', label: 'On-Time Rate', value: '99.8%', icon: 'Clock' },
        { id: '4', label: 'Service Centers', value: '45', icon: 'MapPin' },
    ]
};

export const initialIndustries: IndustriesConfig = {
    title: 'Industries We Serve',
    subtitle: 'Specialised logistics solutions for your sector.',
    showSlider: false,
    industries: [
        { id: 'construction', title: 'Construction & Trade', desc: 'From heavy machinery parts to architectural plans, we keep your site moving.', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd' },
        { id: 'it-tech', title: 'IT & Spare Parts', desc: 'Secure, high-value tech dispatches and mission-critical component delivery.', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475' },
        { id: 'medical', title: 'Medical & Healthcare', desc: 'Time-critical healthcare logistics for the NHS and private medical sectors.', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d' },
        { id: 'manufacturing', title: 'Manufacturing & Wholesale', desc: 'Just-in-time replenishment for production lines and bulk distribution.', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158' },
        { id: 'reverse', title: 'Reverse Logistics', desc: 'Efficient returns management, asset recovery, and recycling collections.', imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b' },
        { id: 'aviation', title: 'Aviation & AOG', desc: 'Mission-critical aerospace logistics, supporting grounded aircraft nationwide.', imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3' },
    ]
};

export const initialTestimonials: TestimonialsConfig = {
    title: 'What Our Clients Say',
    subtitle: 'Don\'t just take our word for it.',
    testimonials: [
        { id: '1', author: 'Sarah Jenkins', role: 'Logistics Manager, TechCorp', content: 'CYVhub completely transformed our supply chain. Their same-day capabilities are unmatched in the UK.', avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5 },
        { id: '2', author: 'David Chen', role: 'Operations Director, MedSupply', content: 'For urgent medical supplies, there is nobody else we trust. 99.9% on-time delivery.', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5 },
        { id: '3', author: 'Emma Watson', role: 'E-commerce Lead, StyleBox', content: 'Our customers expect rapid delivery. CYVhub allows us to promise next-day delivery with absolute certainty.', avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4 },
        { id: '4', author: 'Mark Thompson', role: 'CEO, Thompson BioTech', content: 'Reliability is everything when transporting temperature-sensitive medical supplies. CYVhub has never let us down.', avatarUrl: 'https://randomuser.me/api/portraits/men/46.jpg', rating: 5 },
        { id: '5', author: 'Sophie Reynolds', role: 'Operations Manager, Urban Fashion', content: 'The real-time tracking gives our customers peace of mind. Exceptional service and very professional drivers.', avatarUrl: 'https://randomuser.me/api/portraits/women/22.jpg', rating: 5 },
    ]
};

export const initialCta: CtaConfig = {
    title: 'Ready to upgrade your logistics?',
    desc: 'Join thousands of businesses who trust CYVhub for their crucial deliveries.',
    primaryBtnText: 'Get a Quote Now',
    primaryBtnLink: '/guest-quote',
    secondaryBtnText: 'Contact Sales',
    secondaryBtnLink: '/contact',
};

export const initialFooter: FooterConfig = {
    companyBio: "The UK's smartest B2B same day courier service. Speed, agility, and simplicity for modern businesses.",
    address: '123 Logistics Way, London, UK',
    email: 'support@cyvhub.com',
    phone: '0800 123 4567',
    twitterUrl: 'https://twitter.com',
    linkedinUrl: 'https://linkedin.com',
    facebookUrl: 'https://facebook.com',
    copyright: `© ${new Date().getFullYear()} CYVhub (a Cyvrix Limited brand). All rights reserved.`,
    companyLinks: [
        { id: '1', label: 'About Us', url: '/about' },
        { id: '2', label: 'Privacy Policy', url: '/privacy-policy' },
        { id: '3', label: 'Services', url: '/services' },
        { id: '4', label: 'Careers', url: '/careers' },
    ],
    solutionsLinks: [
        { id: '1', label: 'Same Day Delivery', url: '/same-day-delivery' },
        { id: '2', label: 'B2B Logistics', url: '/b2b-logistics' },
        { id: '3', label: 'Green Fleet', url: '/green-fleet' },
    ],
    legalLinks: [
        { id: '1', label: 'Privacy Policy', url: '/privacy' },
        { id: '2', label: 'Terms of Service', url: '/terms' },
    ]
};

export const initialGuestQuote: GuestQuoteConfig = {
    pageTitle: 'Your quote summary',
    validityText: 'Your quote is valid for 15 minutes from {time} on {date}.',
    tiers: [
        {
            id: 'tier_1',
            title: 'Same Day',
            description: "Our most cost-effective service, we'll collect by **02:24** and deliver by **17:15**",
            vehicles: [
                { id: 'v1_1', title: 'Small van', dimensions: '1 x 1.2 x 1m', weight: '400kg', priceEx: 95.61, priceInc: 114.73 },
                { id: 'v1_2', title: 'Medium van', dimensions: '2 x 1.2 x 1m', weight: '800kg', priceEx: 142.09, priceInc: 170.51 }, // Changed from Large van to Medium for consistency
                { id: 'v1_3', title: 'Large van', dimensions: '3 x 1.2 x 1.7m', weight: '1100kg', priceEx: 158.39, priceInc: 190.07 }, // Changed from XL van to Large for consistency
            ]
        },
        {
            id: 'tier_2',
            title: 'Timed',
            description: "The most popular option, we'll collect by **02:24** and deliver by **04:54** or another time after that suits you.",
            vehicles: [
                { id: 'v2_1', title: 'Small van', dimensions: '1 x 1.2 x 1m', weight: '400kg', priceEx: 114.31, priceInc: 137.17 },
                { id: 'v2_2', title: 'Medium van', dimensions: '2 x 1.2 x 1m', weight: '800kg', priceEx: 170.51, priceInc: 204.61 },
                { id: 'v2_3', title: 'Large van', dimensions: '3 x 1.2 x 1.7m', weight: '1100kg', priceEx: 189.57, priceInc: 227.48 },
            ]
        },
        {
            id: 'tier_3',
            title: 'Dedicated',
            description: "Our most secure service, we'll collect by **02:24** and deliver by **04:09**, with no other items on board.",
            vehicles: [
                { id: 'v3_1', title: 'Small van', dimensions: '1 x 1.2 x 1m', weight: '400kg', priceEx: 143.06, priceInc: 171.67 },
                { id: 'v3_2', title: 'Medium van', dimensions: '2 x 1.2 x 1m', weight: '800kg', priceEx: 212.78, priceInc: 255.34 },
                { id: 'v3_3', title: 'Large van', dimensions: '3 x 1.2 x 1.7m', weight: '1100kg', priceEx: 237.39, priceInc: 284.87 },
            ]
        }
    ]
};

export const initialServicesPage: ServicesPageConfig = {
    heroTitle: 'Industry-Specific Solutions',
    heroSubtitle: 'Expert logistics tailored for the unique demands of your business sector.',
    heroImageUrl: 'https://images.unsplash.com/photo-1566846108151-512140c83a54',
    mainServices: [
        {
            id: 'construction',
            title: 'Construction & Trade',
            description: 'Specialised logistics for the construction sector, ensuring materials reach building sites exactly when needed. We handle everything from fragile architectural models to heavy site equipment.',
            icon: 'Truck',
            features: [
                'Timed site delivery specialists',
                'FORS & HIAB coordination',
                'Nationwide 60-min collection',
                '24/7 emergency site response'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd'
        },
        {
            id: 'it-tech',
            title: 'IT & Spare Parts',
            description: 'Mission-critical delivery for the tech industry. Whether it is data center server swaps or individual consumer repairs, our secure chain-of-custody ensures zero compromise.',
            icon: 'Monitor',
            features: [
                'High-value transit insurance',
                'Tamper-proof security bags',
                'Swap-out & reverse services',
                'Static-safe handling protocols'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475'
        },
        {
            id: 'medical',
            title: 'Medical & Healthcare',
            description: 'GDP-compliant logistics for life sciences. We transport time-sensitive laboratory samples, surgical equipment, and pharmaceutical supplies with the utmost urgency and care.',
            icon: 'BriefcaseMedical',
            features: [
                'NHS courier standard',
                'MHRA compliance ready',
                'Cold-chain capable network',
                'Bespoke lab sample handling'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d'
        },
        {
            id: 'manufacturing',
            title: 'Manufacturing & Wholesale',
            description: 'Supporting UK manufacturing with lean logistics. Our JIT (Just-In-Time) delivery services ensure your production line never stops and your wholesale orders reach customers faster.',
            icon: 'Package',
            features: [
                'Line-side delivery expert',
                'Palletized bulk movements',
                'Warehouse-to-warehouse',
                'Raw material replenishment'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
        },
        {
            id: 'reverse',
            title: 'Reverse Logistics',
            description: 'Streamlined returns management to protect your bottom line. We handle asset recovery, product recalls, and efficient recycling collections for businesses of all sizes.',
            icon: 'ArrowLeftRight',
            features: [
                'Efficient returns processing',
                'Refurbishment logistics',
                'WEEE recycling compliant',
                'End-of-life asset disposal'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b'
        },
        {
            id: 'aviation',
            title: 'AOG & Aviation',
            description: 'Time-critical aerospace support and parts delivery. We understand that every second an aircraft is on the ground, revenue is flying away. Our AOG desk is active 24/7.',
            icon: 'Plane',
            features: [
                '60-minute AOG breakout',
                'Airside security clearance',
                'Dangerous goods certified',
                'Direct-to-hangar delivery'
            ],
            imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3'
        }
    ],
    whatWeDeliverTitle: 'Our Specialist Capabilities',
    deliveryItems: [
        {
            id: 'd1',
            title: 'Medical Couriers',
            desc: 'Temperature-controlled, secure transport for pharmaceuticals, samples, and medical equipment.',
            icon: 'BriefcaseMedical',
        },
        {
            id: 'd2',
            title: 'Technical Logistics',
            desc: 'Safe delivery and on-site positioning of sensitive tech, servers, and AV equipment.',
            icon: 'Monitor',
        },
        {
            id: 'd3',
            title: 'AOG & Aviation',
            desc: 'Time-critical Aircraft on Ground (AOG) support and rapid parts delivery to all UK airports.',
            icon: 'Zap',
        },
    ],
    ctaTitle: 'Ready to upgrade your logistics?',
    ctaDesc: 'Join thousands of businesses already using CYVhub for their mission-critical deliveries.',
    ctaBtnText: 'Contact Sales Team',
    ctaBtnUrl: '/contact',
};

export const initialAboutPage: AboutPageConfig = {
    heroTitle: 'Redefining the UK\'s Logistics Infrastructure',
    heroSubtitle: 'We combine advanced technology with a world-class delivery network to provide the most reliable B2B courier service in Britain.',
    heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',

    storyTag: 'Our Journey',
    storyTitle: 'Our Journey',
    storyContent: 'Founded in 2020, CYVhub emerged from a simple observation: the UK\'s same-day courier industry was stuck in the past. Fragmented networks, lack of real-time data, and unpredictable pricing were holding businesses back. We set out to build a logistics partner that operates with the speed of a startup and the reliability of a tier-1 carrier.',
    missionTitle: 'Our Mission',
    missionContent: 'To empower UK businesses with a frictionless, technology-first logistics network that delivers mission-critical assets with absolute certainty.',
    visionTitle: 'Our Vision',
    visionContent: 'To become the default infrastructure for same-day B2B transit, setting the global standard for transparency, speed, and carbon-neutral delivery.',
    stats: [
        { label: 'Deliveries Made', value: '2M+', icon: 'Package' },
        { label: 'Active Drivers', value: '5,000+', icon: 'Users' },
        { label: 'On-Time Rate', value: '99.8%', icon: 'Clock' },
        { label: 'Corporate Clients', value: '1,200+', icon: 'ShieldCheck' }
    ],
    valuesTitle: 'The CYVhub Core Values',
    values: [
        { id: '1', title: 'Absolute Transparency', desc: 'Real-time GPS tracking and instant PODs are standard, not an upgrade.', icon: 'Eye' },
        { id: '2', title: 'Carrier Reliability', desc: 'We maintain a 99.8% on-time rate through advanced route optimisation.', icon: 'ShieldCheck' },
        { id: '3', title: 'Sector Specialism', desc: 'We don\'t just move boxes; we understand the unique demands of Medical, IT, and Trade sectors.', icon: 'BriefcaseMedical' }
    ],
    milestonesTitle: 'Key Milestones',
    milestones: [
        { year: '2020', title: 'Foundation', desc: 'Launched in London with our first 50 dedicated owner-drivers.' },
        { year: '2021', title: 'Tech Stack 2.0', desc: 'Released our proprietary real-time booking and dispatch engine.' },
        { year: '2022', title: 'Nationwide Expansion', desc: 'Opened hubs in Manchester, Birmingham, and Glasgow.' },
        {
            year: '2024',
            title: 'Going Green',
            desc: 'Initiated our plan to transition to a 100% electric fleet in major cities.'
        }
    ],

    sustainabilityTag: 'Responsibility',
    sustainabilityTitle: 'Driving Towards Zero Emissions',
    sustainabilityDesc: 'As a leading logistics provider, we recognize our environmental impact. CYVhub is actively investing in green technology.',
    sustainabilityItems: [
        {
            id: '1',
            title: 'Electric Fleet',
            desc: 'Currently 30% of our city-center deliveries are completed using zero-emission electric vehicles.',
            icon: 'Zap'
        },
        {
            id: '2',
            title: 'Route Optimization',
            desc: 'Our AI software reduces empty miles by 40%, significantly cutting our overall carbon footprint.',
            icon: 'Map'
        },
        {
            id: '3',
            title: 'Offset Programs',
            desc: 'We partner with verified UK forestry projects to offset the carbon from our long-haul deliveries.',
            icon: 'Recycle' // Assuming we have a Recycle icon or Leaf
        }
    ],

    ctaTitle: 'Ready to work with the best?',
    ctaDesc: 'Discover why thousands of businesses choose CYVhub for their logistics.',
    ctaBtnText: 'Get Started',
    ctaBtnUrl: '/guest-quote',
};

export const initialContactPage: ContactPageConfig = {
    heroTitle: 'Here to keep your business moving.',
    heroSubtitle: 'Our team of logistics experts is available 24/7/365 to handle your inquiries, book urgent deliveries, or assist with your account.',
    heroImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',

    contactTag: 'Get in Touch',
    contactSideTitle: 'Corporate Support',
    contactMethods: [
        {
            id: '1',
            label: 'Sales & New Accounts',
            value: '0800 123 4567',
            icon: 'Phone', subtext: 'Mon-Fri, 8am - 8pm UK'
        },
        { id: '2', label: 'Email Support', value: 'hello@cyvhub.com', icon: 'Mail', subtext: 'Avg. response: 45 mins' },
        { id: '3', label: 'Global HQ', value: '123 Logistics Way', icon: 'MapPin', subtext: 'London, EC1A 1BB' }
    ],
    departmentsTitle: 'Specialised Departments',
    departments: [
        { id: '1', name: 'Enterprise Sales', email: 'sales@cyvhub.com', phone: '0800 123 4001', icon: 'Rocket', desc: 'Bespoke contracts for high-volume B2B senders.' },
        { id: '2', name: 'Live Operations', email: 'ops@cyvhub.com', phone: '0800 123 4002', icon: 'Clock', desc: 'Tracking, driver assistance, and urgent booking changes.' },
        { id: '3', name: 'Billing & Accounts', email: 'accounts@cyvhub.com', phone: '0800 123 4003', icon: 'FileText', desc: 'Invoicing, credit limits, and payment inquiries.' },
        {
            id: '4',
            name: 'Technical Support',
            email: 'tech@cyvhub.com',
            phone: '0800 123 4569',
            icon: 'Monitor',
            desc: '24/7 assistance for API, tracking issues, or platform bugs.'
        }
    ],

    formTitle: 'Send an Inquiry',
    formDesc: 'For bespoke logistics solutions or partnership requests, please use the form below.',

    hubsTag: 'Our Network',
    hubsTitle: 'Strategic UK Hubs',
    hubs: [
        {
            id: '1',
            city: 'London HQ', address: '123 Logistics Way, London, EC1A 1BB', coverage: 'Greater London & SE'
        },
        { id: '2', city: 'Birmingham', address: '45 Midlands Central, B1 1QU', coverage: 'Midlands & Southwest' },
        { id: '3', city: 'Manchester', address: '88 Northern Gateway, M1 1NW', coverage: 'North West & Yorkshire' },
        {
            id: '4',
            city: 'Glasgow', address: '12 Clyde Distribution, G1 1HL', coverage: 'Scotland & Borders'
        }
    ],

    faqsTitle: 'Common Questions',
    faqs: [
        {
            id: '1',
            question: 'How fast can you collect a same-day delivery?', answer: 'We aim to collect within 60 minutes across mainland UK. Delivery time depends on the direct driving distance from A to B.'
        },
        { id: '2', question: 'Do I need an account to book?', answer: 'While guest booking is available, creating a free B2B account gives you access to corporate rates, monthly invoicing, and the full CYVhub dashboard.' },
        { id: '3', question: 'What sizes of vehicles do you have?', answer: 'Our network ranges from cargo bikes and motorbikes for small parcels, up to Extra Long Wheelbase (XLWB) vans and Lutons for large pallets.' },
        { id: '4', question: 'What areas do you cover?', answer: 'We provide 60-minute collection across Mainland UK and deliver to any UK or European destination.' },
        { id: '5', question: 'How do I get proof of delivery?', answer: 'As soon as your delivery is completed, you will receive an email notification with the recipient\'s signature and a photo proof if requested.' },
        { id: '6', question: 'Can I change my delivery address after booking?', answer: 'Yes, you can contact our dispatch team via live chat or phone to update tracking details, provided the driver hasn\'t reached the destination yet.' },
        { id: '7', question: 'What items can you not carry?', answer: 'For safety reasons, we cannot carry hazardous materials (ADR), illegal substances, live animals, or currency. Please refer to our full T&Cs for details.' }
    ],
    officeAddress: '123 Logistics Way, London, UK',
    officeEmail: 'hello@cyvhub.com',
    officePhone: '0800 123 4567',
    mapLatitude: 51.5074,
    mapLongitude: -0.1278
};

export const initialIndustryDetails: Record<string, IndustryDetail> = {
    'construction': {
        id: 'construction',
        title: 'Construction & Trade Logistics',
        subtitle: 'Heavy-duty logistics for the UK\'s most ambitious building projects.',
        heroImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
        icon: 'Truck',
        problemTitle: 'The Site Delay Crisis',
        problemContent: 'In construction, time is quite literally money. Missing a 15-minute crane slot or waiting for a specific tool can ground an entire subcontracting team, leading to project slippage and liquidated damages.',
        solutionTitle: 'Precision Site Logistics',
        solutionContent: 'We specialise in timed "just-in-time" site deliveries. Our drivers are trained in site safety and we coordinate directly with site managers and traffic marshals to ensure seamless arrival.',
        features: [
            'Timed delivery for exact crane & site slots',
            'Full FORS, CLOCS & HIAB compliance support',
            'Heavy-duty vehicle network up to 7.5t',
            'Live GPS tracking for site foremen'
        ],
        stats: [
            { label: 'On-Time Rate', value: '99.7%' },
            { label: 'Site Visits/Day', value: '450+' },
            { label: 'Avg Payload', value: '1.2t' }
        ],
        equipment: [
            { title: 'Tail-Lift Vans', desc: 'Secure transit for palletised materials with easy ground-level unloading.', icon: 'Package' },
            { title: 'Flatbed Vehicles', desc: 'Open-top transport for oversized architectural models and steelwork.', icon: 'Truck' },
            { title: 'Secure Tool Vaults', desc: 'Specialised internal storage for high-value power tools and testing equipment.', icon: 'ShieldCheck' }
        ],
        processSteps: [
            { title: 'Slot Booking', desc: 'Coordinate with our dispatch team to lock in a specific 15-minute delivery window.' },
            { title: 'Direct Transit', desc: 'Materials are collected and driven directly to site with no transshipment.' },
            { title: 'Site Coordination', desc: 'Driver calls the site contact 20 minutes before arrival for final access checks.' }
        ],
        caseStudyTitle: 'Case Study: Battersea Power Station',
        caseStudyQuote: 'CYVhub managed over 500 critical timed deliveries during the peak of construction, maintaining 100% compliance with strict site access rules.',
        caseStudyAuthor: 'Project Logistics Lead'
    },
    'it-tech': {
        id: 'it-tech',
        title: 'IT & Technology Logistics',
        subtitle: 'Zero-compromise security for your mission-critical hardware.',
        heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        icon: 'Monitor',
        problemTitle: 'The High-Value Risk',
        problemContent: 'Server racks, workstations, and delicate electronics are vulnerable to theft and ESD damage during transit. Using standard parcel networks risks multi-layered delays and potential data security breaches.',
        solutionTitle: 'White-Glove Tech Handling',
        solutionContent: 'Our tech courier service treats your assets with the care they deserve. We provide dedicated vehicles, tamper-proof seals, and drivers who understand the sensitivity of enterprise hardware.',
        features: [
            'Enhanced £50k+ transit insurance options',
            'Tamper-evident security protocols & seals',
            'Static-safe (ESD) handling environments',
            'Custom rack configuration transport support'
        ],
        stats: [
            { label: 'Asset Safety', value: '100%' },
            { label: 'Secure Loads', value: '12k+' },
            { label: 'Tech Clients', value: '850+' }
        ],
        equipment: [
            { title: 'Padded Transit', desc: 'Specialist internal padding for high-end server and storage units.', icon: 'Box' },
            { title: 'Security Seals', desc: 'Digital and physical seals provided for every high-value dispatch.', icon: 'ShieldCheck' },
            { title: 'Air-Ride Fleet', desc: 'Advanced suspension vehicles to minimise vibration during transport.', icon: 'Zap' }
        ],
        processSteps: [
            { title: 'Inventory Check', desc: 'Items are serial-checked and photographed at the point of collection.' },
            { title: 'Sealed Transit', desc: 'The vehicle is locked and sealed, taking a non-stop direct route to the destination.' },
            { title: 'Chain of Custody', desc: 'Electronic signature and photo proof are instantly emailed to your security team.' }
        ],
        caseStudyTitle: 'Case Study: Tier 4 Data Center Move',
        caseStudyQuote: 'We relocated 12 active server racks across London with zero downtime and full audit-trail compliance. Exceptional service.',
        caseStudyAuthor: 'CTO, Global Hosting'
    },
    'medical': {
        id: 'medical',
        title: 'Healthcare & Medical Logistics',
        subtitle: 'GDP-compliant courier services for life sciences and the NHS.',
        heroImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
        icon: 'BriefcaseMedical',
        problemTitle: 'The Urgent Care Gap',
        problemContent: 'Medical logistics involve life-critical samples and surgical tools that cannot wait for "next-day" solutions. Temperature sensitivity and bio-security are non-negotiable requirements.',
        solutionTitle: 'Specialist Medical Courier',
        solutionContent: 'Our medical network is trained in GDP (Good Distribution Practice). We provide emergency response collections within 60 minutes for lab samples, blood, and surgical kits.',
        features: [
            'NHS-approved courier standards',
            'Cold-chain transport capabilities',
            'Bio-hazard & lab sample certified handling',
            '24/7/365 emergency response team'
        ],
        stats: [
            { label: 'Collection Time', value: '<45m' },
            { label: 'GDP Compliance', value: '100%' },
            { label: 'Medical Sites', value: '250+' }
        ],
        equipment: [
            { title: 'Insulated Totes', desc: 'Medical-grade thermal containers for temperature-sensitive samples.', icon: 'Zap' },
            { title: 'Sterile Handling', desc: 'Specific kits and training for the transport of un-autoclaved surgical tools.', icon: 'ShieldCheck' },
            { title: 'Urgent Response Bikes', desc: 'Cargo bikes for rapid inner-city pathology sample transfers.', icon: 'Package' }
        ],
        processSteps: [
            { title: 'Priority Dispatch', desc: 'Medical bookings bypass standard queues for immediate driver allocation.' },
            { title: 'Secure Loading', desc: 'Items are secured in task-specific containers and checked for environmental stability.' },
            { title: 'Direct Delivery', desc: 'The driver goes directly to the lab or theatre door, with zero intermediate stops.' }
        ],
        caseStudyTitle: 'Case Study: Pathology Hub Support',
        caseStudyQuote: 'CYVhub reduced our sample transit times by 35%, directly impacting the speed of patient diagnosis and clinical care.',
        caseStudyAuthor: 'Pathology Manager, NHS Trust'
    },
    'manufacturing': {
        id: 'manufacturing',
        title: 'Manufacturing & Wholesale',
        subtitle: 'Lean supply chain solutions for the UK industrial sector.',
        heroImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        icon: 'Factory',
        problemTitle: 'The Production Line Halt',
        problemContent: 'When a raw material is missing or a component fails, the entire factory floor stops. Modern "Just-In-Time" manufacturing has zero tolerance for logistics failures.',
        solutionTitle: 'Integrated Industrial Logistics',
        solutionContent: 'We act as a high-speed link in your supply chain. From raw material replenishment to finished goods distribution, we provide the scale and speed to keep your equipment running.',
        features: [
            'JIT (Just-In-Time) replenishment specialist',
            'Bulk palletised and oversized freight capability',
            'Warehouse-to-line side delivery options',
            'B2B account management for high-volume users'
        ],
        stats: [
            { label: 'Total Weight/Yr', value: '50k+ t' },
            { label: 'JIT Accuracy', value: '99.9%' },
            { label: 'Active Plants', value: '150+' }
        ],
        equipment: [
            { title: 'Curtain-Siders', desc: 'Easy side-loading for rapid warehouse pallet turnaround.', icon: 'Truck' },
            { title: 'Heavy Duty Tail-Lifts', desc: 'Commercial equipment capable of lifting up to 2000kg single units.', icon: 'Package' },
            { title: 'Van Fleet up to 4m', desc: 'Long-wheelbase vehicles for industrial piping and structural materials.', icon: 'Settings' }
        ],
        processSteps: [
            { title: 'Line-Side Sync', desc: 'We integrate with your production schedule to time deliveries by the hour.' },
            { title: 'Pallet Bulk Feed', desc: 'Consolidated movements from regional warehouses to your main factory floor.' },
            { title: 'Ready-to-Ship', desc: 'We collect finished products directly from the line for immediate wholesale distribution.' }
        ],
        caseStudyTitle: 'Case Study: Automotive JIT Success',
        caseStudyQuote: 'CYVhub is our key partner for hourly component feeding. They have maintained a flawless 100% reliability record over 18 months.',
        caseStudyAuthor: 'Supply Chain Director, Tier 1 Auto'
    },
    'reverse': {
        id: 'reverse',
        title: 'Reverse Logistics & Returns',
        subtitle: 'Transforming returns from a cost centre into a competitive edge.',
        heroImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
        icon: 'Recycle',
        problemTitle: 'The Post-Purchase Headache',
        problemContent: 'Returns often languish in regional depots or customer homes, tying up capital and reducing the resale value of modern electronics and fashion.',
        solutionTitle: 'Rapid Asset Recovery',
        solutionContent: 'Our reverse logistics service speed up the returns cycle. We collect, serial-check, and return assets directly to your refurbishment hub, maximising asset recovery value.',
        features: [
            'Same-day collection of returned B2B assets',
            'Asset recovery & serial number verification',
            'WEEE compliant electronics recycling collection',
            'Integrated "Swap-Out" delivery/collection'
        ],
        stats: [
            { label: 'Return Speed', value: '2.5 Days' },
            { label: 'Recovery Rate', value: '88%' },
            { label: 'Items/Month', value: '15k+' }
        ],
        equipment: [
            { title: 'Asset Check Kits', desc: 'Drivers equipped with scanners to verify serial numbers on collection.', icon: 'Box' },
            { title: 'Recycling Freight', desc: 'Dedicated waste-transfer licensed vehicles for WEEE recycling.', icon: 'Recycle' },
            { title: 'Swap-Out Modules', desc: 'Bespoke vehicle partitions for segregated clean/dirty asset transport.', icon: 'ArrowLeftRight' }
        ],
        processSteps: [
            { title: 'Collection Window', desc: 'Specified collection slots for your customers to ensure high first-time success.' },
            { title: 'Asset Verification', desc: 'Drivers check item condition and serial numbers before accepting the load.' },
            { title: 'Refurbishment Feed', desc: 'Items go directly to your return centre, bypassing the slow parcel sorting hubs.' }
        ],
        caseStudyTitle: 'Case Study: Tech Refresh Programme',
        caseStudyQuote: 'We recovered 2,500 laptops from remote staff in 14 days using CYVhub, saving £150k in potential asset write-offs.',
        caseStudyAuthor: 'IT Procurement Manager'
    },
    'aviation-aog': {
        id: 'aviation-aog',
        title: 'Aviation & AOG Logistics',
        subtitle: 'Mission-critical aerospace support for a grounded-free fleet.',
        heroImageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3',
        icon: 'Plane',
        problemTitle: 'The AOG (Aircraft On Ground) Emergency',
        problemContent: 'An aircraft on the ground is one of the most expensive downtime events in the global economy. Every minute a part is missing, thousands of pounds in revenue are lost and flight schedules across continents are disrupted.',
        solutionTitle: 'Hyper-Speed Aerospace Logistics',
        solutionContent: 'We provide dedicated AOG support with 60-minute collections from any UK aerospace hub or manufacturing site. Our drivers are trained in airside logistics and security protocols for rapid airport delivery.',
        features: [
            '24/7/365 Dedicated AOG dispatch desk',
            'Airport airside delivery & security clearance',
            'IATA compliant dangerous goods handling',
            'Zero-transshipment direct airport runs'
        ],
        stats: [
            { label: 'Avg Collection', value: '<45m' },
            { label: 'On-Time AOG', value: '100%' },
            { label: 'Airport Hubs', value: 'All UK' }
        ],
        equipment: [
            { title: 'Air-Ride Vans', desc: 'Minimise vibration for sensitive avionics and turbine components.', icon: 'Zap' },
            { title: 'High-Capacity Freight', desc: 'Large wheelbase vehicles for structural panels and landing gear.', icon: 'Truck' },
            { title: 'Secure Trackers', desc: 'Real-time GPS tethering for high-value aerospace assets.', icon: 'Map' }
        ],
        processSteps: [
            { title: 'Flash Dispatch', desc: 'AOG orders are prioritized with immediate vehicle breakout within 15 minutes.' },
            { title: 'Direct Perimeter Run', desc: 'Transit is non-stop from collection point to the specific airport gate or hangar.' },
            { title: 'Airside Handoff', desc: 'Direct coordination with ground handling teams for immediate part installation.' }
        ],
        caseStudyTitle: 'Case Study: Major Airline Recovery',
        caseStudyQuote: 'CYVhub delivered a critical engine component from Manchester to Heathrow in under 4 hours, saving us from a potential 24-hour grounded event.',
        caseStudyAuthor: 'Operations Director, Global Airways'
    }
};
