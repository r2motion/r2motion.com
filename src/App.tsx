import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleCheck,
  Gauge,
  LockKeyhole,
  Mail,
  MonitorSmartphone,
  Puzzle,
  SearchCheck,
  Send,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import {
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Metric = {
  label: string;
  value: string;
};

type PortfolioItem = {
  title: string;
  slug: string;
  year: string;
  category: string;
  summary: string;
  description: string;
  services: string[];
  technologies: string[];
  metrics: Metric[];
  coverImage: string;
  accentColor: string;
  featured: boolean;
  order: number;
  liveUrl?: string;
  caseStudyUrl?: string;
};

type PortfolioModule = {
  default: PortfolioItem;
};

type PartnerItem = {
  name: string;
  slug: string;
  logoText: string;
  logoImage?: string;
  relationshipType: 'client' | 'partner';
  category: string;
  websiteUrl?: string;
  featured: boolean;
  order: number;
};

type PartnerModule = {
  default: Omit<PartnerItem, 'relationshipType'> & {
    relationshipType?: PartnerItem['relationshipType'];
  };
};

type ThemeName = 'ember' | 'mint';

const uploadedAssetVersion = String(Date.now());

const themeOptions: Array<{ label: string; value: ThemeName }> = [
  { label: 'Ember', value: 'ember' },
  { label: 'Mint', value: 'mint' },
];

function getVersionedUploadUrl(src: string) {
  if (!src.startsWith('/uploads/')) {
    return src;
  }

  return `${src}${src.includes('?') ? '&' : '?'}v=${uploadedAssetVersion}`;
}

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'ember';
  }

  const savedTheme = window.localStorage.getItem('r2motion-theme');
  return savedTheme === 'mint' || savedTheme === 'ember' ? savedTheme : 'ember';
}

const portfolioModules = import.meta.glob('./content/portfolio/*.json', {
  eager: true,
}) as Record<string, PortfolioModule>;

const clientModules = import.meta.glob('./content/clients/*.json', {
  eager: true,
}) as Record<string, PartnerModule>;

const partnerModules = import.meta.glob('./content/partners/*.json', {
  eager: true,
}) as Record<string, PartnerModule>;

const portfolioItems = Object.values(portfolioModules)
  .map((module) => module.default)
  .sort((a, b) => {
    if (a.featured !== b.featured) {
      return Number(b.featured) - Number(a.featured);
    }

    return a.order - b.order;
  });

const portfolioCategories = [
  'All',
  ...Array.from(new Set(portfolioItems.map((item) => item.category))),
];

const clientItems = Object.values(clientModules).map((module) => ({
  ...module.default,
  relationshipType: 'client' as const,
}));

const collaboratorItems = Object.values(partnerModules).map((module) => ({
  ...module.default,
  relationshipType: 'partner' as const,
}));

const partnerItems = [...clientItems, ...collaboratorItems]
  .sort((a, b) => {
    if (a.featured !== b.featured) {
      return Number(b.featured) - Number(a.featured);
    }

    return a.order - b.order;
  });

const services: Array<{
  icon: LucideIcon;
  title: string;
  text: string;
  detail: string;
}> = [
  {
    icon: Smartphone,
    title: 'Mobile app design and development',
    text: 'Product-grade iOS and Android experiences with elegant UX, resilient architecture, and launch-ready polish.',
    detail: 'Native-feeling flows, prototypes, APIs, releases',
  },
  {
    icon: MonitorSmartphone,
    title: 'Web design and development',
    text: 'Modern sites and platforms engineered for speed, conversion, search visibility, and easy operations.',
    detail: 'React, WordPress, dashboards, storefronts',
  },
  {
    icon: ServerCog,
    title: 'Enterprise hosting',
    text: 'Managed hosting foundations for serious businesses that need uptime, performance, backups, and calm support.',
    detail: 'DNS, SSL, email, monitoring, migrations',
  },
  {
    icon: SearchCheck,
    title: 'SEO',
    text: 'Technical SEO and content structure that gives search engines clean signals without compromising the brand.',
    detail: 'Schema, performance, indexing, local search',
  },
  {
    icon: Puzzle,
    title: 'WordPress plugin development',
    text: 'Custom plugins that automate workflows, extend commerce, integrate APIs, and stay maintainable after launch.',
    detail: 'Admin UI, REST APIs, payments, integrations',
  },
  {
    icon: Boxes,
    title: 'Custom digital products',
    text: 'Internal tools, portals, booking systems, automations, and digital products built around the way you work.',
    detail: 'Discovery, build, iterate, support',
  },
];

