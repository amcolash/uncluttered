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
      <div className="gap-md bg-surface-canvas absolute inset-0 flex flex-col items-center justify-center">
        <Spinner size="xl" className="text-brand-primary" />
        <p className="text-text-secondary text-sm">Resetting authentication...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-canvas p-md absolute inset-0 flex items-center justify-center">
      <div className="gap-md rounded-modal border-border-default bg-surface-card p-xl shadow-elevated flex w-full max-w-md flex-col items-center border">
        <div className="bg-surface-elevated p-md text-brand-primary rounded-full">
          <FaGoogle className="text-3xl" />
        </div>

        <div className="text-center">
          <h2 className="text-text-primary text-2xl font-bold tracking-tight">Authentication Required</h2>
          <p className="mt-xs text-text-secondary text-sm">
            Your Gmail token has expired or is invalid. Please sign in again to sync your emails.
          </p>
        </div>

        {error && (
          <div className="gap-sm rounded-control border-status-danger/40 bg-status-danger-subtle p-sm text-status-danger flex w-full items-start border text-sm">
            <FaExclamationTriangle className="text-status-danger mt-0.5 shrink-0" />
            <div className="flex-1 break-words">
              <p className="text-status-danger font-semibold">Auth Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="gap-sm flex w-full flex-col">
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

          <div className="gap-xs flex">
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

        <p className="text-text-muted text-center text-xs">
          If you are stuck in a loop, click <strong>Reset Auth</strong> to wipe expired tokens and force a new consent
          screen.
        </p>
      </div>
    </div>
  );
}
