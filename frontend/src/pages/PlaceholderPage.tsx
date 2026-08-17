import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center font-bold text-sm">
            {title.charAt(0)}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title} Workspace</h3>
          <p className="text-xs text-slate-500">
            This module is structured and ready for upcoming feature modules.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
