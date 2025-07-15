import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <ShieldCheckIcon className="h-4 w-4 text-green-600" />
          <span>
            Your data is never used for AI model training by us or our AI providers.
          </span>
          <Link 
            to="/privacy" 
            className="text-primary-600 hover:text-primary-700 font-medium underline"
          >
            Learn more about our privacy practices
          </Link>
        </div>
      </div>
    </footer>
  );
}