'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export const OptimizedImage = ({
  src,
  alt,
  fallbackSrc = '/images/avatar-placeholder.svg',
  ...props
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${props.className || ''}`} style={{ ...props.style }}>
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${props.className || ''}`}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card-hover animate-pulse">
          <span className="sr-only">Carregando...</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 