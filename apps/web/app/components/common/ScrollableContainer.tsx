"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../../lib/icons';

export const ScrollableContainer = ({ 
  children, 
  className = "", 
  innerClassName = "" 
}: { 
  children: React.ReactNode, 
  className?: string,
  innerClassName?: string
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const { ChevronLeft, ChevronRight } = Icons;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 10); // Small threshold
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Check scroll on children change (e.g. data loaded)
  useEffect(() => {
    checkScroll();
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Left Chevron Gradient */}
      <div 
        className={`absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-background via-background/60 to-transparent z-10 flex items-center justify-start transition-all duration-500 pointer-events-none ${showLeft ? 'opacity-100' : 'opacity-0'}`}
      >
        <button 
          onClick={() => scroll('left')}
          className="hidden md:flex pointer-events-auto p-1.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-sm text-muted hover:text-primary hover:scale-110 hover:shadow-md transition-all ml-1 active:scale-90"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={`overflow-x-auto custom-scrollbar pb-4 ${innerClassName}`}
      >
        {children}
      </div>

      {/* Right Chevron Gradient */}
      <div 
        className={`absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background via-background/60 to-transparent z-10 flex items-center justify-end transition-all duration-500 pointer-events-none ${showRight ? 'opacity-100' : 'opacity-0'}`}
      >
        <button 
          onClick={() => scroll('right')}
          className="hidden md:flex pointer-events-auto p-1.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-sm text-muted hover:text-primary hover:scale-110 hover:shadow-md transition-all mr-1 active:scale-90"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