const processSteps = [
  {
    label: '01',
    title: 'Map the signal',
    text: 'Clarify the audience, business model, technical constraints, and the moments where the experience has to feel unmistakably premium.',
  },
  {
    label: '02',
    title: 'Design the system',
    text: 'Shape the interface, content model, motion language, and technical architecture before production starts moving fast.',
  },
  {
    label: '03',
    title: 'Build the product',
    text: 'Develop the site, app, plugin, or platform with clean implementation, responsive behavior, and practical admin workflows.',
  },
  {
    label: '04',
    title: 'Launch and improve',
    text: 'Ship with performance checks, hosting hardening, SEO basics, analytics readiness, and a path for future iteration.',
  },
];

const trustItems = [
  { icon: ServerCog, label: 'Enterprise hosting', text: 'Managed deployment, DNS, SSL, backups, migrations, and uptime care.' },
  { icon: SearchCheck, label: 'Search systems', text: 'Technical SEO foundations, structured content, metadata, and clean indexing paths.' },
  { icon: Gauge, label: 'Performance', text: 'Lean frontends, responsive assets, fast builds, and Core Web Vitals discipline.' },
  { icon: ShieldCheck, label: 'Security', text: 'Hardened defaults, sane permissions, update paths, and production-minded handling.' },
  { icon: Puzzle, label: 'WordPress', text: 'Custom plugins, theme integrations, admin flows, and content editing systems.' },
  { icon: Smartphone, label: 'Apps', text: 'Mobile and web app design with thoughtful product UX and production delivery.' },
];

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

