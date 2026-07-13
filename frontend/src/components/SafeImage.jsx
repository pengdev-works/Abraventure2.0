import React, { useState } from 'react';

// Placeholders keyed by aspect ratio hint
const PLACEHOLDERS = {
  landscape: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60',
  portrait:  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=60',
  square:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60',
  avatar:    'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&auto=format&fit=crop&q=60',
};

/**
 * SafeImage — renders an <img> and falls back to a placeholder on any load error.
 *
 * Props mirror a normal <img> element plus:
 *   fallback  — 'landscape' | 'portrait' | 'square' | 'avatar' | custom URL
 *               defaults to 'landscape'
 */
const SafeImage = ({
  src,
  alt = '',
  fallback = 'landscape',
  className = '',
  style,
  ...rest
}) => {
  const [errored, setErrored] = useState(false);

  const fallbackSrc =
    PLACEHOLDERS[fallback] ??
    (fallback.startsWith('http') ? fallback : PLACEHOLDERS.landscape);

  const resolvedSrc = errored || !src ? fallbackSrc : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (!errored) setErrored(true);
      }}
      {...rest}
    />
  );
};

export default SafeImage;
