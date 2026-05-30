import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaArchive, FaExternalLinkAlt, FaQuestion, FaStar, FaTimes, FaTrash } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { API } from 'utilities/util';

import type { Email, EmailActions } from 'hooks/useEmails';

import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

const iconClasses = 'pointer-events-auto text-slate-300 drop-shadow drop-shadow-slate-800/40';
const containerClass = 'mt-6 flex-1 overflow-auto rounded-lg bg-slate-100 p-4';

export function EmailModal({ email, onClose, actions }: { email: Email; onClose: () => void; actions?: EmailActions }) {
  const [data, setData] = useState<{ html: string }>({ html: '' });

  useEffect(() => {
    fetch(`${API}/api/emails/${email.id}`)
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(() => setData({ html: '' }));
  }, [email.id]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  return createPortal(
    <div
      className="fixed inset-0 z-20 m-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-screen w-screen flex-col gap-1 overflow-y-auto bg-slate-800 p-6 sm:h-[80vh] sm:max-w-[min(90vw,56rem)] sm:rounded-lg">
        <div className="flex flex-wrap-reverse justify-end gap-4">
          <p className="line-clamp-1 text-lg font-semibold break-all text-white">{email.sender}</p>
          <div className="flex-1"></div>
          <div className="flex gap-3">
            {actions && (
              <>
                <Button variant="primary" onClick={() => actions.markImportant(email.id, !email.important)}>
                  <FaStar className={twMerge(iconClasses, email.important && 'text-yellow-400')} />
                </Button>

                <Button variant="warning" onClick={() => actions.categorize(email.id, 'UNKNOWN')}>
                  <FaQuestion className={iconClasses} />
                </Button>

                <Button variant="success" onClick={() => actions.archive(email.id)}>
                  <FaArchive className={iconClasses} />
                </Button>

                <Button variant="danger" onClick={() => actions.trash(email.id)}>
                  <FaTrash className={iconClasses} />
                </Button>
              </>
            )}

            <div className="m-2"></div>

            <a href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" role="none">
                <FaExternalLinkAlt />
              </Button>
            </a>
            <Button variant="secondary" onClick={onClose}>
              <FaTimes />
            </Button>
          </div>
        </div>

        <p className="mb-2 text-slate-400">{new Date(email.date).toLocaleString()}</p>
        <p className="line-clamp-2 break-all text-slate-400">{email.subject}</p>

        {data.html && <iframe className={containerClass} srcDoc={data.html}></iframe>}
        {!data.html && (
          <div className={twMerge(containerClass, 'flex items-center justify-center')}>
            <Spinner size="xl" />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
