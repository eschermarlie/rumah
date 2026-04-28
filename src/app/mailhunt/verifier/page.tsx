import { MailCheck } from 'lucide-react';

export default function EmailVerifier() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <MailCheck className="h-10 w-10 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verifier</h1>
      <p className="text-gray-500 text-center max-w-lg mb-8">
        This module is currently under construction. Soon, you will be able to verify the deliverability and active status of email addresses in bulk.
      </p>
      <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm w-full text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Coming Soon</p>
      </div>
    </div>
  );
}
