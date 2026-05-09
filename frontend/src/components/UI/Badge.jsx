import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
    primary: 'bg-orange-100 text-orange-800',
    admin: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={twMerge(clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant] || variants.default,
      className
    ))}>
      {children}
    </span>
  );
}
