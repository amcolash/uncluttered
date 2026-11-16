import { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { clearPwaCacheAndReload } from 'utilities/util';

import { useServerStatus } from 'contexts/ServerStatusContext';

export function ServerStatusLabel() {
  const { isServerReachable } = useServerStatus();
  const [retrying, setRetrying] = useState(false);

  if (isServerReachable) return null;

  const handleRetry = async () => {
    setRetrying(true);
    await clearPwaCacheAndReload();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(
        'fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2',
        'flex items-center gap-2 rounded-full border border-amber-500/40 bg-slate-900/95 px-3.5 py-1 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md transition-all'
      )}
    >
      <span className="size-2 animate-pulse rounded-full bg-amber-400" />
      <span>Cannot reach server</span>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="ml-1 inline-flex cursor-pointer items-center gap-1 font-semibold text-amber-300 underline underline-offset-2 hover:text-white disabled:opacity-50"
      >
        {retrying ? (
          <>
            <FaSync className="size-2.5 animate-spin" />
            <span>Retrying...</span>
          </>
        ) : (
          <span>Retry</span>
        )}
      </button>
    </div>
  );
}
