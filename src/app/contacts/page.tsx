import { getContacts } from './actions';
import { MessageCircle, Phone, Calendar, RefreshCcw, AlertCircle, MapPin } from 'lucide-react';
import { DeleteButton } from './DeleteButton';
import { ImageModal } from './ImageModal';
import { DownloadButton } from './DownloadButton';
import { LocationField } from './LocationField';
import { NoteField } from './NoteField';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactList.map((contact) => {
            const isProcessing = contact.status === 'processing';
            const isError = contact.status === 'error';

            return (
              <div key={contact.id} className={`bg-white shadow-sm border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow relative group ${isProcessing ? 'opacity-90' : ''}`}>
                <div className="absolute top-2 right-2 z-10">
                  <DeleteButton id={contact.id} contactName={contact.name || ''} />
                </div>

                <div className="flex gap-4">
                  {/* Image Container */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
                    <div className={isProcessing ? 'blur-sm grayscale' : ''}>
                      <ImageModal 
                        src={contact.imagePath} 
                        alt={contact.name || 'Contact Image'} 
                      />
                    </div>
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                        <RefreshCcw className="h-6 w-6 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0 flex flex-col">
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {isProcessing ? (
                          <span className="flex items-center gap-1.5 text-indigo-600">
                            Processing...
                          </span>
                        ) : isError ? (
                          <span className="flex items-center gap-1.5 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Extraction Failed
                          </span>
                        ) : (
                          contact.name || 'Unknown Name'
                        )}
                      </h3>
                      <div className="flex items-center text-gray-500 mt-0.5">
                        <Phone className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {contact.phoneNumber || 'No phone number'}
                        </span>
                      </div>
                      <LocationField id={contact.id} initialLocation={contact.location} />
                      <NoteField id={contact.id} initialNote={contact.note} />
                      <div className="flex items-center text-gray-400 mt-0.5">
                        <Calendar className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] truncate">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-1">
                      {isProcessing ? (
                        <div className="h-16 bg-gray-50 rounded flex items-center justify-center border border-gray-100 border-dashed">
                          <span className="text-[10px] text-gray-400 font-medium">Extracting details...</span>
                        </div>
                      ) : (
                        <>
                          {contact.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded hover:bg-indigo-100 transition-colors gap-1.5 border border-indigo-100"
                            >
                              <MapPin className="h-3 w-3" />
                              Show Location
                            </a>
                          )}
                          <DownloadButton 
                            url={contact.imagePath} 
                            filename={`contact-${contact.name?.replace(/\s+/g, '-').toLowerCase() || contact.id}.jpg`} 
                          />
                          
                          {contact.phoneNumber ? (
                            <a
                              href={formatWhatsAppLink(contact.phoneNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-2 py-1 bg-[#25D366] text-white text-[10px] font-bold rounded hover:bg-[#128C7E] transition-colors gap-1.5"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded cursor-not-allowed gap-1.5"
                            >
                              <MessageCircle className="h-3 w-3" />
                              No WhatsApp
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
