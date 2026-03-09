export const dynamic = "force-dynamic";

export default function LanguageHubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Language Hub</h1>
          <p className="text-gray-500 text-sm mt-1">Explore language courses and certification programs</p>
        </div>
      </div>

      {/* Language Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* IELTS */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xs font-bold py-1 px-2 bg-blue-100 text-blue-700 rounded-full">Popular</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900">IELTS Preparation</h3>
          <p className="text-sm text-gray-500 mt-2">Essential for UK, Canada, Australia, USA visas. Required for study and permanent residency applications.</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
            <span className="text-sm font-bold text-gray-700">30-45 days</span>
          </div>
        </div>

        {/* German */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold py-1 px-2 bg-emerald-100 text-emerald-700 rounded-full">High Demand</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900">German (A1-B2)</h3>
          <p className="text-sm text-gray-500 mt-2">Huge demand for workers and students. Fastest path to German residency and employment opportunities.</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
            <span className="text-sm font-bold text-gray-700">3-6 months</span>
          </div>
        </div>

        {/* French */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7" />
              </svg>
            </div>
            <span className="text-xs font-bold py-1 px-2 bg-purple-100 text-purple-700 rounded-full">29 Countries</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900">French (A1-B2)</h3>
          <p className="text-sm text-gray-500 mt-2">Quebec, France, Switzerland and more. Multiplies career options across Francophone regions.</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
            <span className="text-sm font-bold text-gray-700">3-6 months</span>
          </div>
        </div>

        {/* TOEFL */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-xs font-bold py-1 px-2 bg-rose-100 text-rose-700 rounded-full">US Academia</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900">TOEFL Preparation</h3>
          <p className="text-sm text-gray-500 mt-2">Preferred by Ivy Leagues and top USA universities. Essential for American academic admissions.</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Duration</span>
            <span className="text-sm font-bold text-gray-700">30-45 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
