'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteContact } from './actions';

interface DeleteButtonProps {
  id: number;
  contactName: string;
}

export function DeleteButton({ id, contactName }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete contact "${contactName || 'Unknown Name'}"? This will also remove the image from storage.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteContact(id);
      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('An unexpected error occurred while deleting the contact.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete contact"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
