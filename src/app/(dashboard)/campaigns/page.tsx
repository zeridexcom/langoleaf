export const dynamic = "force-dynamic";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your marketing campaigns and track performance</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
          Create Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Active Campaigns</p>
          <p className="text-3xl font-black text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Total Reach</p>
          <p className="text-3xl font-black text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Conversions</p>
          <p className="text-3xl font-black text-gray-900 mt-2">0</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white border border-gray-200 p-12 rounded-xl shadow-sm text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">No campaigns yet</h3>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          Create your first campaign to start promoting your services and attract more students.
        </p>
        <button className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
          Create Your First Campaign
        </button>
      </div>
    </div>
  );
}
