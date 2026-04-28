import Link from 'next/link';
import { Contact, MailSearch, MailCheck } from 'lucide-react';

export default function Dashboard() {
  const modules = [
    {
      name: 'AI Contact Extractor',
      description: 'Upload an image like a business card to extract a name and phone number using AI.',
      href: '/extractor',
      icon: Contact,
      color: 'bg-blue-500',
    },
    {
      name: 'Email Finder',
      description: 'Find email addresses associated with names and companies.',
      href: '/mailhunt/finder',
      icon: MailSearch,
      color: 'bg-purple-500',
    },
    {
      name: 'Email Verifier',
      description: 'Verify the deliverability and status of email addresses.',
      href: '/mailhunt/verifier',
      icon: MailCheck,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Welcome to your modular workspace. Select a tool to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link key={module.name} href={module.href} className="group flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden">
            <div className="p-6 flex-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{module.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {module.description}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
              Open Tool
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
