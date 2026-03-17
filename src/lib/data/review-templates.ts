// 1000+ Pre-made 5-star review templates for edufast.in
// Categories: overall, service, support, process, success, recommendation

export interface ReviewTemplate {
  id: number;
  text: string;
  category: string;
}

// Base templates for each category
const baseTemplates = {
  overall: [
    "Edufast.in made my study abroad journey incredibly smooth. Their team guided me through every step with professionalism and care. Highly recommended!",
    "I had an amazing experience with Edufast. They helped me get admission to my dream university. The entire process was seamless and stress-free.",
    "Best education consultancy I've ever worked with! Edufast.in team is knowledgeable, supportive, and always available to answer questions.",
    "From start to finish, Edufast made my abroad education dreams come true. Their expertise and dedication are unmatched.",
    "Edufast.in is the best decision I made for my career. They helped me secure admission in a top university with scholarship!",
    "Outstanding service from Edufast! They made the complex process of studying abroad feel easy and manageable.",
    "I'm so grateful to Edufast.in for their exceptional guidance. They helped me every step of the way with patience and expertise.",
    "Edufast exceeded all my expectations. Their team is professional, knowledgeable, and genuinely cares about students' success.",
    "Wonderful experience with Edufast.in! They made my dream of studying abroad a reality. Thank you so much!",
    "Edufast is the most reliable education consultancy. Their guidance helped me get into my preferred university smoothly.",
    "I cannot thank Edufast.in enough for their support. They made the entire admission process hassle-free and efficient.",
    "Edufast provided excellent service from day one. Their team is experienced and knows exactly what students need.",
    "My experience with Edufast.in was fantastic! They helped me navigate the complex world of international education effortlessly.",
    "Edufast is a game-changer for students wanting to study abroad. Their expertise and support are invaluable.",
    "I highly recommend Edufast.in to anyone planning to study abroad. Their service is top-notch and results-oriented.",
    "Edufast made my abroad education journey memorable and successful. Their team went above and beyond to help me.",
    "Professional, efficient, and caring - that's Edufast.in! They made my university application process smooth and successful.",
    "Edufast.in is the best platform for study abroad guidance. Their team is knowledgeable and always ready to help.",
    "I'm thrilled with the service I received from Edufast. They made my dream of international education come true!",
    "Edufast.in provided exceptional support throughout my study abroad journey. I couldn't have done it without them.",
  ],
  service: [
    "Edufast.in provides exceptional service quality. Their attention to detail and personalized approach sets them apart from others.",
    "The service quality at Edufast is outstanding. They handled my application with utmost care and professionalism.",
    "I was impressed by the service quality of Edufast.in. Every interaction was professional and helpful.",
    "Edufast delivers top-quality service. Their team is responsive, knowledgeable, and always ready to assist.",
    "The quality of service from Edufast.in exceeded my expectations. They truly care about each student's success.",
    "Edufast.in offers premium quality service. Their guidance was precise, timely, and extremely helpful.",
    "I'm amazed by the service quality at Edufast. They made my study abroad journey completely stress-free.",
    "Edufast.in provides world-class service. Their team's expertise and dedication are truly remarkable.",
    "The service quality from Edufast is unmatched. They went above and beyond to ensure my success.",
    "Edufast.in delivers exceptional service quality. Their personalized approach made all the difference for me.",
    "I was thoroughly impressed by Edufast's service quality. They handled everything with great professionalism.",
    "Edufast.in provides top-tier service. Their attention to detail and student-focused approach is commendable.",
    "The service at Edufast is of the highest quality. They made my admission process smooth and efficient.",
    "Edufast.in offers excellent service quality. Their team is experienced and provides accurate guidance.",
    "I experienced outstanding service quality at Edufast. They were with me every step of the way.",
    "Edufast.in provides superior service quality. Their expertise in study abroad guidance is evident.",
    "The quality of service from Edufast is exceptional. They made my dream of studying abroad a reality.",
    "Edufast.in delivers remarkable service quality. Their team is professional, responsive, and caring.",
    "I'm extremely satisfied with Edufast's service quality. They exceeded all my expectations.",
    "Edufast.in provides the best service quality in the industry. Their guidance is invaluable.",
  ],
  support: [
    "Edufast.in has an amazing support team. They were always available to answer my questions and guide me.",
    "The support team at Edufast is exceptional. They responded quickly and helped me with everything.",
    "I'm impressed by Edufast.in's support team. They are knowledgeable, patient, and extremely helpful.",
    "Edufast's support team is the best! They guided me through every step of my study abroad journey.",
    "The support from Edufast.in was outstanding. Their team was always there when I needed them.",
    "Edufast.in has a wonderful support team. They made my entire experience smooth and stress-free.",
    "The support team at Edufast is highly professional. They answered all my queries promptly.",
    "I had a great experience with Edufast.in's support team. They are responsive and caring.",
    "Edufast's support team went above and beyond. They helped me overcome every challenge.",
    "The support from Edufast.in is top-notch. Their team is always ready to help students.",
    "Edufast.in has the best support team I've ever worked with. They are patient and understanding.",
    "The support team at Edufast is incredibly helpful. They made my journey completely hassle-free.",
    "I can't say enough good things about Edufast.in's support team. They are simply amazing!",
    "Edufast's support team is exceptional. They provided guidance whenever I needed it.",
    "The support from Edufast.in exceeded my expectations. Their team is truly dedicated.",
    "Edufast.in has an outstanding support team. They are knowledgeable and always available.",
    "The support team at Edufast is wonderful. They made my study abroad dream a reality.",
    "I'm grateful for Edufast.in's support team. They were with me throughout my journey.",
    "Edufast's support team is highly experienced. They answered all my questions accurately.",
    "The support from Edufast.in is remarkable. Their team genuinely cares about students.",
  ],
  process: [
    "Edufast.in made the application process incredibly smooth. Their step-by-step guidance was perfect.",
    "The admission process with Edufast was seamless. They handled everything professionally.",
    "I was impressed by Edufast.in's streamlined process. Everything was well-organized and efficient.",
    "Edufast has the best application process. They made it easy to understand and follow.",
    "The process at Edufast.in is exceptional. They guided me through each step clearly.",
    "Edufast's process is well-structured. They made my study abroad journey hassle-free.",
    "The application process with Edufast.in was smooth and efficient. Highly recommended!",
    "I loved how Edufast simplified the entire process. They made everything easy to understand.",
    "Edufast.in has a fantastic process. They handled my application with great care.",
    "The process at Edufast is transparent and efficient. They kept me informed at every step.",
    "Edufast.in's process is the best. They made my admission journey completely stress-free.",
    "The application process with Edufast was excellent. Their team is highly organized.",
    "I was amazed by Edufast.in's efficient process. They made everything so simple.",
    "Edufast has a wonderful process. They guided me through every step professionally.",
    "The process at Edufast.in is top-notch. They made my study abroad dream a reality.",
    "Edufast's process is exceptional. They handled my application with utmost care.",
    "The application process with Edufast.in was smooth. Their team is experienced and helpful.",
    "I appreciated Edufast's organized process. They made everything clear and easy.",
    "Edufast.in has a great process. They made my admission journey successful.",
    "The process at Edufast is remarkable. They guided me through every step efficiently.",
  ],
  success: [
    "Thanks to Edufast.in, I got admission to my dream university with a scholarship! They made it possible.",
    "Edufast helped me achieve my study abroad dream. I'm now studying at a top university!",
    "I'm successful today because of Edufast.in. Their guidance changed my life completely.",
    "Edufast made my dream come true! I got accepted into my preferred university with their help.",
    "My success story began with Edufast.in. They helped me secure admission to a prestigious university.",
    "Thanks to Edufast, I'm now pursuing my dream course abroad. They made it all possible!",
    "Edufast.in is the reason for my success. They guided me to my dream university.",
    "I achieved my study abroad goals with Edufast's help. They are truly exceptional!",
    "Edufast.in made my success possible. I'm now studying at a world-class university.",
    "My journey to success started with Edufast. They helped me every step of the way.",
    "Thanks to Edufast.in, I'm living my dream! They made my abroad education a reality.",
    "Edufast helped me succeed in my study abroad journey. I'm grateful for their support.",
    "I'm successful because of Edufast.in. Their guidance was instrumental in my achievement.",
    "Edufast made my dreams come true! I got into my dream university with their help.",
    "My success is thanks to Edufast.in. They made my study abroad journey successful.",
    "Thanks to Edufast, I achieved my goals! They are the best education consultancy.",
    "Edufast.in is the key to my success. They helped me get into a top university.",
    "I'm living my dream because of Edufast. Their guidance made everything possible.",
    "Edufast.in changed my life! They helped me achieve my study abroad aspirations.",
    "My success story is written by Edufast. They made my dreams a reality.",
  ],
  recommendation: [
    "I highly recommend Edufast.in to everyone! They are the best study abroad consultants.",
    "If you're planning to study abroad, Edufast is the way to go! They are exceptional.",
    "Don't think twice - choose Edufast.in! They will make your dreams come true.",
    "Edufast is highly recommended! Their service and guidance are top-notch.",
    "I recommend Edufast.in to all students! They are professional and reliable.",
    "For study abroad guidance, Edufast is the best choice! Highly recommended.",
    "Edufast.in gets my highest recommendation! They are simply the best.",
    "I strongly recommend Edufast! They made my study abroad journey successful.",
    "Choose Edufast.in for your abroad education! You won't regret it.",
    "Edufast is the best! I recommend them to everyone planning to study abroad.",
    "I can't recommend Edufast.in enough! They are truly exceptional.",
    "For anyone wanting to study abroad, Edufast is the answer! Highly recommended.",
    "Edufast.in deserves all the recommendations! They are amazing.",
    "I wholeheartedly recommend Edufast! They are the best in the industry.",
    "Edufast.in is my top recommendation for study abroad! They are incredible.",
    "If you need study abroad help, go to Edufast! They are the best.",
    "I recommend Edufast.in without hesitation! They are professional and caring.",
    "Edufast is the best recommendation I can give! They are outstanding.",
    "For study abroad success, choose Edufast.in! Highly recommended.",
    "I give Edufast my highest recommendation! They are truly the best.",
  ],
};

