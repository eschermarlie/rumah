'use client';

import { useState } from 'react';
import { MapPin, Check, X, Edit2 } from 'lucide-react';
import { updateContact } from './actions';

interface LocationFieldProps {
  id: number;
  initialLocation: string | null;
}

export function LocationField({ id, initialLocation }: LocationFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState(initialLocation || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateContact(id, { location: location || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="text-[10px] border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-grow min-w-0"
          placeholder="Enter location..."
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setLocation(initialLocation || '');
          }}
          disabled={isLoading}
          className="p-0.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-400 mt-0.5 group/loc cursor-pointer" onClick={() => setIsEditing(true)}>
      <MapPin className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
      <span className="text-[10px] truncate flex-grow">
        {initialLocation || 'Add location'}
      </span>
      <Edit2 className="h-2.5 w-2.5 ml-1 opacity-0 group-hover/loc:opacity-100 transition-opacity" />
    </div>
  );
}
