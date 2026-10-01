import type { ReactNode } from "react";
import { StageTag } from "./StageTag";
import s from "./SectionHead.module.css";

type Props = {
  id: string;
  tag?: { label: string; step?: number; tone?: 1 | 2 | 3 | 4 };
  title: string;
  body?: ReactNode;
  className?: string;
  align?: "start" | "split";
  children?: ReactNode;
};

/**
 * Section heading. "split" puts the title left and the body in a narrower
 * right column (editorial rhythm); "start" stacks them.
 */
export function SectionHead({ id, tag, title, body, className, align = "start", children }: Props) {
  return (
    <header className={`${s.head} ${align === "split" ? s.split : ""} ${className ?? ""}`}>
      <div>
        {tag && <StageTag {...tag} />}
        <h2 id={id} className={`h2 ${s.title}`}>
          {title}
        </h2>
      </div>
      {(body || children) && (
        <div className={s.side}>
          {body && <p className={`body ${s.body}`}>{body}</p>}
          {children}
        </div>
      )}
    </header>
  );
}
