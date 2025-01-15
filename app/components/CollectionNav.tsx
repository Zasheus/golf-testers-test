import React, {useEffect, useRef, useState} from 'react';
import {Button} from '~/components/ui/button';
import {Link} from '@remix-run/react';

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
  } | null;
}

interface CollectionNavProps {
  collections: Collection[];
  currentHandle: string | undefined;
}

const CollectionNav: React.FC<CollectionNavProps> = ({
  collections,
  currentHandle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const BUTTON_WIDTH = 152; // 120px min-width + 32px (2rem) spacing

  // Auto scroll functionality
  useEffect(() => {
    const container = scrollContainerRef.current;

    const startAutoScroll = () => {
      autoScrollInterval.current = setInterval(() => {
        if (container && !isDragging) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          const currentScrollPosition = container.scrollLeft;
          const buttonsInView = Math.floor(
            container.clientWidth / BUTTON_WIDTH,
          );
          const scrollAmount = BUTTON_WIDTH * buttonsInView;

          let newScrollLeft = currentScrollPosition + scrollAmount;

          // Reset to beginning if we're near the end
          if (newScrollLeft >= maxScroll - BUTTON_WIDTH) {
            newScrollLeft = 0;
          }

          container.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth',
          });
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [isDragging]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeft(scrollContainerRef.current!.scrollLeft);

    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  const handleMouseUp = () => {
    if (scrollContainerRef.current) {
      // Snap to the nearest button
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        Math.round(currentScroll / BUTTON_WIDTH) * BUTTON_WIDTH;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging && scrollContainerRef.current) {
      // Snap to the nearest button when leaving while dragging
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        Math.round(currentScroll / BUTTON_WIDTH) * BUTTON_WIDTH;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;

    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="relative w-full overflow-hidden pb-8 pt-4 border-b border-neutral-300">
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-scroll no-scrollbar transition-all duration-300 cursor-grab active:cursor-grabbing scroll-smooth snap-x snap-mandatory"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {collections.map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.handle}`}
            className="shrink-0 snap-start"
          >
            <Button
              variant={
                currentHandle === collection.handle ? 'default' : 'outline'
              }
              size="lg"
              className="px-6 py-3 text-base font-medium border-neutral-300 min-w-[120px] transition-all duration-300 hover:shadow-lg hover:border-neutral-400"
            >
              {collection.title}
            </Button>
          </Link>
        ))}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CollectionNav;
