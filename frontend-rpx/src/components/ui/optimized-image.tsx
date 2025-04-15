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
  className,
  fill,
  width,
  height,
  ...props
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Classe para garantir que a imagem cubra adequadamente seu contêiner
  const imageClasses = `
    ${fill ? 'object-cover' : ''}
    transition-opacity duration-300 
    ${isLoading ? 'opacity-0' : 'opacity-100'} 
    ${className || ''}
  `.trim();

  return (
    <div className={`relative ${props.style?.position || 'relative'}`} style={{ ...props.style }}>
      {fill ? (
        <Image
          {...props}
          src={imgSrc}
          alt={alt}
          fill={true}
          className={imageClasses}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setImgSrc(fallbackSrc);
          }}
        />
      ) : (
        <Image
          {...props}
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={imageClasses}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setImgSrc(fallbackSrc);
          }}
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card-hover animate-pulse">
          <span className="sr-only">Carregando...</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 