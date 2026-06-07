import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DashboardImage } from '../../types';

export function DashboardCarousel({ images }: { images: DashboardImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  useEffect(() => {
    if (images.length < 2) return undefined;
    const interval = window.setInterval(() => setActive((index) => (index + 1) % images.length), 6000);
    return () => window.clearInterval(interval);
  }, [images.length]);

  const previous = () => setActive((index) => (index - 1 + images.length) % images.length);
  const next = () => setActive((index) => (index + 1) % images.length);

  if (!current) return null;

  return (
    <div className="hero-carousel-shell">
      <div className="hero-carousel">
        <img src={current.imageUrl} alt={current.title} />
      </div>
      {images.length > 1 && (
        <div className="hero-carousel__controls">
          <button onClick={previous} aria-label="Previous family photo"><ChevronLeft size={20} /></button>
          <div className="flex gap-2">
            {images.map((image, index) => (
              <button key={image._id} onClick={() => setActive(index)} className={index === active ? 'is-active' : ''} aria-label={`Show ${image.title}`} />
            ))}
          </div>
          <button onClick={next} aria-label="Next family photo"><ChevronRight size={20} /></button>
        </div>
      )}
      <div className="hero-carousel__meta">
        <span>{String(active + 1).padStart(2, '0')}</span>
        <div />
        <span>{String(images.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
