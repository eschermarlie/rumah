"use client";

import { useState, useEffect } from "react";
import { uploadAndExtractAction } from "./actions";
import { Camera, MapPin, Check, AlertCircle } from "lucide-react";

interface ExtractionJob {
  id: string;
  file: File;
  preview: string;
  loading: boolean;
  result: any;
  error: string | null;
}

const formatWhatsAppLink = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  let formatted = cleanNumber;
  if (cleanNumber.startsWith("0")) {
    formatted = "62" + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith("62")) {
    formatted = "62" + cleanNumber;
  }
  return `https://wa.me/${formatted}`;
};

export default function Extractor() {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');

  useEffect(() => {
    // Request location on mount or when first file is added
    if (jobs.length > 0 && locationStatus === 'idle') {
      requestLocation();
    }
  }, [jobs.length, locationStatus]);

  const requestLocation = () => {
    if (typeof window === 'undefined' || !("geolocation" in navigator)) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('granted');
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus(error.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newJobs: ExtractionJob[] = selectedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        loading: false,
        result: null,
        error: null,
      }));
      setJobs((prev) => [...prev, ...newJobs]);
    }
    // Reset input so the same file can be added again if removed
    e.target.value = "";
  };

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const jobToRemove = prev.find((j) => j.id === id);
      if (jobToRemove) URL.revokeObjectURL(jobToRemove.preview);
      return prev.filter((j) => j.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jobs.length === 0 || isProcessing) return;

    setIsProcessing(true);

    // Filter only jobs that haven't been processed yet or had an error
    const jobsToProcess = jobs.filter((j) => !j.result);

    await Promise.all(
      jobsToProcess.map(async (job) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, loading: true, error: null } : j,
          ),
        );

        const formData = new FormData();
        formData.append("image", job.file);
        if (userLocation) {
          formData.append("lat", userLocation.lat.toString());
          formData.append("lng", userLocation.lng.toString());
        }

        const res = await uploadAndExtractAction(formData);

        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  loading: false,
                  result: res.success ? res.data : null,
                  error: res.success
                    ? null
                    : res.error || "An unknown error occurred",
                }
              : j,
          ),
        );
      }),
    );

    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            AI Contact Extractor
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload multiple images or take a photo to extract names and
            phone numbers.
          </p>
          
          {/* Location Status Indicator */}
          <div className="mt-4 flex justify-center">
            <button 
              type="button"
              onClick={requestLocation}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                locationStatus === 'granted' ? 'bg-green-50 text-green-700 border border-green-200' :
                locationStatus === 'denied' ? 'bg-red-50 text-red-700 border border-red-200' :
                locationStatus === 'requesting' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <MapPin className="h-3 w-3" />
              {locationStatus === 'granted' ? `Location: ${userLocation?.lat.toFixed(4)}, ${userLocation?.lng.toFixed(4)}` :
               locationStatus === 'denied' ? 'Location Access Denied' :
               locationStatus === 'requesting' ? 'Getting Location...' :
               locationStatus === 'error' ? 'Location Not Supported' :
               'Use Current Location'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-gray-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="text-xs text-gray-500 font-semibold">Gallery / File</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <label
              htmlFor="camera-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors border-indigo-200"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-indigo-600">
                <Camera className="w-8 h-8 mb-2" />
                <p className="text-xs font-semibold">Take Photo (Camera)</p>
              </div>
              <input
                id="camera-file"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative group"
                >
                  <button
                    onClick={() => removeJob(job.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                    type="button"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>

                  <div className="flex gap-4">
                    <div className="w-24 h-24 shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <img
                        src={job.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="grow min-w-0">
                      {job.loading ? (
                        <div className="h-full flex items-center justify-center">
                          <svg
                            className="animate-spin h-6 w-6 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      ) : job.result ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {job.result.name || "No Name"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {job.result.phoneNumber || "No Phone"}
                          </p>
                          {job.result.location && (
                            <p className="text-[10px] text-gray-400 truncate">
                              📍 {job.result.location}
                            </p>
                          )}
                          <div className="flex gap-1.5 mt-1">
                            {job.result.phoneNumber && (
                              <a
                                href={formatWhatsAppLink(job.result.phoneNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 bg-[#25D366] text-white text-[10px] font-bold rounded hover:bg-[#128C7E] transition-colors"
                              >
                                WhatsApp
                              </a>
                            )}
                            <div className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded font-bold border border-blue-100 flex items-center">
                              <Check className="h-2.5 w-2.5 mr-1" />
                              Saved
                            </div>
                          </div>
                        </div>
                      ) : job.error ? (
                        <div className="text-red-600 flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase">Error</span>
                          </div>
                          <p className="text-[10px] italic leading-tight">
                            {job.error}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          Ready to process
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={
              jobs.length === 0 || isProcessing || !jobs.some((j) => !j.result)
            }
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? "Processing Images..." : "Extract All Details"}
          </button>
        </form>
      </div>
    </main>
  );
}
