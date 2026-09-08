import Link from "next/link";

type BrandProps = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function Brand({ href = "/", compact = false, inverse = false, className = "" }: BrandProps) {
  const content = (
    <span className={`fb-brand ${compact ? "fb-brand--compact" : ""} ${inverse ? "fb-brand--inverse" : ""} ${className}`.trim()} aria-label="FoodBookPH">
      <span className="fb-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img">
          <path d="M10 8.5h13.2c4.1 0 7.2 2.2 7.2 5.8 0 2.6-1.4 4.4-3.6 5.2 2.7.8 4.2 2.8 4.2 5.4 0 4.1-3.2 6.6-7.7 6.6H10V8.5Zm6.1 5.1v4.1h6.7c1.6 0 2.5-.7 2.5-2.1 0-1.3-.9-2-2.5-2h-6.7Zm0 9.1v3.7h7.2c1.7 0 2.7-.7 2.7-1.9 0-1.2-1-1.8-2.7-1.8h-7.2Z" fill="currentColor"/>
          <path d="M27.9 7.3c1.4 1.2 2.4 2.7 2.8 4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
      {!compact && <span className="fb-brand__wordmark">foodbook<span>PH</span></span>}
    </span>
  );

  return href ? <Link href={href} className="fb-brand-link">{content}</Link> : content;
}
