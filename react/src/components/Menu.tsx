import { type ReactNode, useEffect, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

import { useBreakpoint } from 'hooks/useBreakpoint';

import { Button } from './ui/Button';

export function Menu({ children }: { children: ReactNode }) {
  const breakpoint = useBreakpoint();
  const [visible, setVisible] = useState(breakpoint !== 'sm' && breakpoint !== 'md');

  useEffect(() => {
    if (breakpoint === 'sm' || breakpoint === 'md') setVisible(false);
    else setVisible(true);
  }, [breakpoint]);

  return (
    <div className="relative top-0 left-0 z-10 max-md:absolute">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-4 left-4 z-10"
      >
        {visible ? <FaTimes /> : <FaBars />}
      </Button>
      {visible && children}
    </div>
  );
}