function usePointerScene() {
  useEffect(() => {
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      document.documentElement.style.setProperty('--pointer-x', pointerX.toFixed(4));
      document.documentElement.style.setProperty('--pointer-y', pointerY.toFixed(4));
      frame = 0;
    };

    const onPointerMove = (event: globalThis.PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;

      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.22 }}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

function TiltCard({
  children,
  className = '',
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  const reduceMotion = useReducedMotion();

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    target.style.setProperty('--tilt-x', `${(-y * 8).toFixed(2)}deg`);
    target.style.setProperty('--tilt-y', `${(x * 10).toFixed(2)}deg`);
    target.style.setProperty('--shine-x', `${((x + 0.5) * 100).toFixed(2)}%`);
    target.style.setProperty('--shine-y', `${((y + 0.5) * 100).toFixed(2)}%`);
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
    event.currentTarget.style.setProperty('--shine-x', '50%');
    event.currentTarget.style.setProperty('--shine-y', '50%');
  };

  return (
    <article
      className={`tilt-card ${className}`}
      style={{ '--accent': accent ?? '#4ee1a0' } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </article>
  );
}

function MagneticLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || !ref.current) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);

    ref.current.style.transform = `translate3d(${x * 0.16}px, ${y * 0.22}px, 0)`;
  };

  const onPointerLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      className={`magnetic-link magnetic-link--${variant}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" size={18} />
    </a>
  );
}

function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="signal-grid" />
      <div className="hero-panel hero-panel--stack">
        <div className="panel-kicker">Studio OS</div>
        <div className="panel-title">Design, build, host, optimize</div>
        <div className="panel-bars">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="hero-panel hero-panel--metrics">
        <div>
          <span>Performance</span>
          <strong>98</strong>
        </div>
        <div>
          <span>Launch speed</span>
          <strong>4w</strong>
        </div>
      </div>
      <div className="hero-panel hero-panel--flow">
        <span className="flow-node flow-node--active" />
        <span className="flow-line" />
        <span className="flow-node" />
        <span className="flow-line" />
        <span className="flow-node" />
      </div>
      <div className="hero-panel hero-panel--code">
        <span>app.design()</span>
        <span>hosting.secure()</span>
        <span>seo.index()</span>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a href="#top" className="brand-mark" aria-label="(r2)motion home">
        <span>(r2)</span>motion
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a href="#services">Services</a>
        <a href="#portfolio">Portfolio</a>
        <a href="#partners">Partners</a>
        <a href="#process">Process</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#contact" className="header-action">
        Start a project
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="hero-texture" aria-hidden="true" />
      <HeroScene />
      <div className="hero-content">
        <motion.p
          className="eyebrow"
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Premium digital agency and product studio
        </motion.p>
        <motion.h1
          initial={{ y: 22 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="brand-orange">(r2)</span>motion
        </motion.h1>
        <motion.div
          className="hero-focus-line"
          initial={{ y: 24 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.72, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Design. Build. Host. Optimize."
        >
          <span>Design.</span>
          <span>Build.</span>
          <span>Host.</span>
          <span>Optimize.</span>
        </motion.div>
        <motion.p
          className="hero-statement"
          initial={{ y: 22 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          Digital products, websites, apps, hosting, SEO, and WordPress systems
          shaped with technical taste and motion-led clarity.
        </motion.p>
        <motion.div
          className="hero-actions"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <MagneticLink href="#contact">Start a project</MagneticLink>
          <MagneticLink href="#portfolio" variant="secondary">
            View work
          </MagneticLink>
        </motion.div>
        <motion.p
          className="hero-location"
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          Based in Oranjestad, Aruba
        </motion.p>
      </div>
      <div className="hero-proof" aria-label="Studio capabilities">
        <span>Apps</span>
        <span>Web</span>
        <span>Hosting</span>
        <span>SEO</span>
        <span>Plugins</span>
      </div>
      <motion.a
        href="#services"
        className="hero-scroll-cue"
        aria-label="Scroll to services"
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.55, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="scroll-mouse" aria-hidden="true">
          <span />
        </span>
        <span className="scroll-cue-label">Scroll down</span>
      </motion.a>
    </section>
  );
}

function Services() {
  return (
    <section className="content-section section-shell" id="services">
      <Reveal className="section-heading">
        <p className="eyebrow">Services</p>
        <h2>Premium builds with operational depth.</h2>
        <p>
          A focused studio model for teams that need sharp design, strong engineering,
          reliable hosting, and digital systems that stay useful after launch.
        </p>
      </Reveal>

      <motion.div
        className="services-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
      >
        {services.map((service, index) => {
          const Icon = service.icon;

          return (
            <motion.div key={service.title} variants={revealVariants}>
              <TiltCard className={`service-card service-card--${index + 1}`}>
                <div className="service-icon">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span>{service.detail}</span>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function Portfolio() {
  const reduceMotion = useReducedMotion();
  const [activeSlug, setActiveSlug] = useState(portfolioItems[0]?.slug ?? '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isRailPaused, setIsRailPaused] = useState(false);
  const filteredPortfolioItems = useMemo(
    () =>
      activeCategory === 'All'
        ? portfolioItems
        : portfolioItems.filter((item) => item.category === activeCategory),
    [activeCategory],
  );
  const activeProject =
    filteredPortfolioItems.find((item) => item.slug === activeSlug) ??
    filteredPortfolioItems[0] ??
    portfolioItems[0];
  const shouldAnimateRail = !reduceMotion && filteredPortfolioItems.length > 1;

  useEffect(() => {
    if (!filteredPortfolioItems.some((item) => item.slug === activeSlug)) {
      setActiveSlug(filteredPortfolioItems[0]?.slug ?? '');
    }
  }, [activeSlug, filteredPortfolioItems]);

  if (!activeProject) {
    return null;
  }

  const setCategory = (category: string) => {
    const nextItems =
      category === 'All'
        ? portfolioItems
        : portfolioItems.filter((item) => item.category === category);

    setActiveCategory(category);
    setActiveSlug(nextItems[0]?.slug ?? '');
  };

  return (
    <section className="content-section portfolio-section section-shell" id="portfolio">
      <Reveal className="section-heading section-heading--split portfolio-heading-shell">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2>Selected digital systems, shaped for motion and scale.</h2>
        </div>
        <p>
          A focused mix of mobile, web, plugin, hosting, and product work with
          clean interfaces and production-aware execution.
        </p>
      </Reveal>

      <div className="portfolio-filter-shell">
        <div className="portfolio-filter-bar" aria-label="Portfolio categories">
          {portfolioCategories.map((category) => (
            <button
              type="button"
              className={category === activeCategory ? 'is-active' : ''}
              key={category}
              aria-pressed={category === activeCategory}
              onClick={() => setCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="portfolio-stage">
        <div className="portfolio-rail" aria-label="Featured project rail">
          <div
            className={`portfolio-rail-track ${shouldAnimateRail ? 'portfolio-rail-track--auto' : ''} ${
              isRailPaused ? 'is-paused' : ''
            }`}
            onPointerDown={() => setIsRailPaused(true)}
            onPointerUp={() => setIsRailPaused(false)}
            onPointerCancel={() => setIsRailPaused(false)}
            onPointerLeave={() => setIsRailPaused(false)}
          >
            {filteredPortfolioItems.map((item) => (
              <button
                type="button"
                className="portfolio-rail-card"
                style={{ '--accent': item.accentColor } as CSSProperties}
                key={item.slug}
                aria-pressed={item.slug === activeProject.slug}
                onClick={() => setActiveSlug(item.slug)}
                onFocus={() => setActiveSlug(item.slug)}
              >
                <span className="portfolio-rail-image">
                  <img src={item.coverImage} alt={`${item.title} interface preview`} draggable="false" />
                </span>
                <span className="portfolio-rail-caption">
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                </span>
              </button>
            ))}
            {filteredPortfolioItems.map((item) => (
              <div
                className="portfolio-rail-card portfolio-rail-card--ghost"
                style={{ '--accent': item.accentColor } as CSSProperties}
                key={`${item.slug}-ghost`}
                aria-hidden="true"
              >
                <span className="portfolio-rail-image">
                  <img src={item.coverImage} alt="" draggable="false" />
                </span>
                <span className="portfolio-rail-caption">
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <motion.article
          className="portfolio-detail"
          key={activeProject.slug}
          style={{ '--accent': activeProject.accentColor } as CSSProperties}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          aria-live="polite"
        >
          <div className="portfolio-meta">
            <span>{activeProject.category}</span>
            <span>{activeProject.year}</span>
          </div>
          <h3>{activeProject.title}</h3>
          <p>{activeProject.summary}</p>
          <div className="portfolio-metrics">
            {activeProject.metrics.slice(0, 3).map((metric) => (
              <span key={`${activeProject.slug}-${metric.label}`}>
                <strong>{metric.value}</strong>
                {metric.label}
              </span>
            ))}
          </div>
          <div className="tag-row">
            {activeProject.technologies.slice(0, 5).map((technology) => (
              <span key={`${activeProject.slug}-${technology}`}>{technology}</span>
            ))}
          </div>
          <div className="portfolio-links">
            {activeProject.caseStudyUrl ? (
              <a href={activeProject.caseStudyUrl}>
                Case study <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : null}
            {activeProject.liveUrl ? (
              <a href={activeProject.liveUrl}>
                Live project <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function PartnerLogo({ partner }: { partner: PartnerItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (partner.logoImage && !imageFailed) {
    return (
      <span className="partner-logo partner-logo--image">
        <img
          src={getVersionedUploadUrl(partner.logoImage)}
          alt={`${partner.name} logo`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return <span className="partner-logo partner-logo--text">{partner.logoText}</span>;
}

function PartnerMark({ partner }: { partner: PartnerItem }) {
  const content = (
    <PartnerLogo partner={partner} />
  );

  if (partner.websiteUrl) {
    return (
      <a className="partner-mark" href={partner.websiteUrl} aria-label={partner.name}>
        {content}
      </a>
    );
  }

  return (
    <div className="partner-mark" aria-label={partner.name}>
      {content}
    </div>
  );
}

function PartnerLane({
  eyebrow,
  title,
  description,
  items,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: PartnerItem[];
  reverse?: boolean;
}) {
  if (!items.length) {
    return null;
  }

  const marqueeItems = [...items, ...items, ...items];

  return (
    <Reveal className={`partner-lane ${reverse ? 'partner-lane--reverse' : ''}`}>
      <div className="partner-lane-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="partners-marquee" aria-label={`${eyebrow} logo row`}>
        <div className="partners-track">
          {marqueeItems.map((partner, index) => (
            <PartnerMark partner={partner} key={`${partner.slug}-${eyebrow}-${index}`} />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function Partners() {
  const clients = partnerItems.filter((partner) => partner.relationshipType === 'client');
  const collaborators = partnerItems.filter((partner) => partner.relationshipType === 'partner');

  return (
    <section className="content-section partners-section section-shell" id="partners">
      <Reveal className="section-heading section-heading--split partners-heading-shell">
        <div>
          <p className="eyebrow">Clients and partners</p>
          <h2>Digital work that plugs into serious teams.</h2>
        </div>
        <p>
          Separate full-width rows for client work and collaboration partners,
          ready for real marks whenever you upload them in the CMS.
        </p>
      </Reveal>

      <div className="partner-lanes">
        <PartnerLane
          eyebrow="Clients"
          title="Teams using clean digital systems."
          description="Placeholder client marks for day one, structured so real logos can replace them from the CMS."
          items={clients}
        />
        <PartnerLane
          eyebrow="Partners"
          title="Collaborators connected to the studio."
          description="A distinct partner row for platforms, specialists, and creative collaborators around the work."
          items={collaborators}
          reverse
        />
      </div>
    </section>
  );
}

function Process() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const lineY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);

  return (
    <section className="content-section process-section section-shell" id="process">
      <Reveal className="section-heading">
        <p className="eyebrow">Process</p>
        <h2>Structured enough to move fast. Flexible enough to think.</h2>
      </Reveal>

      <div className="process-layout">
        <motion.div
          className="process-rail"
          style={reduceMotion ? undefined : { y: lineY }}
          aria-hidden="true"
        >
          <span />
        </motion.div>
        <div className="process-list">
          {processSteps.map((step, index) => (
            <Reveal key={step.label} delay={index * 0.05}>
              <div className="process-step">
                <span>{step.label}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="content-section trust-section section-shell" id="trust">
      <Reveal className="trust-band">
        <div className="trust-copy">
          <p className="eyebrow">Technology and trust</p>
          <h2>Design taste backed by production discipline.</h2>
          <p>
            The same studio can shape the interface, wire the systems, tune the
            hosting, and keep the foundation strong.
          </p>
        </div>
        <div className="trust-grid">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div className="trust-item" key={item.label}>
                <Icon size={22} aria-hidden="true" />
                <h3>{item.label}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

function Contact() {
  const inquiryTypes = useMemo(
    () => [
      'Mobile app',
      'Website or platform',
      'Enterprise hosting',
      'SEO',
      'WordPress plugin',
      'Custom digital product',
    ],
    [],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const subject = encodeURIComponent(`Project inquiry from ${values.name || 'new lead'}`);
    const body = encodeURIComponent(
      [
        `Name: ${values.name || ''}`,
        `Email: ${values.email || ''}`,
        `Company: ${values.company || ''}`,
        `Project type: ${values.type || ''}`,
        `Budget range: ${values.budget || ''}`,
        '',
        'Project notes:',
        `${values.message || ''}`,
      ].join('\n'),
    );

    window.location.href = `mailto:hello@r2motion.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="content-section contact-section section-shell" id="contact">
      <Reveal className="contact-layout">
        <div className="contact-copy">
          <p className="eyebrow">Project inquiry</p>
          <h2>Bring the idea. I will help shape the system around it.</h2>
          <p>
            Share the essentials and I will reply with a clear path for design,
            build, hosting, optimization, or custom product work.
          </p>
          <div className="contact-points">
            <span>
              <CircleCheck size={18} aria-hidden="true" />
              Clear scope and launch path
            </span>
            <span>
              <LockKeyhole size={18} aria-hidden="true" />
              Hosting and security mindset
            </span>
            <span>
              <Sparkles size={18} aria-hidden="true" />
              Premium interface direction
            </span>
          </div>
        </div>

        <form className="inquiry-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input name="name" type="text" placeholder="Renzo M." required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" placeholder="you@company.com" required />
            </label>
          </div>
          <label>
            <span>Company</span>
            <input name="company" type="text" placeholder="Company or project name" />
          </label>
          <div className="form-grid">
            <label>
              <span>Project type</span>
              <select name="type" defaultValue="Website or platform">
                {inquiryTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Budget range</span>
              <select name="budget" defaultValue="$5k - $15k">
                <option>$2k - $5k</option>
                <option>$5k - $15k</option>
                <option>$15k - $40k</option>
                <option>$40k+</option>
              </select>
            </label>
          </div>
          <label>
            <span>Project notes</span>
            <textarea
              name="message"
              rows={5}
              placeholder="What are you building, improving, or launching?"
              required
            />
          </label>
          <button className="submit-button" type="submit">
            <Send size={18} aria-hidden="true" />
            Prepare inquiry
          </button>
        </form>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer section-shell">
      <div>
        <a href="#top" className="brand-mark" aria-label="(r2)motion home">
          <span>(r2)</span>motion
        </a>
        <p>by Renzo M.</p>
      </div>
      <div className="footer-links">
        <a href="mailto:hello@r2motion.com">
          <Mail size={16} aria-hidden="true" />
          hello@r2motion.com
        </a>
        <span>
          <Workflow size={16} aria-hidden="true" />
          Built for static hosting
        </span>
      </div>
    </footer>
  );
}

function ThemeSwitcher({
  theme,
  onThemeChange,
}: {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}) {
  return (
    <div className="theme-switcher" role="group" aria-label="Color theme">
      {themeOptions.map((option) => (
        <button
          type="button"
          className={theme === option.value ? 'is-active' : ''}
          key={option.value}
          aria-pressed={theme === option.value}
          onClick={() => onThemeChange(option.value)}
        >
          <span className={`theme-swatch theme-swatch--${option.value}`} aria-hidden="true" />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  usePointerScene();
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem('r2motion-theme', theme);
  }, [theme]);

  return (
    <div className="app" data-theme={theme}>
      <Header />
      <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <Partners />
        <Process />
        <Trust />
        <Contact />
      </main>
      <Footer />
      <div className="page-aura" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />
    </div>
  );
}
