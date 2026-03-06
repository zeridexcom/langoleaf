export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Test Page Works!</h1>
        <p className="text-gray-400">Server is running correctly on port 3005</p>
        <a 
          href="/login" 
          className="inline-block mt-6 px-6 py-3 bg-[#6d28d9] text-white rounded-xl hover:bg-[#6d28d9]/80 transition-colors"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
