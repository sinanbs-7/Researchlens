import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorAlert({ message, onClose, className = '' }) {
  if (!message) return null;

  return (
    <div className={`p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 my-3 text-sm animate-fade-in ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 transition p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
