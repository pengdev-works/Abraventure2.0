import React, { useState, useRef, useLayoutEffect } from 'react';

/**
 * ExpandableText
 * Shows `clampLines` lines of text, with a "See more / See less" toggle.
 * Only renders the toggle button if the text actually overflows.
 *
 * Props:
 *  text        {string}  - The full text content to display
 *  clampLines  {number}  - Max lines to show when collapsed (default: 3)
 *  className   {string}  - Extra classes applied to the outer <div>
 *  textClass   {string}  - Classes applied to the <p> text element
 *  moreLabel   {string}  - Label for expand button (default: "See more")
 *  lessLabel   {string}  - Label for collapse button (default: "See less")
 */
const ExpandableText = ({
  text,
  clampLines = 3,
  className = '',
  textClass = 'text-xs text-[#5A534E] dark:text-[#96ADA0] leading-relaxed',
  moreLabel = 'See more',
  lessLabel = 'See less',
  toggleBtnClass = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const textRef = useRef(null);

  // Detect overflow on mount / resize
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const check = () => {
      // In clamped state (-webkit-box), el.clientHeight is the visible rendered height,
      // while el.scrollHeight is the full height of the complete text.
      const isOverflowing = el.scrollHeight > el.clientHeight + 2;

      // Resilient fallback based on character count to ensure toggle displays even before font reflow
      const isLongText = (text && text.length > 95 && clampLines <= 3) || (text && text.length > 160);

      setShowToggle(isOverflowing || isLongText);
    };

    check();
    // Re-check shortly after font loading/hydration
    const rafId = requestAnimationFrame(check);
    const timeoutId = setTimeout(check, 100);

    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', check);
    };
  }, [text, clampLines]);

  if (!text) return null;

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`${textClass} ${!expanded ? 'overflow-hidden' : ''}`}
        style={
          !expanded
            ? {
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: clampLines,
                overflow: 'hidden',
              }
            : { display: 'block' }
        }
      >
        {text}
      </p>

      {showToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className={
            toggleBtnClass
              ? toggleBtnClass
              : 'mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#153325] dark:text-[#E0B94F] hover:text-[#B88B2A] transition-colors cursor-pointer underline underline-offset-4 decoration-dotted active:scale-95 touch-manipulation'
          }
          aria-label={expanded ? lessLabel : moreLabel}
          aria-expanded={expanded}
        >
          <span>{expanded ? lessLabel : moreLabel}</span>
          <span className="text-[9px] leading-none transition-transform" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
