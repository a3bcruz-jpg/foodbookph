import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function Brand({ href = "/", compact = false, inverse = false, className = "" }: BrandProps) {
  const content = (
    <span
      className={`fb-brand ${compact ? "fb-brand--compact" : ""} ${inverse ? "fb-brand--inverse" : ""} ${className}`.trim()}
      aria-label="FoodBookPH"
    >
      <Image
        className="fb-brand__logo"
        src="/brand/foodbookph-logo.png"
        alt="FoodBookPH"
        width={220}
        height={64}
        priority
      />
    </span>
  );

  return href ? <Link href={href} className="fb-brand-link">{content}</Link> : content;
}
