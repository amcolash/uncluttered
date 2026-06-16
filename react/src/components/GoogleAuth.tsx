import { FaGoogle } from 'react-icons/fa';

import { getButtonStyle } from './ui/Button';

export function GoogleAuth({ url }: { url?: string }) {
  if (!url) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-12">
      <h2 className="text-xl text-slate-300">Your token has expired, please log in again.</h2>

      <a href={url} target="_blank" rel="noopener noreferrer" className={getButtonStyle({ variant: 'secondary' })}>
        <FaGoogle />
        <span>Sign in with Google</span>
      </a>
    </div>
  );
}
