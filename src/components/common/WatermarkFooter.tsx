import React from 'react';

const GITHUB_URL = 'https://github.com/ilhamsetiawanz/Gramedia_In_Out';

const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface WatermarkFooterProps {
  variant?: 'main' | 'sidebar' | 'sidebar-collapsed' | 'login';
}

export const WatermarkFooter: React.FC<WatermarkFooterProps> = ({ variant = 'main' }) => {
  if (variant === 'sidebar-collapsed') {
    return (
      <div className="pt-2 border-t border-blue-900/50 flex justify-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Made By LaughDay - GitHub"
          className="p-1.5 text-blue-300 hover:text-white hover:bg-[#274770] rounded-lg transition-colors"
        >
          <GitHubIcon className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="pt-2 border-t border-blue-900/50 flex items-center justify-between text-[11px] text-blue-200/90">
        <span className="font-medium tracking-tight">Made By LaughDay</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Kunjungi GitHub"
          className="inline-flex items-center space-x-1 text-blue-200 hover:text-white transition-colors font-medium"
        >
          <GitHubIcon className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className="mt-6 flex items-center justify-center space-x-3 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Made By LaughDay</span>
        <span className="text-slate-300">•</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-[#1e3a5f] font-medium transition-colors"
        >
          <GitHubIcon className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    );
  }

  // Default: 'main' footer
  return (
    <footer className="px-6 py-3.5 bg-white/80 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="font-medium text-slate-600">
        Made By <span className="font-semibold text-[#1e3a5f]">LaughDay</span>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#1e3a5f] border border-slate-200 font-medium transition-colors"
      >
        <GitHubIcon className="w-3.5 h-3.5" />
        <span>GitHub</span>
      </a>
    </footer>
  );
};
