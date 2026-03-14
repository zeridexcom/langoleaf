import { CheckCircle2, Globe2, BookOpen, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const languageCourses = [
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
      "Grammar",
      "Vocabulary",
      "Pronunciation",
      "Speaking practice",
      "Reading and writing",
      "Listening skills"
    ],
    benefits: [
      "Useful in countries such as France, Canada, Switzerland, Belgium, and Luxembourg",
      "Supports higher studies and job opportunities",
      "Helps build communication skills for global environments"
    ]
  }
];

export default function CourseHubPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Course Hub</h1>
          <p className="text-gray-500 text-sm mt-1">Explore courses and certification programs</p>
        </div>
      </div>

      {/* Section 1: Foreign Education */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Foreign Education</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[280px] md:min-w-[320px] lg:min-w-[350px] snap-start bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
            <span className="text-sm font-medium text-gray-500">Foreign Education courses will appear here</span>
          </div>
        </div>
      </section>

      {/* Section 2: Language Education */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Language Education</h2>
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
                <button className="w-full bg-white hover:bg-primary hover:text-white text-gray-900 font-bold py-3 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Fast-Track Education */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Fast-Track Education</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[280px] md:min-w-[320px] lg:min-w-[350px] snap-start bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
            <span className="text-sm font-medium text-gray-500">Fast-Track Education courses will appear here</span>
          </div>
        </div>
      </section>

    </div>
  );
}
