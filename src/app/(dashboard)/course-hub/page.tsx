"use client";

import { useState } from "react";
import { CheckCircle2, Globe2, BookOpen, Clock, X, Info, GraduationCap, ArrowRight, Check, Phone } from "lucide-react";
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

import { DashboardPageLayout } from "@/components/ui/design-system";

export default function CourseHubPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [priceFormSubmitted, setPriceFormSubmitted] = useState(false);

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length > 5) { // Basic validation
      setPriceFormSubmitted(true);
      setTimeout(() => {
        setPriceFormSubmitted(false);
        setShowPriceForm(false);
        setPhoneNumber("");
      }, 5000);
    }
  };

  return (
    <DashboardPageLayout className="pb-24">
      <div className={`space-y-6 transition-all duration-500 ${selectedCourse ? 'xl:pr-[400px] lg:pr-[320px] opacity-50 blur-[2px]' : ''}`}>
        {/* Header */}
        <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Course Hub</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Explore courses & certifications</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">v2.1 optimized</span>
          </div>
        </div>

        {/* Section 1: Regular Degree (Indian) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Regular Degree (Indian)</h2>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {regularDegreeIndianCourses.map((course) => (
              <div key={course.slug} className="min-w-[320px] md:min-w-[380px] lg:min-w-[420px] snap-center bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out"></div>
                
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors">{course.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed relative z-10">
                  {course.shortDescription}
                </p>

                <div className="space-y-4 text-sm relative z-10">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Ideal For
                    </h4>
                    <ul className="space-y-2 text-gray-600">
                      {course.suitableFor.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                      {course.suitableFor.length > 2 && (
                        <li className="text-xs text-gray-400 italic pl-6">+ {course.suitableFor.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full bg-white hover:bg-primary hover:text-white text-gray-900 font-bold py-3 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Regular Degree (Abroad) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Regular Degree (Abroad)</h2>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {regularDegreeAbroadCourses.map((course) => (
              <div key={course.slug} className="min-w-[320px] md:min-w-[380px] lg:min-w-[420px] snap-center bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out"></div>
                
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors">{course.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed relative z-10">
                  {course.shortDescription}
                </p>

                <div className="space-y-4 text-sm relative z-10">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Ideal For
                    </h4>
                    <ul className="space-y-2 text-gray-600">
                      {course.suitableFor.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                      {course.suitableFor.length > 2 && (
                        <li className="text-xs text-gray-400 italic pl-6">+ {course.suitableFor.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full bg-white hover:bg-primary hover:text-white text-gray-900 font-bold py-3 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Language Education */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Language Education</h2>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {languageCourses.map((course) => (
              <div key={course.slug} className="min-w-[320px] md:min-w-[380px] lg:min-w-[420px] snap-center bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out"></div>
                
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors">{course.title}</h3>
                    {course.levels && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {course.levels.map(level => (
                          <span key={level} className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md uppercase">
                            {level}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed relative z-10">
                  {course.shortDescription}
                </p>

                <div className="space-y-4 text-sm relative z-10">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Suitable For
                    </h4>
                    <ul className="space-y-2 text-gray-600">
                      {course.suitableFor.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                      {course.suitableFor.length > 2 && (
                        <li className="text-xs text-gray-400 italic pl-6">+ {course.suitableFor.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Key Benefits
                    </h4>
                    <ul className="space-y-2 text-gray-600">
                      {course.benefits.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                      {course.benefits.length > 2 && (
                        <li className="text-xs text-gray-400 italic pl-6">+ {course.benefits.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full bg-white hover:bg-primary hover:text-white text-gray-900 font-bold py-3 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Fast-Track Education */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Fast-Track Education</h2>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {fastTrackCourses.map((course) => (
              <div key={course.slug} className="min-w-[320px] md:min-w-[380px] lg:min-w-[420px] snap-center bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out"></div>
                
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors">{course.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed relative z-10">
                  {course.shortDescription}
                </p>

                <div className="space-y-4 text-sm relative z-10">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Ideal For
                    </h4>
                    <ul className="space-y-2 text-gray-600">
                      {course.suitableFor.slice(0, 2).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                      {course.suitableFor.length > 2 && (
                        <li className="text-xs text-gray-400 italic pl-6">+ {course.suitableFor.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full bg-white hover:bg-primary hover:text-white text-gray-900 font-bold py-3 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Detail View Sidebar */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] xl:max-w-[400px] bg-white border-l border-gray-200 shadow-2xl z-[60] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Course Details</h2>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedCourse.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {selectedCourse.shortDescription}
                </p>
              </div>

              {/* Course Includes */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  What you'll learn
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedCourse.courseIncludes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-sm font-bold text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Suitable For */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Target Audience
                </h4>
                <ul className="space-y-3">
                  {selectedCourse.suitableFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Benefits */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Career Benefits
                </h4>
                <ul className="space-y-3">
                  {selectedCourse.benefits.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Section */}
            <div className="p-6 border-t border-gray-100 bg-white space-y-4">
              <button 
                onClick={() => window.location.href = `/students/add?university=${encodeURIComponent(selectedCourse.title)}`}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
              >
                Enroll a Student
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="text-center pt-2">
                <button 
                  onClick={() => setShowPriceForm(!showPriceForm)}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-600 tracking-widest uppercase transition-colors"
                >
                  Prices?
                </button>
              </div>

              <AnimatePresence>
                {showPriceForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {priceFormSubmitted ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mt-4">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-emerald-800">
                          Success! Our internal team will reach you in 5 minutes.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handlePriceSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 space-y-3">
                        <p className="text-xs text-gray-600 font-medium">
                          Submit your phone number so our internal team can reach you in 5 mins for pricing details.
                        </p>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-gray-900 hover:bg-black text-white text-sm font-bold py-2 rounded-lg transition-colors"
                        >
                          Request Pricing Callback
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Backdrop */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelectedCourse(null);
              setShowPriceForm(false);
              setPriceFormSubmitted(false);
            }}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-50 cursor-pointer"
          />
        )}
      </AnimatePresence>
    </DashboardPageLayout>
  );
}
