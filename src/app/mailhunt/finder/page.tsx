import { MailSearch } from 'lucide-react';

export default function EmailFinder() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
        <MailSearch className="h-10 w-10 text-purple-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Finder</h1>
      <p className="text-gray-500 text-center max-w-lg mb-8">
        This module is currently under construction. Soon, you will be able to search and discover email addresses associated with specific names and companies.
      </p>
      <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm w-full text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Coming Soon</p>
      </div>
    </div>
  );
}
