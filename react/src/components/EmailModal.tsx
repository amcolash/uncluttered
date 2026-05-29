import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaExternalLinkAlt, FaLink, FaTimes } from 'react-icons/fa';
import { API } from 'utilities/util';

import type { Email } from 'hooks/useEmails';

import { Button } from './ui/Button';

export function EmailModal({ email, onClose }: { email: Email; onClose: () => void }) {
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

    return () => {
      document.body.style.overflow = '';
    };
  });

  return createPortal(
    <div
      className="fixed inset-0 z-20 m-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-slate-800 p-6">
        <p className="line-clamp-1 text-lg font-semibold break-all text-white">{email.sender}</p>
        <p className="mb-2 text-slate-400">{new Date(email.date).toLocaleString()}</p>
        <p className="line-clamp-2 break-all text-slate-400">{email.subject}</p>

        <div
          className="mt-6 overflow-auto rounded-lg bg-slate-100 p-4"
          dangerouslySetInnerHTML={{ __html: data.html }}
        ></div>

        <div className="absolute top-4 right-4 flex gap-2">
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
    </div>,
    document.body
  );
}
