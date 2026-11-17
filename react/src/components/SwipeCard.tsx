import { motion, useAnimate, useMotionValue, useTransform } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

type SwipeCardProps = {
  onSwipe(direction: 'left' | 'right'): void;
  index: number;
  className?: string;
  children: ReactNode;
};

const TRANSFORM_THRESHOLD = 150;
const INTERACT_THRESHOLD = 40;

export function SwipeCard({ onSwipe, index, className, children }: SwipeCardProps) {
  const [scope, animate] = useAnimate();

  const x = useMotionValue(0);

  const opacity = useTransform(
    x,
    [-TRANSFORM_THRESHOLD, -INTERACT_THRESHOLD, 0, INTERACT_THRESHOLD, TRANSFORM_THRESHOLD],
    [0, 1, 1, 1, 0]
  );
  const rotateRaw = useTransform(x, [-TRANSFORM_THRESHOLD, TRANSFORM_THRESHOLD], [-18, 18]);
  const rotate = useTransform(() => {
    const random = 1 + Math.random() * 3;
    let offset = index === 0 ? 0.1 : (index % 2 === 0 ? -1 : 1) * random;
    return rotateRaw.get() + offset;
  });

  const checkOpacity = useTransform(x, [INTERACT_THRESHOLD * 0.8, INTERACT_THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-INTERACT_THRESHOLD, -INTERACT_THRESHOLD * 0.8], [1, 0]);

  const isHandlingRef = useRef(false);

  // Handle keyboard interactions
  useEffect(() => {
    const keydown = async (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea'].includes(activeTag)) return;

      if (isHandlingRef.current) return;

      if (e.key === 'ArrowRight') {
        isHandlingRef.current = true;
        await animate(scope.current, { x: TRANSFORM_THRESHOLD }, { duration: 0.2 });
        onSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        isHandlingRef.current = true;
        await animate(scope.current, { x: -TRANSFORM_THRESHOLD }, { duration: 0.2 });
        onSwipe('left');
      }
    };

    if (index === 0) {
      window.addEventListener('keydown', keydown);
      return () => window.removeEventListener('keydown', keydown);
    }
  }, [index, animate, onSwipe, scope]);

  return (
    <motion.div
      className={twMerge(
        'rounded-card border-border-default bg-surface-card p-sm text-text-primary shadow-elevated flex origin-bottom touch-pan-y flex-col border transition-all duration-75 select-none hover:cursor-grab active:cursor-grabbing',
        'aspect-3/4 max-h-[65vh] w-[84vw] max-w-96 sm:w-[70vw]',
        index === 0 && 'hover:border-border-strong hover:scale-102',
        className
      )}
      ref={scope}
      style={{ gridRow: 1, gridColumn: 1, x, opacity, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={() => {
        if (Math.abs(x.get()) > INTERACT_THRESHOLD) {
          onSwipe(x.get() > 0 ? 'right' : 'left');
        }
      }}
      animate={{ scale: index === 0 ? 1.05 : 1, y: index * -10 }}
    >
      <motion.div
        className="bg-status-success p-sm text-text-primary shadow-elevated absolute top-6 right-6 z-10 rounded-full"
        style={{ opacity: checkOpacity }}
      >
        <FaCheck />
      </motion.div>
      <motion.div
        className="bg-status-danger p-sm text-text-primary shadow-elevated absolute top-6 left-6 z-10 rounded-full"
        style={{ opacity: skipOpacity }}
      >
        <FaTimes />
      </motion.div>

      {children}

      <footer role="toolbar" aria-label="Review actions" className="pt-xs mt-auto flex justify-between">
        <button
          onClick={async () => {
            await animate(scope.current, { x: -TRANSFORM_THRESHOLD }, { duration: 0.2 });
            onSwipe('left');
          }}
          className="hidden cursor-pointer sm:inline-block"
          aria-label="Skip email"
          title="Skip (Left arrow)"
        >
          <motion.div className="bg-status-danger p-sm text-text-primary rounded-full transition-opacity hover:opacity-90">
            <FaTimes />
          </motion.div>
        </button>

        <button
          onClick={async () => {
            await animate(scope.current, { x: TRANSFORM_THRESHOLD }, { duration: 0.2 });
            onSwipe('right');
          }}
          className="hidden cursor-pointer sm:inline-block"
          aria-label="Approve email"
          title="Approve (Right arrow)"
        >
          <motion.div className="bg-status-success p-sm text-text-primary rounded-full transition-opacity hover:opacity-90">
            <FaCheck />
          </motion.div>
        </button>
      </footer>
    </motion.div>
  );
}

// Only show the top 5 cards and reverse the order so the first card is on top
export function CardStack({ children }: { children: ReactNode[] }) {
  return <div className="grid place-items-center pt-8">{children.slice(0, 5).reverse()}</div>;
}
