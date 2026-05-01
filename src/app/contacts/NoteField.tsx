'use client';

import { useState } from 'react';
import { StickyNote, Check, X, Edit2 } from 'lucide-react';
import { updateContact } from './actions';

interface NoteFieldProps {
  id: number;
  initialNote: string | null;
}

export function NoteField({ id, initialNote }: NoteFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateContact(id, { note: note || null });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center gap-1">
          <StickyNote className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-400 font-medium">Note</span>
        </div>
        <div className="flex items-start gap-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-[10px] border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-grow min-h-[40px] resize-none"
            placeholder="Add a note..."
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setNote(initialNote || '');
              }}
              disabled={isLoading}
              className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-50 group/note cursor-pointer" onClick={() => setIsEditing(true)}>
      <div className="flex items-center text-gray-400">
        <StickyNote className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Note</span>
        <Edit2 className="h-2.5 w-2.5 ml-auto opacity-0 group-hover/note:opacity-100 transition-opacity" />
      </div>
      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-3 italic">
        {initialNote || 'Click to add a note...'}
      </p>
    </div>
  );
}
