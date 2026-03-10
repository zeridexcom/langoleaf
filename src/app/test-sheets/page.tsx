"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestSheetsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-sheets");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: "Failed to fetch" });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Google Sheets Connection Test</h1>
      
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Test Connection</h2>
        <p className="text-gray-600 mb-4">
          Click the button below to test if your Google Sheets connection is working
        </p>
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Testing..." : "Test Google Sheets Connection"}
        </Button>
      </div>

      {result && (
        <div className={`border-2 rounded-lg p-6 mb-6 ${result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
          <h2 className={`text-xl font-semibold mb-4 ${result.success ? "text-green-600" : "text-red-600"}`}>
            {result.success ? "✅ Connection Successful!" : "❌ Connection Failed"}
          </h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">What to check if it fails:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>GOOGLE_SHEETS_ID is correct (from URL)</li>
          <li>GOOGLE_CLIENT_EMAIL matches the service account</li>
          <li>GOOGLE_PRIVATE_KEY has \n characters (not actual newlines)</li>
          <li>Sheet is shared with the service account email</li>
          <li>Google Sheets API is enabled in Cloud Console</li>
        </ul>
      </div>
    </div>
  );
}
