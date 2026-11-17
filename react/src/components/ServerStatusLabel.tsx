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
        'gap-xs border-status-warning/40 bg-surface-card/95 px-sm py-xs text-status-warning shadow-elevated flex items-center rounded-full border text-xs font-medium backdrop-blur-md transition-all'
      )}
    >
      <span className="bg-status-warning size-2 animate-pulse rounded-full" />
      <span>Cannot reach server</span>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="ml-xs gap-xs text-status-warning inline-flex cursor-pointer items-center font-semibold underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
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
