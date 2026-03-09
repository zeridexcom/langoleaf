"use client";

import { useState } from "react";
import { MessageCircle, Phone, Mail, FileQuestion, ChevronDown, Send, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I add a new student?",
    answer: "Go to the Students page and click 'Add Student'. Fill in the required details including name, contact information, and program of interest. The student will be added to your leads.",
  },
  {
    question: "When do I get paid commissions?",
    answer: "Commissions are paid within 7-10 business days after the student's enrollment is confirmed and the university releases the payment. You can track pending commissions in the Earnings section.",
  },
  {
    question: "How does the coin system work?",
    answer: "You earn coins for various activities: 10 coins for adding a student, 50 coins for submitting an application, 100 coins for successful enrollment, and bonus coins for achieving milestones.",
  },
  {
    question: "What documents are required for applications?",
    answer: "Typically required documents include: ID proof, academic transcripts, passport photos, and any program-specific requirements. The system will prompt you for specific documents based on the university.",
  },
  {
    question: "How can I improve my agent tier?",
    answer: "Your tier improves based on total enrollments and success rate. Bronze (0-25), Silver (25-100), Gold (100-250), and Platinum (250+). Higher tiers get better commission rates and priority support.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        <p className="text-gray-400 mt-1">Find answers or get in touch with our team</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-border">
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "faq"
              ? "text-[#ec5b13] border-[#ec5b13]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
        >
          <HelpCircle className="w-4 h-4 inline mr-2" />
          FAQs
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "contact"
              ? "text-[#ec5b13] border-[#ec5b13]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Contact Us
        </button>
      </div>

      {activeTab === "faq" ? (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#252542] transition-colors"
              >
                <span className="text-sm font-medium text-white">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Methods */}
          <div className="space-y-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-[#ec5b13]/10 rounded-xl">
                <Phone className="w-5 h-5 text-[#ec5b13]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Phone Support</p>
                <p className="text-sm text-gray-400">+91 1800-123-4567</p>
                <p className="text-xs text-gray-500">Mon-Fri, 9AM-6PM IST</p>
              </div>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-[#22d3ee]/10 rounded-xl">
                <Mail className="w-5 h-5 text-[#22d3ee]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email Support</p>
                <p className="text-sm text-gray-400">support@langoleaf.com</p>
                <p className="text-xs text-gray-500">24/7 response within 24h</p>
              </div>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Live Chat</p>
                <p className="text-sm text-gray-400">Available for Gold+ agents</p>
                <p className="text-xs text-gray-500">Instant response</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Send us a message</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                <select className="w-full px-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50">
                  <option>General Inquiry</option>
                  <option>Technical Issue</option>
                  <option>Payment Question</option>
                  <option>Feature Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Message</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or question..."
                  className="w-full px-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#ec5b13] text-white font-medium rounded-xl hover:bg-[#ec5b13]/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
