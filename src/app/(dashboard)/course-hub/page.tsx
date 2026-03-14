"use client";

import { useState } from "react";
import { CheckCircle2, Globe2, BookOpen, Clock, X, Info, GraduationCap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function CourseHubPage() {
  const [selectedCourse, setSelectedCourse] = useState<typeof languageCourses[0] | null>(null);

  return (
    <div className="relative min-h-[calc(100-vh-4rem)]">
      <div className={`space-y-8 transition-all duration-500 ${selectedCourse ? 'pr-[400px] opacity-50 blur-[2px]' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Course Hub</h1>
            <p className="text-gray-500 text-sm mt-1">Explore courses and certification programs</p>
          </div>
        </div>

        {/* Section 1: Online Degree */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Online Degree</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[280px] md:min-w-[320px] lg:min-w-[350px] snap-start bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
              <span className="text-sm font-medium text-gray-500">Online Degree courses will appear here</span>
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

      {/* Detail View Sidebar */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white border-l border-gray-200 shadow-2xl z-[60] flex flex-col"
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
              <button className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                Enroll a Student
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="text-center">
                <button className="text-[10px] font-bold text-gray-300 hover:text-gray-400 tracking-widest uppercase transition-colors">
                  Prices?
                </button>
              </div>
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
            onClick={() => setSelectedCourse(null)}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-50 cursor-pointer"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
