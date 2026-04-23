// --- Types ---
export type HeaderMenuItem = {
    id: string;
    label: string;
    description?: string; // One-liner for Mega-menu
    url: string;
    items?: HeaderMenuItem[]; // For Mega-menus
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
export type WhyCardConfig = { id: string; title: string; desc: string; icon: string; link?: string; };
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

export type IndustryConfig = { id: string; slug?: string; title: string; desc: string; imageUrl: string; };
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

export type IndustriesPageConfig = {
    title: string;
    heroHeading: string;
    heroSubtext: string;
    introSection: string;
    cardIntroHeading: string;
    cardIntroText: string;
    ctaHeading: string;
    ctaText: string;
    ctaButton: string;
    metaTitle?: string;
    metaDesc?: string;
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

export type QuoteDetailsConfig = {
    pageTitle: string;
    subTitle: string;
    lengthLabel: string;
    widthLabel: string;
    heightLabel: string;
    weightLabel: string;
    buttonText: string;
};

export type JobOpening = {
    id: string;
    title: string;
    department: string;
    location: string;
    employmentType: string;
    summary: string;
    description: string;
    responsibilities: string;
    requirements: string;
    salaryInfo?: string;
    applicationUrl?: string;
    status: 'OPEN' | 'CLOSED' | 'HIDDEN';
    isPublished: boolean;
    displayOrder: number;
};

export type CareersPageConfig = {
    heroTitle: string;
    heroSubtitle: string;
    introTitle: string;
    introContent: string;
    perksTitle: string;
    perks: { id: string; title: string; desc: string; icon: string; color: string }[];
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButtonText: string;
    metaTitle?: string;
    metaDesc?: string;
};

export type MenuItem = {
    id: string;
    label: string;
    url: string;
    isExternal?: boolean;
    newTab?: boolean;
    children?: MenuItem[];
    showHeader?: boolean;
    showFooter?: boolean;
    description?: string;
};

export type MenuConfig = {
    items: MenuItem[];
};

export type GuestQuoteConfig = {
    pageTitle: string;
    validityText: string;
    tiers: ServiceTier[];
};

export type IndustryDetail = {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    heroImageUrl: string;
    icon: string;
    publishStatus: boolean;
    order: number;
    overview: string;
    problemTitle: string;
    problemContent: string;
    solutionTitle: string;
    solutionContent: string;
    typicalServices: string[];
    whyChooseUs: string[];
    stats: { label: string; value: string }[];
    equipment: { title: string; desc: string; icon: string }[];
    processSteps: { title: string; desc: string }[];
    caseStudyTitle: string;
    caseStudyQuote: string;
    caseStudyAuthor: string;
    ctaHeading: string;
    ctaText: string;
    ctaButtonText: string;
    metaTitle?: string;
    metaDesc?: string;
    // --- Antigravity New Fields ---
    accentColor: string;
    layoutTheme?: 'left' | 'center';
    challenges: { icon: string; title: string; desc: string }[];
    features: { title: string; desc: string; icon: string; imageUrl: string }[];
    useCases: { title: string; desc: string; badge: string }[];
    testimonial?: { quote: string; author: string; role: string; company: string };
};

export type ServiceDetailConfig = {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
    imageUrl: string;
};

export type ServicePageDetail = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    heroHeading: string;
    heroSubtext: string;
    overview: string;
    description: string;
    benefits: string[];
    useCases: string[];
    howItWorks: string;
    whyChooseUs: string[];
    ctaHeading: string;
    ctaText: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
    heroImageUrl: string;
    icon: string;
    publishStatus: boolean;
    order: number;
    metaTitle: string;
    metaDesc: string;
    // Keeping these for legacy compatibility if needed
    features?: { id: string; title: string; desc: string; icon: string }[];
    process?: { id: string; step: string; title: string; desc: string }[];
};

export type ServicesPageConfig = {
    title: string;
    heroHeading: string;
    heroSubtext: string;
    introSection: string;
    cardIntroText: string;
    ctaHeading: string;
    ctaText: string;
    ctaButton: string;
    heroImageUrl: string;
    // Legacy support
    heroTitle?: string;
    heroSubtitle?: string;
    mainServices?: ServiceDetailConfig[];
    whatWeDeliverTitle?: string;
    deliveryItems?: WhyCardConfig[];
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
    logoUrl: '', // Empty = use local bundled asset fallback in layout
    enableSticky: true,
    enableAnnouncement: true,
    announcementText: '🚀 Breaking News: CYVhub expands nationwide! Click here for details.',
    announcementLink: '/b2b-logistics',
    announcementBgColor: '#1E40AF', // Colors.primary
    menuItems: [
        { id: '1', label: 'Home', url: '/' },
        { 
            id: 'services', 
            label: 'Services', 
            url: '/services',
            items: [
                { id: 's1', label: 'Same Day Delivery', url: '/services/same-day' },
                { id: 's2', label: 'B2B Logistics', url: '/services/b2b' },
                { id: 's3', label: 'AOG & Aviation', url: '/services/aviation-aog' },
                { id: 's4', label: 'Medical & Healthcare', url: '/services/medical' },
                { id: 's5', label: 'Scheduled Routes', url: '/services/scheduled' },
                { id: 's6', label: 'Green Fleet', url: '/services/green-fleet' },
                { id: 's7', label: 'Technical Logistics', url: '/services/technical' },
                { id: 's8', label: 'International', url: '/services/international' },
                { id: 's9', label: 'Warehouse & Storage', url: '/services/warehouse' },
                { id: 's10', label: 'Exhibition & Events', url: '/services/events' },
            ]
        },
        { id: 'industries', label: 'Industries', url: '/industries', items: [] },
        { id: 'about', label: 'About Us', url: '/about' },
        { id: 'contact', label: 'Contact', url: '/contact' },
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
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=2000', // Modern logistics truck
        'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=2000', // Aviation/AOG
        'https://images.unsplash.com/photo-1586528116311-ad8669966155?auto=format&fit=crop&q=80&w=2000'  // Warehouse/Tech
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
        { id: '1', title: 'Lightning Fast', desc: 'Same day specialists with 60-minute collection nationwide.', icon: 'Zap', link: '/services' },
        { id: '2', title: 'Fully Insured', desc: 'Total peace of mind with comprehensive transit cover.', icon: 'ShieldCheck', link: '/terms' },
        { id: '3', title: 'B2B Optimised', desc: 'Volume discounts, invoicing, and powerful API integrations.', icon: 'TrendingUp', link: '/b2b-logistics' },
        { id: '4', title: '24/7 Support', desc: 'Our dedicated logistics experts are always on hand to help.', icon: 'Headset', link: '/contact' },
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
        { id: '6', title: 'AOG & Aviation', desc: 'Time-critical parts delivery for aircraft on ground support.', imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=1200', link: '/services/aviation-aog' },
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
        { id: 'medical-healthcare', slug: 'medical-healthcare', title: 'Medical & Healthcare', desc: 'Time-critical, temperature-aware delivery for medical supplies, diagnostics, and healthcare equipment — handled with the care your patients deserve.', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d' },
        { id: 'construction-trades', slug: 'construction-trades', title: 'Construction & Trades', desc: 'Reliable delivery of tools, materials, and equipment to active construction sites — timed to your schedule, not ours.', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd' },
        { id: 'it-spare-parts-field-service', slug: 'it-spare-parts-field-service', title: 'IT Spare Parts & Field Service', desc: 'Rapid, trackable delivery of IT spare parts and field service kits to engineers across the UK — because every minute of downtime costs money.', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475' },
        { id: 'manufacturing-wholesale', slug: 'manufacturing-wholesale', title: 'Manufacturing & Wholesale', desc: 'Dependable B2B delivery for manufacturers and wholesalers — scheduled runs, pallet movements, and contract logistics that keep production flowing.', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158' },
        { id: 'aog-aviation', slug: 'aog-aviation', title: 'AOG & Aviation', desc: 'Mission-critical AOG logistics delivering aviation components anywhere in the UK within hours — because a grounded aircraft costs thousands per minute.', imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3' },
        { id: 'reverse-logistics', slug: 'reverse-logistics', title: 'Reverse Logistics', desc: 'End-to-end returns collection and reverse logistics for B2B operations — tracked, documented, and processed without the chaos.', imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b' },
        { id: 'automotive-parts', slug: 'automotive-parts', title: 'Automotive Parts', desc: 'Fast, accurate delivery of automotive parts to dealerships, bodyshops, and garages across the UK — keeping workshop bays productive and customers happy.', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70' },


        { id: 'hospitality', slug: 'hospitality', title: 'Hospitality', desc: 'Reliable, time-critical delivery for hotels, restaurants, and event venues — so your front of house never suffers for what happens out back.', imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd458ad20' },
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
    primaryBtnLink: '/',
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
        { id: '2', label: 'Privacy Policy', url: '/privacy' },
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

export const initialQuoteDetails: QuoteDetailsConfig = {
    pageTitle: 'Package Requirements',
    subTitle: 'Please provide exact dimensions and weight for an accurate quote.',
    lengthLabel: 'Length (cm)',
    widthLabel: 'Width (cm)',
    heightLabel: 'Height (cm)',
    weightLabel: 'Weight (kg)',
    buttonText: 'Calculate Price'
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
    title: "Services",
    heroHeading: "Professional B2B Logistics Services Built for Speed, Reliability, and Control",
    heroSubtext: "CYVhub supports businesses with practical logistics solutions designed for urgent movement, scheduled operations, repeat routes, freight handling, returns, visibility, and delivery management. Our services are built to help businesses stay responsive, organised, and operational.",
    introSection: "Every business has different delivery pressures, service expectations, and operational demands. That is why CYVhub provides a flexible range of B2B logistics services designed to support both urgent and planned movement of goods. Whether your business requires same-day delivery, scheduled collections, repeat route support, pallet movement, reverse logistics, proof of delivery visibility, or structured service-level support, CYVhub delivers practical logistics solutions that help keep operations moving.",
    cardIntroText: "Explore our services and discover how CYVhub helps businesses improve turnaround times, gain visibility, strengthen supply continuity, and deliver with confidence.",
    ctaHeading: "Need a logistics service tailored to your business?",
    ctaText: "Speak to CYVhub about a delivery solution designed around your operational needs, whether you need urgent dispatch, recurring collections, route-based support, freight handling, or managed B2B logistics.",
    ctaButton: "Get in Touch",
    heroImageUrl: "https://images.unsplash.com/photo-1566846108151-512140c83a54",
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

export const initialHomepageData = {
    cms_heroConfig: initialHero,
    cms_slidesConfig: initialSlides,
    cms_howItWorksConfig: initialHowItWorks,
    cms_whyUsConfig: initialWhyUs,
    cms_servicesConfig: initialServices,
    cms_statsConfig: initialStats,
    cms_industriesConfig: initialIndustries,
    cms_testimonialsConfig: initialTestimonials,
    cms_customSections: [] as any[],
    cms_ctaConfig: initialCta,
};

export const initialIndustriesPage: IndustriesPageConfig = {
    title: "Industries We Serve",
    heroHeading: "B2B Logistics Solutions Built Around Your Industry",
    heroSubtext: "CYVhub supports businesses across multiple sectors with dependable, time-critical, and scheduled logistics solutions. From urgent medical consignments and aviation parts to construction site runs, hospitality replenishment, and reverse logistics, we help businesses move goods with speed, visibility, and control.",
    introSection: "Every industry has its own operational pressure, delivery standards, and service expectations. That is why CYVhub is built to support a wide range of business sectors with flexible logistics services tailored to the real demands of each environment. Whether you require urgent same-day delivery, planned route distribution, scheduled collections, specialist handling, or regular contract support, our sector-focused team ensures your goods are managed by professionals who understand your business needs.",
    cardIntroHeading: "Sector Expertise",
    cardIntroText: "Explore our specialized logistics solutions tailored for the most demanding industry sectors in the UK.",
    ctaHeading: "Tailored Logistics for Your Industry",
    ctaText: "Discover how CYVhub can optimize your specific supply chain requirements with our industry-leading expertise.",
    ctaButton: "Contact Our Sector Specialists"
};
export const initialIndustryDetails: Record<string, IndustryDetail> = {
    'medical-healthcare': {
        id: 'medical-healthcare',
        slug: 'medical-healthcare',
        title: 'Medical & Healthcare',
        subtitle: 'Precision Logistics for Life-Critical Deliveries',
        description: 'Time-critical, temperature-aware delivery for medical supplies, diagnostics, and healthcare equipment — handled with the care your patients deserve.',
        heroImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
        icon: 'BriefcaseMedical',
        publishStatus: true,
        order: 1,
        overview: 'Medical logistics involve life-critical samples, surgical tools, and pharmaceuticals that cannot wait for "next-day" solutions.',
        problemTitle: 'The Challenge',
        problemContent: 'Healthcare providers face zero tolerance for delays. Medical consumables, diagnostic samples, surgical kits, and pharmaceutical supplies must arrive on time, intact, and within strict handling conditions. A missed delivery can directly impact patient care. Standard couriers simply don\'t understand these stakes.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub provides dedicated same-day and scheduled medical logistics across the UK, built for the specific demands of NHS trusts, private clinics, dental practices, care homes, and medical device companies. Our drivers are briefed on medical handling protocols and treat every consignment with clinical precision.\n\nWe operate SLA-based delivery tiers that guarantee time windows, so your surgical kits arrive before the procedure, not after. Our live-tracking and proof-of-delivery system gives clinical staff real-time visibility and an auditable delivery record for compliance purposes.\n\nOur temperature-controlled handling options ensure cold-chain integrity for samples, medications, and biologics. Every collection and delivery is logged with timestamps, recipient signatures, and GPS confirmation.\n\nWith account-based invoicing and dedicated account management, healthcare procurement teams get consolidated billing, detailed reporting, and a single point of contact — eliminating the administrative burden of managing multiple carriers.',
        typicalServices: [
            'Urgent pathology sample transfers',
            'Surgical kit and equipment delivery',
            'Time-sensitive pharmaceutical distribution',
            'Cold-chain and temperature-monitored moves'
        ],
        whyChooseUs: [
            'CQC-compliant handling protocols',
            'SLA-backed delivery guarantees',
            'Real-time GPS and temperature tracking',
            'Consolidated NHS & private billing'
        ],
        stats: [
            { label: 'NHS Trust Support', value: '45+' },
            { label: 'On-Time Accuracy', value: '99.9%' },
            { label: 'Urgent Transfers', value: '250k+' },
            { label: 'Compliance Rate', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Life-Critical Success',
        caseStudyQuote: 'When it comes to pathology samples and life-critical equipment, there is no margin for error. CYVhub understands the stakes.',
        caseStudyAuthor: 'Logistics Manager, NHS Trust',
        ctaHeading: 'Trust CYVhub with your medical logistics',
        ctaText: 'Partner with a logistics provider that understands the clinical importance of every delivery.',
        ctaButtonText: 'Get a Medical Delivery Quote',
        metaTitle: 'Medical & Healthcare Logistics | CYVhub',
        metaDesc: 'Time-critical, temperature-aware delivery for medical supplies, diagnostics, and healthcare equipment.',
        accentColor: '#DC2626',
        challenges: [
            { icon: 'AlertTriangle', title: 'Zero Delay Tolerance', desc: 'Medical goods often have life-critical arrival windows with no room for error.' },
            { icon: 'Thermometer', title: 'Temperature Sensitivity', desc: 'Maintaining cold-chain integrity is vital for reagents and biologics.' },
            { icon: 'Shield', title: 'Regulatory Compliance', desc: 'Deliveries must meet strict clinical and CQC handling requirements.' }
        ],
        features: [
            { title: 'Dedicated Medical Fleet', desc: 'Trained drivers who prioritize clinical consignments over standard freight.', icon: 'Truck', imageUrl: '' },
            { title: 'SLA-Backed Precision', desc: 'Guaranteed delivery windows for surgeries and diagnostics.', icon: 'Clock', imageUrl: '' },
            { title: 'Auditable Compliance', desc: 'Every move documented with GPS, timestamps, and digital signatures.', icon: 'FileText', imageUrl: '' }
        ],
        useCases: [
            { title: 'Pathology Samples', desc: 'Urgent movement of samples from clinics to processing labs.', badge: 'URGENT' },
            { title: 'Surgical Kits', desc: 'Direct delivery of sterile equipment to theatre teams.', badge: 'CRITICAL' },
            { title: 'Pharma Distribution', desc: 'Timed replenishment for hospital pharmacies and clinics.', badge: 'SCHEDULED' }
        ],
        testimonial: { quote: 'When it comes to pathology samples and life-critical equipment, there is no margin for error. CYVhub understands the stakes completely.', author: 'Sarah Okafor', role: 'Logistics Manager', company: 'NHS Trust' }
    },
    'construction-trades': {
        id: 'construction-trades',
        slug: 'construction-trades',
        title: 'Construction & Trades',
        subtitle: 'Keeping Your Site Moving, Every Hour of the Day',
        description: 'Reliable delivery of tools, materials, and equipment to active construction sites — timed to your schedule, not ours.',
        heroImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
        icon: 'HardHat',
        publishStatus: true,
        order: 2,
        overview: 'In construction and trades, project timelines are dictated by precision logistics.',
        problemTitle: 'The Challenge',
        problemContent: 'Construction projects run on tight margins and tighter schedules. A delayed delivery of fixings, cable, or specialist tools means idle workers, missed milestones, and contractual penalties. Materials are often bulky, heavy, or oddly shaped — and sites aren\'t always easy to access.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub delivers to active construction sites, merchant yards, and trade depots across the UK with a fleet equipped for heavy and awkward loads. We work to your site\'s access windows and coordinate with site managers to ensure smooth, disruption-free deliveries.\n\nOur multi-drop business routes are designed for contractors managing multiple sites simultaneously. A single scheduled run can service all your active projects in one day, reducing transport costs and carbon footprint without sacrificing reliability.\n\nWith dedicated contract delivery, we become an extension of your supply chain — learning your project schedules, preferred delivery windows, and site-specific requirements so nothing is ever left to chance.\n\nPallet and freight movement capabilities mean even your heaviest consignments — structural steel fixings, bulk plasterboard, plant equipment — are handled professionally with appropriate vehicles and tail-lift options.',
        typicalServices: [
            'Timed site material deliveries',
            'Heavy plant and tool movements',
            'Infrastructure parts replenishment',
            'Consolidated first-mile site support'
        ],
        whyChooseUs: [
            'Site-access-aware delivery scheduling',
            'Multi-drop routes for multiple sites',
            'Heavy and awkward load handling',
            'Pallet and freight movement with tail-lifts'
        ],
        stats: [
            { label: 'Contractor Support', value: '120+' },
            { label: 'On-Time Delivery', value: '98.5%' },
            { label: 'Material Moves', value: '800k+' },
            { label: 'Site Access Rate', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Site Efficiency Success',
        caseStudyQuote: 'Waiting on tools or materials kills site productivity. CYVhub\'s same-day response keeps our projects on schedule every single time.',
        caseStudyAuthor: 'Site Manager, Tier 1 Contractor',
        ctaHeading: 'Keep your site moving with CYVhub',
        ctaText: 'Get your tools and materials delivered exactly when your team needs them.',
        ctaButtonText: 'Get a Construction Delivery Quote',
        metaTitle: 'Construction & Trades Logistics | CYVhub',
        metaDesc: 'Reliable delivery of tools, materials, and equipment to active construction sites — timed to your schedule, not ours.',
        accentColor: '#EA580C',
        challenges: [
            { icon: 'Users', title: 'Idle Workforce', desc: 'Missing fixings or tools lead to expensive downtime for on-site teams.' },
            { icon: 'BoxLabel', title: 'Heavy & Bulky Loads', desc: 'Materials are often oddly shaped and difficult for standard couriers to handle.' },
            { icon: 'Map', title: 'Tight Site Access', desc: 'Restricted access windows and urban site locations require precise timing.' }
        ],
        features: [
            { title: 'Site-Aware Scheduling', desc: 'Deliveries timed to your access windows to avoid site disruption.', icon: 'Clock', imageUrl: '' },
            { title: 'Multi-Drop Efficiency', desc: 'One run can service all your active projects, reducing total logistics costs.', icon: 'Truck', imageUrl: '' },
            { title: 'Heavy Load Capability', desc: 'Fleet equipped with tail-lifts and specialized handling for plant and machinery.', icon: 'Package', imageUrl: '' }
        ],
        useCases: [
            { title: 'Merchant Collections', desc: 'Rapid pickup and delivery of materials from trade counters.', badge: 'SAME-DAY' },
            { title: 'Site-to-Site Moves', desc: 'Transferring plant and tools between active project locations.', badge: 'FLEXIBLE' },
            { title: 'Infrastructure Support', desc: 'Replenishing cable and fixings for large-scale utility projects.', badge: 'SCHEDULED' }
        ],
        testimonial: { quote: 'Waiting on tools or materials kills site productivity. CYVhub\'s same-day response keeps our projects on schedule every single time.', author: 'James Hartley', role: 'Site Manager', company: 'Tier 1 Contractor' }
    },
    'it-spare-parts-field-service': {
        id: 'it-spare-parts-field-service',
        slug: 'it-spare-parts-field-service',
        title: 'IT Spare Parts & Field Service',
        subtitle: 'Zero Downtime Starts with the Right Part, Right Now',
        description: 'Rapid, trackable delivery of IT spare parts and field service kits to engineers across the UK — because every minute of downtime costs money.',
        heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        icon: 'Monitor',
        publishStatus: true,
        order: 3,
        overview: 'In the tech sector, logistics is as much about data security as it is about transport.',
        problemTitle: 'The Challenge',
        problemContent: 'Field service engineers depend on receiving the right part at the right location before they arrive on site. IT hardware failures are business-critical — every hour of downtime has a direct cost. Standard next-day services don\'t cut it when an engineer is already on the road.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub specialises in same-day and SLA-based delivery of IT spare parts, replacement hardware, and field service kits to engineers, data centres, and client sites across the UK. We understand that your SLA clock starts the moment the ticket opens — so ours does too.\n\nOur live-tracking system gives field service dispatchers real-time visibility of every part in transit, so engineers can be updated dynamically and dispatched efficiently. Proof of delivery confirms receipt before the engineer leaves the depot.\n\nWe support major IT managed service providers, break-fix contractors, and hardware distributors with account-based invoicing and consolidated monthly reporting — making cost management and client chargeback straightforward.\n\nOur returns logistics capability handles the reverse flow of failed components, loan units, and warranty returns cleanly — with tracking and confirmation at every stage.',
        typicalServices: [
            'Data center and server relocation',
            'Urgent hardware swap-outs',
            'Secure laptop recovery runs',
            'Exhibition and demo-kit transport'
        ],
        whyChooseUs: [
            'SLA-tiered parts delivery',
            'Real-time tracking for dispatchers',
            'Pre-engineer delivery confirmation',
            'Managed reverse logistics flow'
        ],
        stats: [
            { label: 'SLA Maintenance', value: '99.7%' },
            { label: 'Engineer Support', value: '3,000+' },
            { label: 'Parts Delivered', value: '1.5M+' },
            { label: 'Data Center Coverage', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Uptime Success',
        caseStudyQuote: 'Every minute that a server is down costs our clients thousands. CYVhub ensures spare parts arrive exactly when and where they\'re needed.',
        caseStudyAuthor: 'Lead Field Engineer, Global MSP',
        ctaHeading: 'Eliminate IT downtime with CYVhub',
        ctaText: 'Get critical parts into your engineers\' hands exactly when they need them.',
        ctaButtonText: 'Get a Tech Logistics Quote',
        metaTitle: 'IT Spare Parts & Field Service Logistics | CYVhub',
        metaDesc: 'Rapid, trackable delivery of IT spare parts and field service kits to engineers across the UK — because every minute of downtime costs money.',
        accentColor: '#2563EB',
        challenges: [
            { icon: 'Zap', title: 'Critical Downtime', desc: 'Hardware failures cost businesses thousands per hour in lost productivity.' },
            { icon: 'Target', title: 'Precision Routing', desc: 'Parts must meet engineers at specific sites, often with very tight windows.' },
            { icon: 'RefreshCcw', title: 'Asset Recovery', desc: 'Faulty units and loan kits must be returned securely for refurbishment.' }
        ],
        features: [
            { title: 'Real-Time Dispatch Sync', desc: 'Live tracking allows dispatchers to coordinate engineer arrival with part delivery.', icon: 'Signal', imageUrl: '' },
            { title: 'SLA-Tiered Response', desc: 'Guaranteed collection and delivery windows aligned to your client contracts.', icon: 'ShieldCheck', imageUrl: '' },
            { title: 'Managed Reverse Flow', desc: 'Closing the loop by collecting old or faulty parts as the new part is delivered.', icon: 'ArrowLeftRight', imageUrl: '' }
        ],
        useCases: [
            { title: 'Engineer Swap-Outs', desc: 'Direct delivery of replacement parts to on-site technicians.', badge: 'SLA-CRITICAL' },
            { title: 'Data Center Relocation', desc: 'Secure, timed movement of server racks and infrastructure.', badge: 'MANAGED' },
            { title: 'Secure PC Recovery', desc: 'Safe collection of high-value hardware from remote employees.', badge: 'SECURE' }
        ],
        testimonial: { quote: 'Every minute a server is down costs our clients thousands. CYVhub ensures spare parts arrive exactly when and where they\'re needed.', author: 'Raj Patel', role: 'Lead Field Engineer', company: 'Global MSP' }
    },
    'manufacturing-wholesale': {
        id: 'manufacturing-wholesale',
        slug: 'manufacturing-wholesale',
        title: 'Manufacturing & Wholesale',
        subtitle: 'Powering Your Supply Chain from Factory to Customer',
        description: 'Dependable B2B delivery for manufacturers and wholesalers — scheduled runs, pallet movements, and contract logistics that keep production flowing.',
        heroImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        icon: 'Factory',
        publishStatus: true,
        order: 4,
        overview: 'Industrial operations thrive on precision. CYVhub acts as the high-speed link in your supply chain.',
        problemTitle: 'The Challenge',
        problemContent: 'Manufacturers and wholesalers operate on production schedules where a single missed inbound delivery can halt an entire line. Outbound orders need to reach trade customers on time, every time, to protect relationships and revenue.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub provides dedicated contract delivery and scheduled collection services designed around manufacturing shift patterns and wholesale dispatch schedules. We integrate into your existing operations as a reliable logistics partner — not just a courier.\n\nOur pallet and freight movement capability handles bulk consignments, raw material deliveries, and finished goods distribution with appropriate vehicles including curtainsiders and tail-lift trucks. We manage the full load-to-door journey.\n\nRoute planning and dispatch management tools give your logistics team visibility and control. Multi-drop business routes are optimised daily to ensure maximum efficiency across your customer base.\n\nAccount-based invoicing with detailed job-level reporting makes cost allocation simple for finance teams, and our dedicated account managers provide proactive communication on every consignment.',
        typicalServices: [
            'Just-in-time line replenishment',
            'Bulk wholesale distribution runs',
            'Urgent machine-part deliveries',
            'Palletized raw material movement'
        ],
        whyChooseUs: [
            'JIT-aligned shift scheduling',
            'Pallet and bulk freight capacity',
            'Optimised multi-drop routes',
            'Detailed job-level reporting'
        ],
        stats: [
            { label: 'Production Efficiency', value: '+15%' },
            { label: 'JIT Delivery Rate', value: '99.4%' },
            { label: 'Pallet Movements', value: '1.2M+' },
            { label: 'Supply Continuity', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Supply Chain Success',
        caseStudyQuote: 'Our production lines depend on a seamless supply of components. CYVhub provides the reliability and scale we need to grow.',
        caseStudyAuthor: 'Operations Director, Industrial Mfg',
        ctaHeading: 'Optimise your production with CYVhub',
        ctaText: 'Strengthen your supply chain with dependable manufacturing logistics support.',
        ctaButtonText: 'Get a Manufacturing Quote',
        metaTitle: 'Manufacturing & Wholesale Logistics | CYVhub',
        metaDesc: 'Dependable B2B delivery for manufacturers and wholesalers — scheduled runs, pallet movements, and contract logistics.',
        accentColor: '#0D9488',
        challenges: [
            { icon: 'PauseCircle', title: 'Line Stoppage Risk', desc: 'A single missing component can halt an entire multi-million pound production line.' },
            { icon: 'Truck', title: 'Bulk Load Complexity', desc: 'Moving raw materials requires specialized freight handling and tail-lift access.' },
            { icon: 'Link', title: 'Supply Chain Gaps', desc: 'Traditional couriers lack the scheduling precision needed for JIT manufacturing.' }
        ],
        features: [
            { title: 'JIT Replenishment', desc: 'Deliveries timed precisely to your production cycles to reduce on-site storage.', icon: 'Clock', imageUrl: '' },
            { title: 'Pallet & Bulk Freight', desc: 'Full capacity for raw materials and finished goods with lift-gate support.', icon: 'Layers', imageUrl: '' },
            { title: 'Dedicated Contract Runs', desc: 'Permanent vehicles and drivers allocated to your daily supply chain needs.', icon: 'Briefcase', imageUrl: '' }
        ],
        useCases: [
            { title: 'Line Feed Support', desc: 'Just-in-time delivery of components to the production floor.', badge: 'PRECISION' },
            { title: 'Wholesale Distribution', desc: 'Structured multi-drop runs to your trade customer network.', badge: 'SCALABLE' },
            { title: 'Raw Material Transit', desc: 'Reliable movement of bulk stock from port to factory.', badge: 'FREIGHT' }
        ],
        testimonial: { quote: 'Our production lines depend on a seamless supply of components. CYVhub provides the reliability and scale we need to grow confidently.', author: 'David Mensah', role: 'Operations Director', company: 'Industrial Manufacturing Ltd' }
    },
    'aog-aviation': {
        id: 'aog-aviation',
        slug: 'aog-aviation',
        title: 'AOG & Aviation',
        subtitle: 'Aircraft on Ground Won\'t Wait — Neither Do We',
        description: 'Mission-critical AOG logistics delivering aviation components anywhere in the UK within hours — because a grounded aircraft costs thousands per minute.',
        heroImageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3',
        icon: 'Plane',
        publishStatus: true,
        order: 5,
        overview: 'CYVhub provides the ultra-rapid response needed to move critical parts from suppliers to hangars or tarmac-side with zero delay.',
        problemTitle: 'The Challenge',
        problemContent: 'An Aircraft on Ground (AOG) event is one of the most costly situations in aviation. Every minute a commercial or private aircraft sits grounded costs the operator thousands in lost revenue and penalties. Components must be sourced and delivered with absolute urgency — no excuses, no delays.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub operates a dedicated AOG response service with same-day collection and delivery of aviation components, tooling, and documentation across the UK. We respond within the hour and provide constant communication from collection to airside delivery.\n\nOur drivers are security-cleared and briefed on airside access protocols at major UK airports and MRO facilities. We handle the documentation chain — traceability records, chain of custody, and proof-of-delivery — to meet aviation regulatory requirements.\n\nLive tracking gives your AOG desk real-time visibility of the consignment at every stage. Our operations team is available around the clock to manage urgent requests, re-routes, and last-minute changes.\n\nWe work directly with MRO operators, airlines, ground handling companies, and aviation parts distributors on SLA-based agreements that define response times, escalation paths, and reporting requirements.',
        typicalServices: [
            'AOG critical parts delivery',
            'Avionics and sensitive tech transport',
            'Airside and tarmac-side deliveries',
            'Dangerous goods (ADR) awareness'
        ],
        whyChooseUs: [
            'Sub-hour AOG response',
            '24/7 operations desk',
            'Airside-cleared drivers',
            'Full documentation chain'
        ],
        stats: [
            { label: 'Response Time', value: '<60m' },
            { label: 'Airside Delivery', value: '100.0%' },
            { label: 'Parts Traceability', value: '100.0%' },
            { label: 'Back in Air', value: '8,000+' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Grounding Success',
        caseStudyQuote: 'When an engine component was needed in Heathrow, CYVhub had a dedicated vehicle at our supplier within 18 minutes.',
        caseStudyAuthor: 'Airline Maintenance Chief',
        ctaHeading: 'Clear your AOG faster with CYVhub',
        ctaText: 'Deploy the UK\'s fastest aviation logistics response team to your next AOG event.',
        ctaButtonText: 'Get an AOG Response Quote',
        metaTitle: 'AOG & Aviation Logistics | CYVhub',
        metaDesc: 'Mission-critical AOG logistics delivering aviation components anywhere in the UK within hours.',
        accentColor: '#1D4ED8',
        challenges: [
            { icon: 'DollarSign', title: 'Grounded Costs', desc: 'Every minute an aircraft sits on the tarmac costs thousands in revenue and fees.' },
            { icon: 'Lock', title: 'Security Protocols', desc: 'Airport access requires high-level security clearance and specific protocol knowledge.' },
            { icon: 'FileText', title: 'Documentation Chain', desc: 'Traceability and chain-of-custody records are mandatory for aviation safety.' }
        ],
        features: [
            { title: 'Ultra-Rapid Dispatch', desc: 'Dedicated vehicles are dispatched for collection the moment your ticket is logged.', icon: 'Zap', imageUrl: '' },
            { title: 'Airside Security Clearance', desc: 'Vetted drivers capable of direct delivery to hangars and tarmac-side locations.', icon: 'Shield', imageUrl: '' },
            { title: 'Full Chain of Custody', desc: 'Meticulous logging of all parts and documentation to meet CAA/EASA standards.', icon: 'CheckCircle', imageUrl: '' }
        ],
        useCases: [
            { title: 'Engine Component Moves', desc: 'Urgent transport of life-limited parts for engine repairs.', badge: 'AOG-PRIORITY' },
            { title: 'Avionics Transport', desc: 'Secure and sensitive handling of delicate flight electronics.', badge: 'SENSITIVE' },
            { title: 'Tarmac-Side Support', desc: 'Direct delivery of tools and parts to stationary aircraft.', badge: 'AIRSIDE' }
        ],
        testimonial: { quote: 'When an engine component was needed at Heathrow, CYVhub had a dedicated vehicle at our supplier within 18 minutes. Truly exceptional.', author: 'Captain Michael Flynn', role: 'Maintenance Chief', company: 'Regional Airline' }
    },
    'reverse-logistics': {
        id: 'reverse-logistics',
        slug: 'reverse-logistics',
        title: 'Reverse Logistics',
        subtitle: 'Closing the Loop on Returns, Cleanly and Efficiently',
        description: 'End-to-end returns collection and reverse logistics for B2B operations — tracked, documented, and processed without the chaos.',
        heroImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
        icon: 'ArrowLeftRight',
        publishStatus: true,
        order: 6,
        overview: 'CYVhub turns reverse logistics from a cost-center into a streamlined operational advantage.',
        problemTitle: 'The Challenge',
        problemContent: 'Managing returns is one of the most complex and costly parts of any supply chain. Without a structured reverse logistics process, returned goods pile up, warranty claims are lost, and customers lose confidence. Most carriers treat returns as an afterthought — we treat them as a core service.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub provides a structured returns logistics service for B2B clients across manufacturing, retail, IT, and healthcare sectors. We collect returned items on scheduled runs or on-demand, providing full tracking and proof of collection at the point of pickup.\n\nEvery return is logged in our system with item details, condition notes, and collection confirmation. This creates the audit trail your warehouse team needs to process warranty claims, refurbishment, or disposal efficiently.\n\nOur multi-drop collection routes make it cost-effective to consolidate returns from multiple customer locations in a single run — reducing per-unit return costs significantly compared to individual courier collections.\n\nWe integrate reverse logistics into existing dedicated contract arrangements, so your outbound delivery driver can also handle collections on the return journey — maximising vehicle utilisation and minimising empty miles.',
        typicalServices: [
            'High-value asset and IT equipment recovery',
            'Consolidated retail returns management',
            'Warranty swap-out programs',
            'Faulty machinery extraction'
        ],
        whyChooseUs: [
            'Proof of collection logging',
            'Multi-drop return consolidation',
            'Contracted return integration',
            'Full document audit trail'
        ],
        stats: [
            { label: 'Asset Recovery', value: '85.0%' },
            { label: 'Return Processing', value: '-30% Time' },
            { label: 'Managed Collections', value: '500k+' },
            { label: 'Audit Accuracy', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Circular Success',
        caseStudyQuote: 'Reverse logistics is no longer a headache. We have total visibility and control over our returns, saving us thousands in lost assets.',
        caseStudyAuthor: 'B2B Returns Specialist, Tech Corp',
        ctaHeading: 'Recover your assets with CYVhub',
        ctaText: 'Simplify your returns process with a structured B2B reverse logistics solution.',
        ctaButtonText: 'Get a Reverse Logistics Quote',
        metaTitle: 'Reverse Logistics | CYVhub',
        metaDesc: 'End-to-end returns collection and reverse logistics for B2B operations — tracked, documented, and processed without the chaos.',
        accentColor: '#16A34A',
        challenges: [
            { icon: 'AlertCircle', title: 'Chaos in Returns', desc: 'Unstructured returns lead to lost assets, missed warranties, and warehouse clutter.' },
            { icon: 'DollarSign', title: 'High Retrieval Costs', desc: 'Individual collections for single items are prohibitively expensive for B2B.' },
            { icon: 'Search', title: 'Lack of Documentation', desc: 'Returns often arrive back at the warehouse without tracking or verification.' }
        ],
        features: [
            { title: 'Item-Level Logging', desc: 'Detailed tracking of every returned unit for easy processing by your team.', icon: 'ClipboardList', imageUrl: '' },
            { title: 'Consolidated Returns', desc: 'Optimised multi-drop routes to pick up returns from multiple sites in one run.', icon: 'PlusSquare', imageUrl: '' },
            { title: 'Recovery Audits', desc: 'Instant proof of collection and detailed logs for every recovered asset.', icon: 'FileSearch', imageUrl: '' }
        ],
        useCases: [
            { title: 'Laptop Retrieval', desc: 'Collecting hardware from former employees or for tech refreshes.', badge: 'SECURE' },
            { title: 'Faulty Machinery', desc: 'Returning industrial parts for repair or warranty assessment.', badge: 'AD-HOC' },
            { title: 'Retail Consolidation', desc: 'Regular collection of B2B returns from store networks.', badge: 'SCHEDULED' }
        ],
        testimonial: { quote: 'Reverse logistics is no longer a headache. We have total visibility and control over our returns, saving us thousands in lost assets.', author: 'Priya Nair', role: 'Head of Returns', company: 'Global Tech Corp' }
    },
    'automotive-parts': {
        id: 'automotive-parts',
        slug: 'automotive-parts',
        title: 'Automotive Parts',
        subtitle: 'The Right Part at the Right Bay, Right on Time',
        description: 'Fast, accurate delivery of automotive parts to dealerships, bodyshops, and garages across the UK — keeping workshop bays productive and customers happy.',
        heroImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
        icon: 'Settings',
        publishStatus: true,
        order: 7,
        overview: 'We provide the ultra-rapid response needed for JIT (Just-In-Time) production feeding and urgent dealership stock.',
        problemTitle: 'The Challenge',
        problemContent: 'A vehicle off the road in a workshop bay costs the owner and the repairer. Dealerships and independent garages rely on a constant supply of OEM and aftermarket parts to keep technicians productive. Delays mean customer complaints, courtesy car costs, and revenue loss. Parts must arrive correctly labelled, undamaged, and on time.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub delivers automotive parts to franchised dealerships, independent garages, bodyshops, and fleet maintenance centres across the UK. Our scheduled daily collection routes from parts distributors and motor factors ensure a consistent, reliable supply to your workshop.\n\nSame-day delivery capability means a technician who discovers an unexpected part requirement mid-repair doesn\'t have to stand down the vehicle. We collect from your supplier and deliver to the workshop within hours.\n\nMulti-drop business routes are designed around the morning delivery windows that dealerships and garages depend on. We deliver to multiple accounts in an optimised sequence, ensuring every workshop is stocked before the day\'s job cards start.\n\nOur proof-of-delivery system captures recipient name, time, and signature for every parts consignment — giving distributors the delivery confirmation data they need for their own customer service and dispute resolution.',
        typicalServices: [
            'JIT production line replenishment',
            'Urgent repair center spare parts',
            'Heavy engine and gearbox transport',
            'Multi-stop scheduled dealer routes'
        ],
        whyChooseUs: [
            'Bay-direct delivery speed',
            'Morning window reliability',
            'Damage-free handling',
            'Full recipient verification'
        ],
        stats: [
            { label: 'Garage Network', value: '2,000+' },
            { label: 'Bay Productivity', value: '+20%' },
            { label: 'Parts Delivered', value: '4.5M+' },
            { label: 'Order Accuracy', value: '99.8%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Workshop Success',
        caseStudyQuote: 'Keeping workshop bays filled requires precise parts delivery. CYVhub has significantly improved our turnaround times and customer satisfaction.',
        caseStudyAuthor: 'Parts Manager, Regional Dealer Group',
        ctaHeading: 'Streamline your workshop with CYVhub',
        ctaText: 'Get parts delivered directly to your bay with same-day and scheduled support.',
        ctaButtonText: 'Get an Automotive Quote',
        metaTitle: 'Automotive Parts Logistics | CYVhub',
        metaDesc: 'Fast, accurate delivery of automotive parts to dealerships, bodyshops, and garages across the UK.',
        accentColor: '#CA8A04',
        challenges: [
            { icon: 'Clock', title: 'Bay Idle Time', desc: 'Technicians stand down when parts don\'t arrive, killing garage productivity.' },
            { icon: 'AlertTriangle', title: 'Parts Damage', desc: 'OEM parts are often fragile or heavy and easily damaged by standard couriers.' },
            { icon: 'TrendingDown', title: 'Inconsistent Supply', desc: 'Unreliable deliveries prevent effective workshop scheduling and job card planning.' }
        ],
        features: [
            { title: 'Bay-Direct Delivery', desc: 'Morning delivery windows ensuring parts are on-site before your day starts.', icon: 'CheckCircle', imageUrl: '' },
            { title: 'Distributor Integration', desc: 'We sync with major motor factors and OEM distributors for rapid collection.', icon: 'Users', imageUrl: '' },
            { title: 'Careful Handling', desc: 'Fleet equipped to handle engines, body panels, and delicate electronics safely.', icon: 'Package', imageUrl: '' }
        ],
        useCases: [
            { title: 'Dealership Trunking', desc: 'Overnight and early morning movement of stock between branches.', badge: 'NETWORK' },
            { title: 'Garage Replenishment', desc: 'Regular daily runs of aftermarket parts to independent workshops.', badge: 'DAILY' },
            { title: 'Urgent Repair Support', desc: 'Same-day delivery of missing parts discovered during a job.', badge: 'EMERGENCY' }
        ],
        testimonial: { quote: 'Keeping workshop bays filled requires precise parts delivery. CYVhub has significantly improved our turnaround times and customer satisfaction.', author: 'Tom Bradley', role: 'Parts Manager', company: 'Regional Dealer Group' }
    },
    'hospitality': {
        id: 'hospitality',
        slug: 'hospitality',
        title: 'Hospitality',
        subtitle: 'Behind Every Perfect Guest Experience is a Perfect Supply Chain',
        description: 'Reliable, time-critical delivery for hotels, restaurants, and event venues — so your front of house never suffers for what happens out back.',
        heroImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd458ad20',
        icon: 'Utensils',
        publishStatus: true,
        order: 8,
        overview: 'In hospitality and events, there are no second chances. Logistics must be discreet, professional, and timed perfectly with venue access windows.',
        problemTitle: 'The Challenge',
        problemContent: 'The hospitality industry runs on precision timing. A restaurant that runs out of a key ingredient at midday service, a hotel whose linen hasn\'t arrived before check-in, or a venue missing equipment before a corporate event — these are not just inconveniences, they are reputational crises. Standard courier services don\'t understand the urgency or the sensitivity of hospitality logistics.',
        solutionTitle: 'How CYVhub Helps',
        solutionContent: 'CYVhub provides dedicated same-day and scheduled delivery services for the hospitality sector — hotels, restaurants, bars, catering companies, event venues, and food service distributors. We understand that your operations run on tight preparation windows and that late deliveries have immediate, visible consequences.\n\nOur scheduled collection services integrate with your supplier relationships, picking up from food distributors, linen services, equipment rental companies, and wholesale suppliers at defined times and delivering to your property before your operational window opens.\n\nFor event-based hospitality, we provide time-specific delivery of furniture, AV equipment, catering supplies, and décor — coordinated with your event schedule down to the hour. Live tracking lets your events team monitor delivery progress in real time.\n\nAccount-based invoicing makes it simple for hospitality groups managing multiple properties to consolidate delivery costs by site, by supplier, or by cost centre — with monthly statements and on-demand reporting.',
        typicalServices: [
            'Fragile event decor and furniture',
            'AV and exhibition technology transport',
            'Scheduled multi-site hotel replenishment',
            'High-end catering and VIP support'
        ],
        whyChooseUs: [
            'Discreet branded delivery',
            'Access window coordination',
            'Event-grade precision',
            'Multi-site management'
        ],
        stats: [
            { label: 'Multi-Site Support', value: '80+' },
            { label: 'Operational Continuity', value: '100.0%' },
            { label: 'Event Success Rate', value: '100.0%' },
            { label: 'Discretion Level', value: '100.0%' }
        ],
        equipment: [],
        processSteps: [],
        caseStudyTitle: 'Guest Success',
        caseStudyQuote: 'In hospitality, the logistics should be invisible to the guest. CYVhub handles our multi-site replenishment with absolute discretion and reliability.',
        caseStudyAuthor: 'Events Operations Lead, Luxury Venue Group',
        ctaHeading: 'Elevate your hospitality logistics',
        ctaText: 'Partner with a logistics provider that understands the nuances of the hospitality sector.',
        ctaButtonText: 'Get a Hospitality Quote',
        metaTitle: 'Hospitality Logistics | CYVhub',
        metaDesc: 'Reliable, time-critical delivery for hotels, restaurants, and event venues — so your front of house never suffers.',
        accentColor: '#7C3AED',
        challenges: [
            { icon: 'Shield', title: 'Reputational Risk', desc: 'A missing ingredient or late linen delivery can lead to instant poor reviews.' },
            { icon: 'Lock', title: 'Access Restrictions', desc: 'Hotels and venues often have strict, limited delivery windows during off-peak hours.' },
            { icon: 'Clock', title: 'Event Deadlines', desc: 'There are no second chances when equipment is needed for a fixed event start time.' }
        ],
        features: [
            { title: 'Discretion-First Logistics', desc: 'Professional drivers and clean vehicles that maintain your venue\'s brand standards.', icon: 'Check', imageUrl: '' },
            { title: 'Access Window Coordination', desc: 'We sync with your front-of-house to deliver exactly when the site is ready.', icon: 'Maximize', imageUrl: '' },
            { title: 'Event-Grade Precision', desc: 'Timed-to-the-hour deliveries for AV, décor, and catering equipment.', icon: 'Zap', imageUrl: '' }
        ],
        useCases: [
            { title: 'Multi-Site Replenishment', desc: 'Daily delivery of essentials to a network of hotels or restaurants.', badge: 'CONSISTENT' },
            { title: 'AV/Event Setup', desc: 'Timed delivery of critical equipment for corporate and private events.', badge: 'TIMED' },
            { title: 'Fragile Decor Transit', desc: 'Sensitive handling of flowers, furniture, and unique event pieces.', badge: 'SENSITIVE' }
        ],
        testimonial: { quote: 'In hospitality, the logistics should be invisible to the guest. CYVhub handles our multi-site replenishment with absolute discretion and reliability.', author: 'Elena Vasquez', role: 'Events Operations Lead', company: 'Luxury Venue Group' }
    }
};
export const initialServiceDetails: Record<string, ServicePageDetail> = {
    'same-day-delivery': {
        id: 'same-day-delivery',
        slug: 'same-day-delivery',
        title: 'Same-Day Delivery',
        summary: 'Fast and dependable same-day logistics support for urgent business consignments, operational deadlines, and time-sensitive deliveries.',
        heroHeading: 'Same-Day Delivery for Time-Critical Business Requirements',
        heroSubtext: 'CYVhub helps businesses move urgent consignments quickly and professionally when timing matters most.',
        overview: 'Same-day delivery is essential for businesses that cannot afford delays. Whether the requirement involves urgent spare parts, high-priority documents, operational stock, site-critical supplies, or customer commitments that must be met within hours, CYVhub provides responsive same-day delivery support designed for business reliability and speed.',
        description: 'CYVhub receives the collection request, assigns the most suitable delivery resource, tracks the movement in real time, and ensures the consignment is delivered as quickly and efficiently as possible. The process is built around urgency, visibility, and dependable execution.',
        howItWorks: 'CYVhub receives the collection request, assigns the most suitable delivery resource, tracks the movement in real time, and ensures the consignment is delivered as quickly and efficiently as possible. The process is built around urgency, visibility, and dependable execution.',
        benefits: [
            'Faster response to urgent delivery needs',
            'Reduced downtime caused by waiting on stock or parts',
            'Improved business continuity',
            'Better service responsiveness to clients and sites',
            'Real-time delivery visibility'
        ],
        useCases: [
            'Urgent spare parts movement',
            'Same-day document delivery',
            'Site-critical deliveries',
            'Medical and healthcare consignments',
            'Last-minute business stock replenishment'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for same-day delivery because we focus on speed, communication, accountability, and dependable B2B service execution.'
        ],
        ctaHeading: 'Need an urgent delivery completed today?',
        ctaText: 'Contact CYVhub for responsive same-day business delivery support.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155',
        icon: 'Zap',
        publishStatus: true,
        order: 1,
        metaTitle: 'Same-Day Delivery | Time-Critical Business Logistics | CYVhub',
        metaDesc: 'Fast and dependable same-day courier services for businesses. Urgent spare parts, documents, and stock delivered nationwide with real-time tracking.'
    },
    'scheduled-collections': {
        id: 'scheduled-collections',
        slug: 'scheduled-collections',
        title: 'Scheduled Collections',
        summary: 'Planned collection services that help businesses move goods consistently through repeat pickup schedules and dependable transport support.',
        heroHeading: 'Scheduled Collections That Support Consistent Business Operations',
        heroSubtext: 'CYVhub helps businesses simplify recurring collections with reliable, organised, and professional logistics support.',
        overview: 'Scheduled collections help businesses create consistency in the movement of goods between suppliers, offices, warehouses, branches, depots, and customer locations. Instead of arranging transport case by case, CYVhub provides structured collection support that keeps operations organised and predictable.',
        description: 'Businesses choose a collection pattern based on their operational needs. CYVhub then manages collection timing, route coordination, and transport execution through an organised repeat service model.',
        howItWorks: 'Businesses choose a collection pattern based on their operational needs. CYVhub then manages collection timing, route coordination, and transport execution through an organised repeat service model.',
        benefits: [
            'Greater operational consistency',
            'Reduced time spent arranging repeat transport manually',
            'Better planning for stock and dispatch cycles',
            'Improved reliability across recurring collection needs',
            'Stronger day-to-day logistics control'
        ],
        useCases: [
            'Daily supplier pickups',
            'Weekly warehouse collections',
            'Recurring branch transfer runs',
            'Routine collection from clients or sites',
            'Scheduled support for distribution operations'
        ],
        whyChooseUs: [
            'Businesses use CYVhub for scheduled collections because repeat logistics need structure, reliability, and dependable execution.'
        ],
        ctaHeading: 'Need recurring collections managed professionally?',
        ctaText: 'Talk to CYVhub about a scheduled collection service tailored to your operation.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59',
        icon: 'Calendar',
        publishStatus: true,
        order: 2,
        metaTitle: 'Scheduled Collections | Reliable Repeat Logistics | CYVhub',
        metaDesc: 'Professional scheduled collection services for UK businesses. Simplify recurring logistics with dependable daily or weekly collection patterns.'
    },
    'multi-drop-business-routes': {
        id: 'multi-drop-business-routes',
        slug: 'multi-drop-business-routes',
        title: 'Multi-Drop Business Routes',
        summary: 'Efficient multi-stop route delivery support for businesses serving multiple locations, clients, branches, or commercial sites.',
        heroHeading: 'Efficient Multi-Drop Delivery Routes for Business Operations',
        heroSubtext: 'CYVhub helps businesses manage multiple deliveries on structured routes with improved efficiency, visibility, and dependable execution.',
        overview: 'Multi-drop business routes are ideal for businesses that need regular deliveries to multiple destinations within a single delivery cycle. CYVhub helps organisations move stock, parts, supplies, and operational goods across several stops efficiently while maintaining route control and delivery visibility.',
        description: 'CYVhub plans the route, coordinates the stops, assigns the most suitable resource, and tracks the route from start to completion. The goal is to make multi-stop delivery operations more organised, efficient, and scalable.',
        howItWorks: 'CYVhub plans the route, coordinates the stops, assigns the most suitable resource, and tracks the route from start to completion. The goal is to make multi-stop delivery operations more organised, efficient, and scalable.',
        benefits: [
            'Improved route efficiency',
            'Better use of delivery resources',
            'Consistent service across multiple stops',
            'Reduced delivery coordination burden',
            'Greater visibility across route execution'
        ],
        useCases: [
            'Retail branch replenishment',
            'Automotive parts routes',
            'Trade supplier delivery runs',
            'Hospitality supply distribution',
            'Multi-site stock movement'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for multi-drop route delivery because efficient route execution reduces cost, improves consistency, and strengthens service performance.'
        ],
        ctaHeading: 'Need a better way to manage repeat delivery routes?',
        ctaText: 'Speak to CYVhub about multi-drop route logistics built around your business.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c',
        icon: 'Map',
        publishStatus: true,
        order: 3,
        metaTitle: 'Multi-Drop Delivery Routes | Efficient Business Logistics | CYVhub',
        metaDesc: 'Streamlined multi-stop delivery routes for UK enterprises. Improve route efficiency and delivery consistency across multiple commercial locations.'
    },
    'dedicated-contract-delivery': {
        id: 'dedicated-contract-delivery',
        slug: 'dedicated-contract-delivery',
        title: 'Dedicated Contract Delivery',
        summary: 'Long-term delivery support tailored to your business through dedicated service arrangements, planned capacity, and dependable execution.',
        heroHeading: 'Dedicated Contract Delivery for Ongoing Business Logistics Needs',
        heroSubtext: 'CYVhub supports businesses with structured, contract-based logistics services designed for consistency, accountability, and operational continuity.',
        overview: 'Dedicated contract delivery is designed for businesses that need dependable long-term logistics support rather than one-off transport arrangements. CYVhub works with businesses to provide consistent service delivery aligned to agreed schedules, service expectations, and operational requirements.',
        description: 'CYVhub sets up a delivery framework around the customer’s business needs, including route patterns, service levels, frequency, account handling, and reporting where required. This creates a structured logistics service businesses can rely on.',
        howItWorks: 'CYVhub sets up a delivery framework around the customer’s business needs, including route patterns, service levels, frequency, account handling, and reporting where required. This creates a structured logistics service businesses can rely on.',
        benefits: [
            'More predictable logistics support',
            'Better service continuity',
            'Reduced dependence on ad hoc transport sourcing',
            'Stronger operational planning',
            'Closer alignment with business delivery requirements'
        ],
        useCases: [
            'Ongoing branch deliveries',
            'Contract route support',
            'Regular supplier-to-customer transport',
            'Dedicated trade delivery programmes',
            'Managed recurring business distribution'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for dedicated contract delivery because we provide a more stable and accountable logistics model built around long-term operational support.'
        ],
        ctaHeading: 'Need dependable contract-based logistics support?',
        ctaText: 'Talk to CYVhub about a dedicated delivery solution tailored to your business.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55',
        icon: 'Briefcase',
        publishStatus: true,
        order: 4,
        metaTitle: 'Dedicated Contract Delivery | Long-Term Logistics | CYVhub',
        metaDesc: 'Dependable contract-based logistics for ongoing business needs. Custom delivery frameworks, agreed service levels, and operational continuity.'
    },
    'pallet-and-freight-movement': {
        id: 'pallet-and-freight-movement',
        slug: 'pallet-and-freight-movement',
        title: 'Pallet and Freight Movement',
        summary: 'Professional transport support for palletised goods, bulk consignments, and freight movement across business supply chains.',
        heroHeading: 'Reliable Pallet and Freight Movement for Business Supply Chains',
        heroSubtext: 'CYVhub helps businesses move palletised goods and freight efficiently, professionally, and with better visibility.',
        overview: 'Pallet and freight movement is essential for businesses dealing with larger consignments, commercial stock transfers, supply chain distribution, and wholesale movement. CYVhub supports businesses with practical transport coordination for heavier, bulkier, and palletised loads through dependable B2B logistics handling.',
        description: 'CYVhub coordinates collection, movement, route planning, delivery handling, and tracking support for pallet and freight consignments based on the size, timing, and operational requirements of each job.',
        howItWorks: 'CYVhub coordinates collection, movement, route planning, delivery handling, and tracking support for pallet and freight consignments based on the size, timing, and operational requirements of each job.',
        benefits: [
            'Better support for larger consignments',
            'Greater reliability across freight movement',
            'Improved handling coordination',
            'More efficient supply chain transport support',
            'Clearer visibility for business deliveries'
        ],
        useCases: [
            'Warehouse-to-customer pallet runs',
            'Manufacturing stock movement',
            'Wholesale distribution support',
            'Inter-depot freight transfer',
            'Larger commercial delivery requirements'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for pallet and freight movement because we provide structured logistics support for loads that require stronger coordination and dependable execution.'
        ],
        ctaHeading: 'Need dependable support for pallet or freight deliveries?',
        ctaText: 'Contact CYVhub to discuss a freight solution tailored to your business requirements.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276',
        icon: 'Truck',
        publishStatus: true,
        order: 5,
        metaTitle: 'Pallet & Freight Movement | Bulk Business Transport | CYVhub',
        metaDesc: 'Professional transport for palletised goods and commercial freight. Reliable supply chain distribution for bulk B2B consignments nationwide.'
    },
    'returns-logistics': {
        id: 'returns-logistics',
        slug: 'returns-logistics',
        title: 'Returns Logistics',
        summary: 'Structured logistics support for returns, collections, recovery flows, failed deliveries, and controlled reverse movement.',
        heroHeading: 'Returns Logistics That Bring Structure to Reverse Movement',
        heroSubtext: 'CYVhub helps businesses manage returns and reverse-flow logistics with better visibility, control, and consistency.',
        overview: 'Returns logistics is an important part of business operations, particularly where customer returns, failed deliveries, recovery collections, faulty equipment returns, or reverse supply chain movement need to be handled efficiently. CYVhub provides dependable returns logistics support to help businesses regain control of reverse movement.',
        description: 'CYVhub manages the collection and reverse transport process, ensuring returned items are collected, moved, tracked, and delivered back to the correct destination with clear operational visibility.',
        howItWorks: 'CYVhub manages the collection and reverse transport process, ensuring returned items are collected, moved, tracked, and delivered back to the correct destination with clear operational visibility.',
        benefits: [
            'Better control over returned and recovered goods',
            'Reduced disruption in reverse movement',
            'Stronger visibility across collections and returns',
            'Faster recovery of business assets and stock',
            'Improved operational consistency'
        ],
        useCases: [
            'Customer returns collection',
            'Failed delivery recovery',
            'Faulty equipment return transport',
            'Asset retrieval',
            'Recovery movement back to suppliers or warehouses'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for returns logistics because reverse movement needs the same structure and professionalism as outbound delivery.'
        ],
        ctaHeading: 'Need a smarter approach to returns and recovery logistics?',
        ctaText: 'Talk to CYVhub about a returns logistics service built around your operation.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
        icon: 'ArrowLeftRight',
        publishStatus: true,
        order: 6,
        metaTitle: 'Returns Logistics | Reverse Flow Management | CYVhub',
        metaDesc: 'Specialist returns and recovery logistics for businesses. Gain better control over reverse-flow movement, asset retrieval, and customer returns.'
    },
    'sla-based-delivery-service': {
        id: 'sla-based-delivery-service',
        slug: 'sla-based-delivery-service',
        title: 'SLA-Based Delivery Service',
        summary: 'Delivery services structured around agreed service levels, response expectations, delivery standards, and business accountability.',
        heroHeading: 'SLA-Based Delivery Services Built Around Business Expectations',
        heroSubtext: 'CYVhub helps businesses define and receive logistics support aligned to agreed service levels and operational priorities.',
        overview: 'Some businesses need more than general delivery support. They need clear service expectations, agreed response windows, dependable execution, and accountability around performance. CYVhub provides SLA-based delivery services that support structured operational demands and defined service standards.',
        description: 'CYVhub works with the customer to define service parameters such as response expectations, operating windows, collection frequency, delivery priorities, and reporting requirements. These are then delivered through a managed logistics framework.',
        howItWorks: 'CYVhub works with the customer to define service parameters such as response expectations, operating windows, collection frequency, delivery priorities, and reporting requirements. These are then delivered through a managed logistics framework.',
        benefits: [
            'Greater accountability in service delivery',
            'More predictable operational support',
            'Clearer alignment between logistics and business expectations',
            'Better control over performance standards',
            'Stronger support for mission-critical operations'
        ],
        useCases: [
            'Managed support contracts',
            'Healthcare or technical operations',
            'Recurring service routes with agreed targets',
            'Business-critical timed deliveries',
            'Account-managed B2B transport services'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub for SLA-based delivery because agreed logistics standards help reduce uncertainty and improve operational confidence.'
        ],
        ctaHeading: 'Need logistics support built around clear service levels?',
        ctaText: 'Speak to CYVhub about an SLA-based delivery model for your business.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f',
        icon: 'ShieldCheck',
        publishStatus: true,
        order: 7,
        metaTitle: 'SLA-Based Delivery | Managed Service Levels | CYVhub',
        metaDesc: 'Logistics support built around agreed business standards. Define response windows, delivery priorities, and operational accountability with CYVhub.'
    },
    'live-tracking-proof-of-delivery': {
        id: 'live-tracking-proof-of-delivery',
        slug: 'live-tracking-proof-of-delivery',
        title: 'Live Tracking and Proof of Delivery',
        summary: 'Real-time visibility, delivery status updates, and proof of delivery support that help businesses stay informed and accountable.',
        heroHeading: 'Live Tracking and Proof of Delivery for Better Logistics Visibility',
        heroSubtext: 'CYVhub gives businesses better visibility across the delivery journey with real-time tracking and dependable proof of delivery records.',
        overview: 'Businesses want more than goods being moved from point A to point B. They want visibility, confidence, and confirmation. CYVhub supports business deliveries with live tracking updates and proof of delivery capabilities that improve transparency and strengthen operational trust.',
        description: 'As consignments move, delivery progress is tracked and status updates are made available. On completion, proof of delivery is captured to provide confirmation and accountability for the completed service.',
        howItWorks: 'As consignments move, delivery progress is tracked and status updates are made available. On completion, proof of delivery is captured to provide confirmation and accountability for the completed service.',
        benefits: [
            'Improved visibility throughout the delivery process',
            'Better internal and customer communication',
            'Clear confirmation of completed deliveries',
            'Reduced uncertainty and follow-up pressure',
            'Stronger accountability across logistics operations'
        ],
        useCases: [
            'Time-sensitive consignments',
            'Client-facing delivery services',
            'Managed route operations',
            'High-value delivery support',
            'Account-based logistics services'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub because tracking and proof of delivery are essential for confidence, communication, and accountability in modern logistics.'
        ],
        ctaHeading: 'Need better delivery visibility and proof of completion?',
        ctaText: 'Contact CYVhub about live tracking and proof of delivery support for your business.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8669966155',
        icon: 'Target',
        publishStatus: true,
        order: 8,
        metaTitle: 'Live Delivery Tracking & POD | Logistics Visibility | CYVhub',
        metaDesc: 'Real-time tracking and electronic proof of delivery (ePOD) for every business job. Gain full transparency across your supply chain with CYVhub.'
    },
    'account-based-invoicing': {
        id: 'account-based-invoicing',
        slug: 'account-based-invoicing',
        title: 'Account-Based Invoicing',
        summary: 'Business-friendly invoicing support for account customers who need structured billing, simplified payment management, and operational convenience.',
        heroHeading: 'Account-Based Invoicing for Better Business Billing Control',
        heroSubtext: 'CYVhub supports business customers with account-based invoicing designed to simplify repeat logistics billing and improve financial administration.',
        overview: 'For many business customers, paying job by job is not the most efficient way to manage logistics. Account-based invoicing provides a more structured billing model that supports repeat services, ongoing delivery arrangements, and easier internal financial processing. CYVhub helps business customers simplify logistics billing through account-based invoicing support.',
        description: 'Approved business customers receive logistics support under an account structure, with invoicing handled according to agreed billing terms. This helps reduce manual payment friction and creates a more professional commercial workflow.',
        howItWorks: 'Approved business customers receive logistics support under an account structure, with invoicing handled according to agreed billing terms. This helps reduce manual payment friction and creates a more professional commercial workflow.',
        benefits: [
            'Easier billing management for repeat logistics use',
            'Reduced admin burden',
            'More structured commercial relationships',
            'Better support for ongoing service arrangements',
            'Improved internal payment processing'
        ],
        useCases: [
            'Repeat delivery customers',
            'Contract-based logistics arrangements',
            'Multi-job business accounts',
            'Managed service customers',
            'Businesses with internal procurement and finance workflows'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub because account-based invoicing makes repeat logistics support easier to manage commercially and operationally.'
        ],
        ctaHeading: 'Need a more structured invoicing model for repeat delivery needs?',
        ctaText: 'Talk to CYVhub about account-based invoicing for your business logistics services.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1454165833767-1246e7f2269a',
        icon: 'FileText',
        publishStatus: true,
        order: 9,
        metaTitle: 'Account-Based Invoicing | B2B Logistics Billing | CYVhub',
        metaDesc: 'Simplify logistics administration with account-based invoicing. Corporate billing terms, structured payments, and consolidated logistics reporting.'
    },
    'route-planning-dispatch-management': {
        id: 'route-planning-dispatch-management',
        slug: 'route-planning-dispatch-management',
        title: 'Route Planning and Dispatch Management',
        summary: 'Coordinated route planning and dispatch support that helps businesses improve delivery flow, control operations, and manage logistics more effectively.',
        heroHeading: 'Route Planning and Dispatch Management for Smarter Delivery Operations',
        heroSubtext: 'CYVhub helps businesses manage logistics more effectively through organised route planning and dependable dispatch coordination.',
        overview: 'When delivery operations become more frequent or more complex, route planning and dispatch management become critical. Businesses need delivery work assigned efficiently, routes coordinated properly, and transport activity monitored with control and visibility. CYVhub supports this through structured route planning and dispatch management services.',
        description: 'CYVhub coordinates delivery planning, route structuring, dispatch allocation, movement oversight, and operational visibility to support better service execution and improved delivery efficiency.',
        howItWorks: 'CYVhub coordinates delivery planning, route structuring, dispatch allocation, movement oversight, and operational visibility to support better service execution and improved delivery efficiency.',
        benefits: [
            'Better route efficiency',
            'Improved delivery coordination',
            'Stronger operational visibility',
            'Reduced manual dispatch burden',
            'More scalable logistics support'
        ],
        useCases: [
            'Repeat daily route operations',
            'Multi-drop delivery planning',
            'Contract logistics coordination',
            'Managed business distribution',
            'Growing B2B delivery programmes'
        ],
        whyChooseUs: [
            'Businesses choose CYVhub because stronger route planning and dispatch coordination improve service reliability, efficiency, and control.'
        ],
        ctaHeading: 'Need smarter route planning and dispatch support?',
        ctaText: 'Contact CYVhub to discuss a route planning and dispatch solution for your business.',
        ctaButtonText: 'Contact Us',
        ctaButtonUrl: '/contact',
        heroImageUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563',
        icon: 'Settings',
        publishStatus: true,
        order: 10,
        metaTitle: 'Route Planning & Dispatch | logistics Coordination | CYVhub',
        metaDesc: 'Optimize your delivery operations with expert route planning and dispatch management. scalable logistics coordination for modern B2B fleets.'
    }
};

export const initialMenuConfig: MenuConfig = {
    items: [
        { id: 'home', label: 'Home', url: '/', showHeader: true, showFooter: false },
        { id: '1', label: 'Services', url: '/services', showHeader: true, showFooter: true },
        { id: '2', label: 'Industries', url: '/industries', showHeader: true, showFooter: true },
        { id: '3', label: 'Careers', url: '/careers', showHeader: false, showFooter: true },
        { id: '4', label: 'About', url: '/about', showHeader: true, showFooter: true },
        { id: '5', label: 'Contact', url: '/contact', showHeader: true, showFooter: true },
    ]
};

export const initialCareersPage: CareersPageConfig = {
    heroTitle: 'Build the Future of Logistics',
    heroSubtitle: 'At CYVhub, we are transforming the way businesses move goods. Join our dynamic team and help us build a smarter, greener delivery network.',
    introTitle: 'Why CYVhub?',
    introContent: 'We leverage deep tech and AI to optimize routes and pricing in real-time. Work on challenging problems that have physical real-world impact.',
    perksTitle: 'Our Benefits',
    perks: [
        { id: '1', title: 'Innovation First', desc: 'Work with the latest tech stack and AI models.', icon: 'Zap', color: '#0D9488' },
        { id: '2', title: 'Work from Anywhere', desc: 'Flexible, remote-first working arrangements.', icon: 'Globe', color: '#16A34A' },
        { id: '3', title: 'Health & Wellbeing', desc: 'Comprehensive private healthcare for you and yours.', icon: 'Heart', color: '#9333EA' },
    ],
    ctaTitle: 'Don\'t see a role that fits?',
    ctaSubtitle: 'Join our talent network and be the first to hear about new openings.',
    ctaButtonText: 'Join Talent Network',
    metaTitle: 'Careers | Join the CYVhub Team',
    metaDesc: 'Explore job openings at CYVhub and help us redefine B2B logistics with technology and innovation.'
};

export const initialJobOpenings: JobOpening[] = [
    {
        id: '1',
        title: 'Senior Full-Stack Engineer',
        department: 'Engineering',
        location: 'Remote (UK)',
        employmentType: 'FULL_TIME',
        summary: 'Lead the development of our core logistics platform and AI-driven route optimization engine.',
        description: 'We are looking for a senior engineer to join our growing team...',
        responsibilities: 'Design and implement scalable microservices...',
        requirements: '5+ years experience with React, Node.js, and Postgres...',
        salaryInfo: '£70k - £90k + Equity',
        applicationUrl: '/contact',
        status: 'OPEN',
        isPublished: true,
        displayOrder: 0
    }
];
