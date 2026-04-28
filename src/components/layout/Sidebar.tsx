'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Contact, 
  MailSearch, 
  MailCheck, 
  ChevronDown, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Contact Extractor', href: '/extractor', icon: Contact },
  { name: 'Contacts', href: '/contacts', icon: Contact },
];

const mailHuntNavigation = [
  { name: 'Email Finder', href: '/mailhunt/finder', icon: MailSearch },
  { name: 'Email Verifier', href: '/mailhunt/verifier', icon: MailCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMailHuntOpen, setIsMailHuntOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isMailHuntActive = pathname.startsWith('/mailhunt');

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="ml-4 text-xl font-bold text-gray-900">Project Workspace</span>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-gray-50/50">
            <span className="text-xl font-bold text-gray-900 tracking-tight">Workspace</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${active 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors
                      ${active ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* MailHunt Nested Menu */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setIsMailHuntOpen(!isMailHuntOpen)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${isMailHuntActive ? 'text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center">
                  <div className={`mr-3 h-5 w-5 flex items-center justify-center rounded bg-gradient-to-br from-purple-500 to-indigo-500 text-white`}>
                    <MailSearch className="h-3 w-3" />
                  </div>
                  MailHunt
                </div>
                {isMailHuntOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isMailHuntOpen && (
                <div className="mt-1 space-y-1 pl-11">
                  {mailHuntNavigation.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${active 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                        `}
                      >
                        <item.icon
                          className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors
                            ${active ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-500'}
                          `}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-700">US</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">User Settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
