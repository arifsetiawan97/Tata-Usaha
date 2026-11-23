import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'portal' | 'workspace';
  theme?: 'dark' | 'light';
  label?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'workspace',
  theme = 'light',
  label = 'Memuat data dari server...'
}) => {
  const isDark = theme === 'dark';
  const cardBg = isDark
    ? 'bg-slate-900/75 border-slate-800'
    : 'bg-white/90 border-slate-200';
  const blockBg = isDark ? 'bg-slate-800/90' : 'bg-slate-200/80';
  const subBlockBg = isDark ? 'bg-slate-800/60' : 'bg-slate-100';

  if (variant === 'portal') {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label={label}>
        {/* Header / Hero skeleton */}
        <div className={`rounded-2xl border p-6 space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`h-4 w-44 rounded-md ${blockBg}`} />
            <div className={`h-6 w-28 rounded-md ${subBlockBg}`} />
          </div>
          <div className={`h-8 w-3/4 max-w-xl rounded-lg ${blockBg}`} />
          <div className={`h-4 w-2/3 max-w-lg rounded-md ${subBlockBg}`} />
          <div className="flex flex-wrap gap-2.5 pt-2">
            <div className={`h-10 w-32 rounded-xl ${blockBg}`} />
            <div className={`h-10 w-40 rounded-xl ${subBlockBg}`} />
            <div className={`h-10 w-32 rounded-xl ${subBlockBg}`} />
          </div>
        </div>

        {/* Service Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(idx => (
            <div key={idx} className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl ${blockBg}`} />
                <div className={`h-4 w-20 rounded-md ${subBlockBg}`} />
              </div>
              <div className="space-y-2">
                <div className={`h-3 w-28 rounded ${subBlockBg}`} />
                <div className={`h-5 w-44 rounded ${blockBg}`} />
                <div className={`h-3 w-full rounded ${subBlockBg}`} />
                <div className={`h-3 w-5/6 rounded ${subBlockBg}`} />
              </div>
              <div className={`h-10 w-full rounded-xl ${blockBg}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label={label}>
      {/* Summary KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(idx => (
          <div key={idx} className={`rounded-2xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div className={`h-3.5 w-24 rounded ${subBlockBg}`} />
              <div className={`w-8 h-8 rounded-lg ${blockBg}`} />
            </div>
            <div className={`h-7 w-20 rounded-md ${blockBg}`} />
            <div className={`h-3 w-32 rounded ${subBlockBg}`} />
          </div>
        ))}
      </div>

      {/* Main Content Card / List skeleton */}
      <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div className="space-y-2">
            <div className={`h-5 w-48 rounded ${blockBg}`} />
            <div className={`h-3 w-72 rounded ${subBlockBg}`} />
          </div>
          <div className={`h-9 w-36 rounded-xl ${blockBg}`} />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map(row => (
            <div
              key={row}
              className={`p-3.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/80'} flex items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-lg shrink-0 ${blockBg}`} />
                <div className="space-y-2 flex-1">
                  <div className={`h-4 w-2/3 max-w-xs rounded ${blockBg}`} />
                  <div className={`h-3 w-1/2 max-w-[200px] rounded ${subBlockBg}`} />
                </div>
              </div>
              <div className={`h-7 w-20 rounded-lg shrink-0 ${subBlockBg}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