// Variations to multiply templates
const variations = [
  "",
  " Absolutely fantastic experience!",
  " I'm so happy I chose them!",
  " Best decision ever!",
  " Thank you Edufast team!",
  " Five stars all the way!",
  " Couldn't be happier!",
  " Exceeded all expectations!",
  " Truly remarkable service!",
  " Highly impressed!",
  " Would recommend to everyone!",
  " A+ service quality!",
  " Outstanding experience!",
  " Very professional team!",
  " Grateful for their help!",
  " Made my dreams come true!",
  " Exceptional in every way!",
  " Top-notch service!",
  " Simply the best!",
  " Wonderful experience!",
];

// Generate 1000+ templates
export const reviewTemplates: ReviewTemplate[] = (() => {
  const templates: ReviewTemplate[] = [];
  let id = 1;

  Object.entries(baseTemplates).forEach(([category, texts]) => {
    texts.forEach((text) => {
      // Add base template
      templates.push({ id: id++, text, category });

      // Add variations to reach 1000+
      variations.forEach((variation) => {
        if (variation && id <= 1100) {
          templates.push({
            id: id++,
            text: text.replace(/[.!]$/, "") + variation,
            category,
          });
        }
      });
    });
  });

  return templates.slice(0, 1050); // Ensure we have 1000+
})();

// Get templates by category
export const getTemplatesByCategory = (category: string): ReviewTemplate[] => {
  return reviewTemplates.filter((t) => t.category === category);
};

// Get all categories
export const categories = [
  { id: "overall", name: "Overall Experience", count: 0 },
  { id: "service", name: "Service Quality", count: 0 },
  { id: "support", name: "Support Team", count: 0 },
  { id: "process", name: "Application Process", count: 0 },
  { id: "success", name: "Success Stories", count: 0 },
  { id: "recommendation", name: "Recommendations", count: 0 },
].map((cat) => ({
  ...cat,
  count: reviewTemplates.filter((t) => t.category === cat.id).length,
}));

// Search templates
export const searchTemplates = (query: string): ReviewTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return reviewTemplates.filter(
    (t) =>
      t.text.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
  );
};

export default reviewTemplates;
