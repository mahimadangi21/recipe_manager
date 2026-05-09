import React from 'react';
import { Link } from 'react-router-dom';

export function EmptyState({ title, description, actionText, actionLink, icon: Icon }) {
  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {actionText && actionLink && (
        <div className="mt-6">
          <Link
            to={actionLink}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            {actionText}
          </Link>
        </div>
      )}
    </div>
  );
}
