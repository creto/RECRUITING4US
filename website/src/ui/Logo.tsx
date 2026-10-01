import { Link } from "./Link";
import s from "./Logo.module.css";

/** Official transparent PNG mark (brand/mark*.png from public/mark.png) plus wordmark. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={s.logo} aria-label="RECRUIT4US, inicio">
      <img src="/brand/mark-96.png" srcSet="/brand/mark-96.png 1x, /brand/mark-152.png 2x" alt="" width={38} height={28} className={s.mark} decoding="async" />
      {!compact && <span className={s.word}>RECRUIT4US</span>}
    </Link>
  );
}
