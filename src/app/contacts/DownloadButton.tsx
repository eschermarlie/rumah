'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  url: string;
  filename: string;
}

export function DownloadButton({ url, filename }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: Open in new tab if blob download fails (likely CORS)
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center justify-center px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors gap-1.5"
    >
      {isDownloading ? (
        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
      ) : (
        <Download className="h-3 w-3 text-gray-400" />
      )}
      Download Image
    </button>
  );
}
