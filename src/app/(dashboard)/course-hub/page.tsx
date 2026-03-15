"use client";

import { useState, Fragment, useRef } from "react";
import { 
  CheckCircle2, 
  Globe2, 
  BookOpen, 
  Clock, 
  X, 
  Info, 
  GraduationCap, 
  ArrowRight, 
  Check, 
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

interface Course {
  title: string;
  slug: string;
  shortDescription: string;
  suitableFor: string[];
  courseIncludes: string[];
  benefits: string[];
  levels?: string[];
  shortName?: string;
}

const languageCourses: Course[] = [
  {
    title: "IELTS Preparation",
    slug: "ielts-preparation",
    shortDescription: "Widely accepted English proficiency test for study abroad, work visas, and immigration.",
    suitableFor: [
      "Students planning to study abroad",
      "Professionals applying for overseas opportunities",
      "Individuals preparing for immigration"
    ],
    courseIncludes: [
      "Listening",
      "Reading",
      "Writing",
      "Speaking",
      "Grammar and vocabulary practice",
      "Mock tests"
    ],
    benefits: [
      "Accepted by universities and institutions in countries like the UK, Canada, Australia, New Zealand, and Ireland",
      "Helps improve academic and practical English skills",
      "Useful for study, work, and migration pathways"
    ]
  },
  {
    title: "TOEFL Preparation",
    slug: "toefl-preparation",
    shortDescription: "Globally recognized English proficiency exam mainly used for university admissions and academic purposes.",
    suitableFor: [
      "Students applying to international universities",
      "Learners who need academic English preparation",
      "Candidates aiming for English-speaking study environments"
    ],
    courseIncludes: [
      "Academic reading",
      "Listening practice",
      "Speaking practice",
      "Writing practice",
      "Vocabulary development",
      "Practice tests"
    ],
    benefits: [
      "Accepted by many universities in the USA, Canada, and other countries",
      "Focuses on academic English communication",
      "Helps students prepare for university-level language requirements"
    ]
  },
  {
    title: "German Language Course",
    slug: "german-language-course",
    shortDescription: "An important language for students and professionals planning opportunities in Germany and other German-speaking regions.",
    levels: ["A1", "A2", "B1", "B2"],
    suitableFor: [
      "Students planning higher education in Germany",
      "Professionals seeking work opportunities",
      "Individuals preparing for relocation"
    ],
    courseIncludes: [
      "Grammar",
      "Vocabulary",
      "Speaking practice",
      "Reading and writing",
      "Listening comprehension",
      "Level-based progression"
    ],
    benefits: [
      "Useful for study and work opportunities in Germany",
      "Supports communication in German-speaking environments",
      "Helps with academic and professional growth"
    ]
  },
  {
    title: "French Language Course",
    slug: "french-language-course",
    shortDescription: "A globally important language spoken across Europe, North America, and Africa for study, work, and international communication.",
    levels: ["A1", "A2", "B1", "B2"],
    suitableFor: [
      "Students planning to study in French-speaking regions",
      "Professionals seeking international career growth",
      "Individuals interested in multilingual skills"
    ],
    courseIncludes: [
      "Core Grammar",
      "Thematic Vocabulary",
      "Pronunciation focus",
      "Speaking practice",
      "Reading and writing",
      "Cultural workshops"
    ],
    benefits: [
      "Access to France, Canada, & Switzerland",
      "Multiplies career options globally",
      "World's 5th most spoken language",
      "Academic scholarships availability"
    ]
  }
];

const regularDegreeIndianCourses: Course[] = [
  {
    title: "Rosy Royal Institutions",
    slug: "rosy-royal-institutions",
    shortDescription: "A group of institutions in Bangalore offering programs in Homeopathy, Physiotherapy, Nursing, Pharmacy, and Management.",
    suitableFor: [
      "Nursing & Healthcare aspirants",
      "Pharmacy students",
      "Aviation & Management professionals"
    ],
    courseIncludes: [
      "BHMS & BPT",
      "M.Sc/B.Sc Nursing & GNM",
      "B.Pharm & D.Pharm",
      "BBA Aviation & Global",
      "BCA in Cloud, AI & Security",
      "Forensic Science with IAS Coaching"
    ],
    benefits: [
      "Approved by Government of Karnataka",
      "Multiple health science institutions",
      "Professional IAS/IPS coaching integrated",
      "Bangalore based specialized campus"
    ]
  },
  {
    title: "Yenepoya University",
    slug: "yenepoya-university",
    shortDescription: "Deemed to be University offering BBA in International Business & Business Analytics with Meta certifications.",
    suitableFor: [
      "Data Analyst aspirants",
      "Digital Marketing enthusiasts",
      "International Business managers"
    ],
    courseIncludes: [
      "BBA International Business",
      "Business Analytics & Data Science",
      "Meta Digital Marketing Certification",
      "SEO & SEM Specialization",
      "Export & Import Management"
    ],
    benefits: [
      "Meta professional certification",
      "Industry-standard analytics tools",
      "Strong global business focus",
      "Career outcomes in Data Science"
    ]
  },
  {
    title: "Chinmaya Vishwa Vidyapeeth",
    slug: "cvv-university",
    shortName: "CVV",
    shortDescription: "A premier Deemed University offering B.Tech, BCA(Hons), and specialized BBA/B.Com programs.",
    suitableFor: [
      "Engineering & Tech students",
      "Psychology scholars",
      "Accounting & Finance aspirants"
    ],
    courseIncludes: [
      "B.Tech in CSE, AI/ML & Cyber",
      "BCA(Hons) in Robotics & DevOps",
      "B.Com(Hons) with ACCA-UK",
      "BBA(Hons) in Supply Chain",
      "Applied & Clinical Psychology",
      "Sanskrit & Education Degrees"
    ],
    benefits: [
      "ACCA-UK International collaboration",
      "Robotics & AI specialization labs",
      "Vedic wisdom & modern tech integration",
      "Full-time & Part-time PhD options"
    ]
  },
  {
    title: "Vidya College of Nursing",
    slug: "vidya-nursing",
    shortDescription: "A specialized nursing college recognized by INC & KNC and affiliated with RGUHS Bengaluru.",
    suitableFor: [
      "Nursing professionals",
      "Clinical practice students",
      "Healthcare service aspirants"
    ],
    courseIncludes: [
      "B.Sc Nursing",
      "GNM (General Nursing & Midwifery)"
    ],
    benefits: [
      "Affiliated to RGUHS Bengaluru",
      "Recognized by INC & KNC",
      "Government of Karnataka approved",
      "Specialized clinical training"
    ]
  },
  {
    title: "ELIMS College",
    slug: "elims-college",
    shortDescription: "College of Arts and Science offering professional BBA, B.Com, and BCA with global certifications.",
    suitableFor: [
      "Logistics & Aviation students",
      "Accounting & CMA aspirants",
      "Cyber Security enthusiasts"
    ],
    courseIncludes: [
      "BBA Logistics & CILT Certification",
      "B.Com with ACCA (9 paper exemption)",
      "B.Com with CMA (USA)",
      "BCA in AI & Data Science",
      "B.Sc CS in Cloud & Ethical Hacking"
    ],
    benefits: [
      "9 paper exemption for ACCA",
      "CILT International Certification",
      "CMA USA exam preparation",
      "Advanced AI & Cloud labs"
    ]
  },
  {
    title: "MET's Group of Institutions",
    slug: "mets-group",
    shortDescription: "Educational group offering Engineering, Pharmacy, and professional Management degrees.",
    suitableFor: [
      "Tech & Biotech students",
      "Pharmacy scholars",
      "Logistics & Aviation aspirants"
    ],
    courseIncludes: [
      "B.Tech in CS & Biotech",
      "B.Pharm Program",
      "BBA in Aviation & Logistics",
      "B.Com in ACCA & AI",
      "BCA in Cloud & Ethical Hacking"
    ],
    benefits: [
      "Multi-disciplinary learning environment",
      "ACCA paper exemptions available",
      "Specialized Biotech research",
      "Cyber Security focus in IT"
    ]
  },
  {
    title: "MES Group of Institutions",
    slug: "mes-institutions",
    shortDescription: "Established group in Aluva offering Engineering and professional BA/B.Sc/B.Com degrees with add-ons.",
    suitableFor: [
      "Robotics & AI Engineering students",
      "Psychology & Media scholars",
      "Hospital Administration aspirants"
    ],
    courseIncludes: [
      "B.Tech in Robotics & AI",
      "BA/B.Com with Hospital Admin",
      "BCA in Machine Learning",
      "B.Sc Psychology labs",
      "M.Com in Finance & Tax"
    ],
    benefits: [
      "Specialized Robotics labs",
      "Professional Hospital Admin add-on",
      "GST & SAP Finance training",
      "Central Ernakulam location"
    ]
  },
  {
    title: "Udupi Group of Institutions",
    slug: "udupi-group",
    shortDescription: "Manipal-based institution offering Health Sciences, Management, and Creative Design programs.",
    suitableFor: [
      "Allied Health Science students",
      "Fashion & Interior Designers",
      "Hospitality & Hotel managers"
    ],
    courseIncludes: [
      "B.Sc Nursing & BPT",
      "Cardiac & Respiratory Tech",
      "Hotel Management (BHS)",
      "Aviation & Hospitality Management",
      "BCA in Big Data & Analytics",
      "Fashion & Interior Design"
    ],
    benefits: [
      "Manipal education hub campus",
      "Diverse health science portfolio",
      "Specialized creative design school",
      "Job-ready aviation & logistics"
    ]
  }
];

const regularDegreeAbroadCourses: Course[] = [
  {
    title: "University of Toronto",
    slug: "uoft-canada",
    shortDescription: "A globally top-ranked public research university in Toronto, Ontario, Canada.",
    suitableFor: [
      "Engineering & Tech students",
      "Business & Economics scholars",
      "Life Sciences aspirants"
    ],
    courseIncludes: [
      "B.A.Sc in Engineering",
      "Rotman Commerce",
      "B.Sc in Computer Science",
      "M.Eng & MBA programs"
    ],
    benefits: [
      "Top 25 Global University",
      "Post-Graduation Work Permit (PGWP) eligible",
      "Co-op and internship opportunities",
      "Vibrant multicultural campus"
    ]
  },
  {
    title: "University of Melbourne",
    slug: "unimelb-australia",
    shortDescription: "Australia's leading university, known for its distinct Melbourne Model curriculum.",
    suitableFor: [
      "Medical & Health Science students",
      "Arts & Humanities scholars",
      "Architecture aspirants"
    ],
    courseIncludes: [
      "Bachelor of Biomedicine",
      "Bachelor of Commerce",
      "Bachelor of Design",
      "Master of Engineering"
    ],
    benefits: [
      "Ranked #1 in Australia",
      "High graduate employability",
      "Extensive global alumni network",
      "Located in a top student city"
    ]
  },
  {
    title: "University of Manchester",
    slug: "manchester-uk",
    shortDescription: "A historic, prestigious red brick university in the UK with excellence in research and innovation.",
    suitableFor: [
      "Science & Engineering students",
      "Business Management aspirants",
      "Social Sciences scholars"
    ],
    courseIncludes: [
      "BSc Computer Science",
      "BEng Aerospace Engineering",
      "BSc Business Accounting",
      "MSc Finance"
    ],
    benefits: [
      "Russell Group member",
      "Access to 2-year post-study work visa",
      "Strong industry partnerships",
      "World-class research facilities"
    ]
  }
];

const fastTrackCourses: Course[] = [
  {
    title: "Arni University",
    slug: "arni-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "OPJS University",
    slug: "opjs-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "YBN University",
    slug: "ybn-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "Mewar University",
    slug: "mewar-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "NEFTU University",
    slug: "neftu-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "Glocal University",
    slug: "glocal-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "Himalayan University",
    slug: "himalayan-university",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  },
  {
    title: "Sangai International University",
    slug: "sangai-international",
    shortDescription: "Fast-Track Distance & Online Education for working professionals.",
    suitableFor: ["Working Professionals", "Diploma Holders", "Career Changers"],
    courseIncludes: ["BA, B.Com, BSc, BCA, BBA (Undergrad)", "MA, M.Com, MSc, MCA, MBA (Postgrad)", "SSLC, 12th, Diploma (School level)", "B.Tech, B.Pharmacy, BA(LLB)"],
    benefits: ["EMI / Easy Payment Options Available", "Valid for WES, Embassy & HRD Attestation", "6 Month Graduation Mode Available", "100% Online Postgraduate Options"]
  }
];

const CourseCard = ({ 
  course, 
  isExpanded, 
  onToggle, 
  index,
  type = "default" 
}: { 
  course: Course; 
  isExpanded: boolean; 
  onToggle: (slug: string) => void;
  index: number;
  type?: "default" | "abroad" | "language" | "fast-track";
}) => {
  const iconMap = {
    default: <GraduationCap className="w-8 h-8" />,
    abroad: <Globe2 className="w-8 h-8" />,
    language: <Globe2 className="w-8 h-8" />,
    "fast-track": <Clock className="w-8 h-8" />
  };

  const themeColors = {
    default: "bg-primary/10 text-primary border-primary/20 hover:border-primary/40",
    abroad: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-400",
    language: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-400",
    "fast-track": "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-400"
  };

  const activeBadge = {
    default: "Active Enrollment",
    abroad: "Global Program",
    language: "Language Certification",
    "fast-track": "Direct Certification"
  };

  const activeBadgeColor = {
    default: "bg-emerald-50 text-emerald-700 border-emerald-100",
    abroad: "bg-blue-50 text-blue-700 border-blue-100",
    language: "bg-purple-50 text-purple-700 border-purple-100",
    "fast-track": "bg-amber-50 text-amber-700 border-amber-100"
  };

  const pulseDot = {
    default: "bg-emerald-500",
    abroad: "bg-blue-500",
    language: "bg-purple-500",
    "fast-track": "bg-amber-500 animate-pulse"
  };

  return (
    <div className={`flex-shrink-0 w-[380px] snap-start bg-white border-2 rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 relative overflow-hidden group/card ${
      isExpanded ? 'border-primary ring-8 ring-primary/5 shadow-2xl translate-y-[-4px]' : 'border-gray-50 hover:border-primary/20 hover:shadow-premium hover:translate-y-[-4px]'
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover/card:scale-[2.5] transition-transform duration-1000" />
      
      <div className="flex items-start gap-6 mb-8 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-500 group-hover/card:scale-110 ${
          isExpanded ? 'bg-primary text-white' : themeColors[type]
        }`}>
          {iconMap[type]}
        </div>
        <div>
          <h3 className="font-black text-2xl text-gray-900 leading-[1.1] group-hover/card:text-primary transition-colors tracking-tight">{course.title}</h3>
          <div className={`mt-2 inline-flex items-center gap-1.5 py-1 px-3 rounded-full border ${activeBadgeColor[type]}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${pulseDot[type]}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{activeBadge[type]}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-8 font-bold leading-relaxed relative z-10 h-20 line-clamp-3 overflow-hidden">
        {course.shortDescription}
      </p>

      {type === "language" && course.levels && (
        <div className="flex gap-2 mb-8 flex-wrap relative z-10">
          {course.levels.map(level => (
            <span key={level} className="text-[9px] font-black px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-md uppercase tracking-tighter">
              {level}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto relative z-10">
        <button 
          onClick={() => onToggle(course.slug)}
          className={`w-full font-black py-5 rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 ${
            isExpanded 
              ? 'bg-primary text-white shadow-xl shadow-primary/20' 
              : 'bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${isExpanded ? 'rotate-180' : ''} transition-transform duration-500`} />
          {isExpanded ? 'Close Details' : 'View Course Hub'}
        </button>
      </div>
    </div>
  );
};

const CourseCarousel = ({ 
  title, 
  courses, 
  type, 
  expandedCourseSlug, 
  onToggle,
  renderDetails 
}: { 
  title: string; 
  courses: Course[]; 
  type: "default" | "abroad" | "language" | "fast-track";
  expandedCourseSlug: string | null;
  onToggle: (slug: string) => void;
  renderDetails: (course: Course) => React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 400 : scrollLeft + 400;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const expandedInThisSection = courses.find(c => c.slug === expandedCourseSlug);

  return (
    <section className="space-y-8 relative group/section">
      <div className="flex items-center justify-between gap-6 mr-12 sm:mr-0">
        <div className="flex items-center gap-6 flex-1">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap">{title}</h2>
          <div className="h-[1px] bg-gray-100 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-8 px-1">
          {courses.map((course, index) => (
            <CourseCard 
              key={course.slug} 
              course={course} 
              isExpanded={expandedCourseSlug === course.slug}
              onToggle={onToggle}
              index={index}
              type={type}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expandedInThisSection && renderDetails(expandedInThisSection)}
      </AnimatePresence>
    </section>
  );
};

import { DashboardPageLayout } from "@/components/ui/design-system";

export default function CourseHubPage() {
  const [expandedCourseSlug, setExpandedCourseSlug] = useState<string | null>(null);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [priceFormSubmitted, setPriceFormSubmitted] = useState(false);

  const toggleExpand = (slug: string) => {
    if (expandedCourseSlug === slug) {
      setExpandedCourseSlug(null);
    } else {
      setExpandedCourseSlug(slug);
    }
    setShowPriceForm(false);
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length > 5) {
      setPriceFormSubmitted(true);
      setTimeout(() => {
        setPriceFormSubmitted(false);
        setShowPriceForm(false);
        setPhoneNumber("");
      }, 5000);
    }
  };

  const renderExpandableDetails = (course: Course) => (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden bg-gray-50 border border-gray-200 rounded-3xl mb-8 -mt-4 shadow-inner"
    >
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Comprehensive Curriculum
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.courseIncludes.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-700">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Strategic Benefits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-600 font-bold leading-tight">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full transition-transform group-hover:scale-150" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-start">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-premium relative overflow-hidden group/actions">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover/actions:scale-[2] duration-1000" />
            
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 relative z-10">Instant Enrollment</h4>
            <div className="space-y-4 relative z-10">
              <button 
                onClick={() => window.location.href = `/students/add?program=${encodeURIComponent(course.title)}`}
                className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
              >
                Enroll Now
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              
              <div className="pt-2">
                {!showPriceForm ? (
                  <button 
                    onClick={() => setShowPriceForm(true)}
                    className="w-full bg-gray-50 text-gray-500 font-black py-4 rounded-xl transition-all hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest border border-dashed border-gray-200 hover:border-primary/20"
                  >
                    Request Fee Details
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gray-50 rounded-2xl border border-primary/20"
                  >
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Pricing Callback Request</p>
                    {priceFormSubmitted ? (
                      <div className="flex items-center gap-3 text-emerald-600 font-black text-xs py-4 bg-emerald-50 rounded-xl px-5 border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5" />
                        We'll reach out in 5 minutes!
                      </div>
                    ) : (
                      <form onSubmit={handlePriceSubmit} className="space-y-4">
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="tel"
                            placeholder="Your Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            required
                          />
                        </div>
                        <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg active:scale-95">
                          Submit Details
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] text-center mt-8 opacity-60">
            Certified by global accreditation boards
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardPageLayout className="pb-24">
      <div className="space-y-24">
        {/* Header */}
        <div className="bg-white p-8 md:p-12 border border-gray-100 rounded-[2.5rem] shadow-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-1000" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Course Hub</h1>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-3 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-primary"></span>
              Strategic Career Pathways
            </p>
          </div>
          <div className="relative z-10">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">System v2.5 Online</span>
            </div>
          </div>
        </div>

        <CourseCarousel 
          title="Regular Degree (Indian)"
          courses={regularDegreeIndianCourses}
          type="default"
          expandedCourseSlug={expandedCourseSlug}
          onToggle={toggleExpand}
          renderDetails={renderExpandableDetails}
        />

        <CourseCarousel 
          title="Regular Degree (Abroad)"
          courses={regularDegreeAbroadCourses}
          type="abroad"
          expandedCourseSlug={expandedCourseSlug}
          onToggle={toggleExpand}
          renderDetails={renderExpandableDetails}
        />

        <CourseCarousel 
          title="Language Education"
          courses={languageCourses}
          type="language"
          expandedCourseSlug={expandedCourseSlug}
          onToggle={toggleExpand}
          renderDetails={renderExpandableDetails}
        />

        <CourseCarousel 
          title="Fast-Track Education"
          courses={fastTrackCourses}
          type="fast-track"
          expandedCourseSlug={expandedCourseSlug}
          onToggle={toggleExpand}
          renderDetails={renderExpandableDetails}
        />
      </div>
    </DashboardPageLayout>
  );
}
