'use client';

import { useState } from 'react';
import { uploadAndExtractAction, listModels } from './actions';

const formatWhatsAppLink = (phoneNumber: string) => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Indonesian formatting logic:
  // 1. If starts with 0, replace with 62 (e.g. 0812 -> 62812)
  // 2. If starts with 62, keep it (e.g. 62812 -> 62812)
  // 3. Otherwise, prepend 62 (assuming local number without leading 0)
  let formatted = cleanNumber;
  if (cleanNumber.startsWith('0')) {
    formatted = '62' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('62')) {
    formatted = '62' + cleanNumber;
  }
  
  return `https://wa.me/${formatted}`;
};

export default function Extractor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
      setResult(null);
      setError(null);
    }
  };

  const handleList =async()=>{
    await listModels()
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    const res = await uploadAndExtractAction(formData);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error || 'An unknown error occurred');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Contact Extractor</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload an image (like a business card) to extract a name and phone number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center w-full">
            <label 
              htmlFor="dropzone-file" 
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${preview ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-300'}`}
            >
              {preview ? (
                <div className="relative w-full h-full p-2 flex items-center justify-center">
                  <img src={preview} alt="Preview" className="max-h-full max-w-full rounded-md object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                </div>
              )}
              <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Image...
              </span>
            ) : (
              'Extract Details'
            )}
          </button>
        </form>

        {result && (
          <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Information</h3>
            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100 shadow-inner">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
                <p className="text-gray-900 font-medium text-lg">{result.name || <span className="text-gray-400 italic">Not found</span>}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-gray-900 font-medium text-lg">{result.phoneNumber || <span className="text-gray-400 italic">Not found</span>}</p>
              </div>

              {result.phoneNumber && (
                <a
                  href={formatWhatsAppLink(result.phoneNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#25D366] hover:bg-[#128C7E] transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Whatsapp
                </a>
              )}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">Saved to database with ID: {result.id}</p>
          </div>
        )}
      </div>
      {/* <div onClick={handleList}>click disini</div> */}
    </main>
  );
}
