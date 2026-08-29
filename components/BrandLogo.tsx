import Image from 'next/image';

export default function BrandLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''} ${className}`.trim()}>
      <Image
        src="/guti-store-wordmark-compact.jpg"
        alt="GutiStore"
        width={800}
        height={150}
        priority
        className="brand-logo-image"
      />
    </span>
  );
}
