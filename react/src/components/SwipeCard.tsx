import { motion, useAnimate, useMotionValue, useTransform } from 'motion/react';
import { type ReactNode, useEffect } from 'react';
import { FaCheck, FaQuestion, FaTimes } from 'react-icons/fa';
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

  // Handle keyboard interactions
  useEffect(() => {
    const keydown = async (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        await animate(scope.current, { x: TRANSFORM_THRESHOLD }, { duration: 0.2 });
        onSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        await animate(scope.current, { x: -TRANSFORM_THRESHOLD }, { duration: 0.2 });
        onSwipe('left');
      }
    };

    if (index === 0) {
      window.addEventListener('keydown', keydown);
      return () => window.removeEventListener('keydown', keydown);
    }
  }, [index]);

  return (
    <motion.div
      className={twMerge(
        'user-select-none flex aspect-3/5 max-h-[70vh] max-w-[60vw] origin-bottom rounded-lg bg-slate-800 p-1 text-neutral-200 shadow-lg shadow-slate-800/50 transition-all duration-75 hover:cursor-grab active:cursor-grabbing',
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
      <motion.div className="absolute top-6 right-6 rounded-full bg-green-800 p-4" style={{ opacity: checkOpacity }}>
        <FaCheck />
      </motion.div>
      {/* <motion.div className="absolute top-6 left-6 rounded-full bg-yellow-600 p-4" style={{ opacity: skipOpacity }}>
        <FaQuestion />
      </motion.div> */}
      <motion.div className="absolute top-6 left-6 rounded-full bg-red-500 p-4" style={{ opacity: skipOpacity }}>
        <FaTimes />
      </motion.div>

      {children}
    </motion.div>
  );
}

// Only show the top 5 cards and reverse the order so the first card is on top
export function CardStack({ children }: { children: ReactNode[] }) {
  return <div className="grid place-items-center pt-10">{children.slice(0, 5).reverse()}</div>;
}
