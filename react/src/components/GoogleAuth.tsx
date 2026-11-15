import { FaExclamationTriangle, FaGoogle, FaRedo, FaSync } from 'react-icons/fa';

import { Button, getButtonStyle } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface GoogleAuthProps {
  url?: string;
  error?: string | null;
  isResetting?: boolean;
  onReset?: () => void;
  onCheck?: () => void;
}

export function GoogleAuth({ url, error, isResetting, onReset, onCheck }: GoogleAuthProps) {
  if (!url && !error && isResetting) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" className="text-slate-300" />
        <p className="text-slate-400">Resetting authentication...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="rounded-full bg-slate-800 p-4 text-indigo-400">
          <FaGoogle className="text-3xl" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your Gmail token has expired or is invalid. Please sign in again to sync your emails.
          </p>
        </div>

        {error && (
          <div className="flex w-full items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
            <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-400" />
            <div className="flex-1 break-words">
              <p className="font-medium text-red-300">Auth Error</p>
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          {url ? (
            <a href={url} className={getButtonStyle({ variant: 'primary', size: 'lg' })}>
              <FaGoogle />
              <span>Sign in with Google</span>
            </a>
          ) : (
            <Button variant="primary" size="lg" loading={isResetting} onClick={onReset}>
              <FaRedo />
              <span>Request Auth URL</span>
            </Button>
          )}

          <div className="flex gap-2">
            {onReset && (
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                loading={isResetting}
                onClick={onReset}
                title="Clear local token and generate a fresh consent prompt"
              >
                <FaRedo />
                <span>Reset Auth</span>
              </Button>
            )}

            {onCheck && (
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={onCheck}
                title="Check if authentication is now valid"
              >
                <FaSync />
                <span>Check Status</span>
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          If you are stuck in a loop, click <strong>Reset Auth</strong> to wipe expired tokens and force a new consent
          screen.
        </p>
      </div>
    </div>
  );
}
