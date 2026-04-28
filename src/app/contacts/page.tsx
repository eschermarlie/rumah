import { getContacts } from './actions';
import { ExternalLink, MessageCircle, Phone, Calendar } from 'lucide-react';
import Image from 'next/image';
import { DeleteButton } from './DeleteButton';

export const dynamic = 'force-dynamic';

const formatWhatsAppLink = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  let formatted = cleanNumber;
  if (cleanNumber.startsWith('0')) {
    formatted = '62' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('62')) {
    formatted = '62' + cleanNumber;
  }
  return `https://wa.me/${formatted}`;
};

export default async function ContactsPage() {
  const result = await getContacts();

  if (!result.success) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {result.error}
        </div>
      </div>
    );
  }

  const contactList = result.data || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Extracted Contacts</h1>
        <p className="text-gray-600 mt-1">List of all contacts extracted from images.</p>
      </div>

      {contactList.length === 0 ? (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No contacts found. Use the AI Contact Extractor to add some.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contactList.map((contact) => (
            <div key={contact.id} className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Thumbnail Container */}
              <div className="relative aspect-[4/3] bg-gray-100 group">
                <Image
                  src={contact.imagePath}
                  alt={contact.name || 'Contact Image'}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                <a 
                  href={contact.imagePath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View full image"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <div className="absolute top-2 left-2">
                  <DeleteButton id={contact.id} contactName={contact.name || ''} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-grow flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {contact.name || 'Unknown Name'}
                  </h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">
                      {contact.phoneNumber || 'No phone number'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-xs">
                      {new Date(contact.createdAt).toLocaleDateString()} {new Date(contact.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  {contact.phoneNumber ? (
                    <a
                      href={formatWhatsAppLink(contact.phoneNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#25D366] hover:bg-[#128C7E] transition-colors gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      No WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
