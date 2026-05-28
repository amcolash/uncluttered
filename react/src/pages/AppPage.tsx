import { useState } from 'react';
import { photos } from 'utilities/photos';

import { CardStack, SwipeCard } from 'components/SwipeCard';
import { Button } from 'components/ui/Button';

export function AppPage() {
  const [cards, setCards] = useState(photos);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 bg-slate-800 p-6">
      <h1 className="text-center text-2xl font-bold text-white">Verify Categorization</h1>

      <Button onClick={() => {}}>Retrain model</Button>
      <Button onClick={() => {}}>Reclassify Preview</Button>

      {cards.length > 0 ? (
        <CardStack>
          {cards.map((card, i) => (
            <SwipeCard
              key={card.id}
              onSwipe={(_dir) => {
                setCards((prev) => prev.filter((c) => c.id !== card.id));
              }}
              index={i}
            >
              <img
                src={card.url}
                alt={`Photo ${card.id}`}
                className="h-full w-full rounded-lg object-cover"
                draggable={false}
              />
            </SwipeCard>
          ))}
        </CardStack>
      ) : (
        <p className="text-lg text-white">No more photos to verify!</p>
      )}
    </div>
  );
}
