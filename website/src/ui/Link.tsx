import type { ComponentProps, MouseEvent } from "react";
import { navigate } from "@/app/router";

type Props = ComponentProps<"a"> & { href: string };

/** Anchor that routes client-side for internal links; plain <a> otherwise. */
export function Link({ href, onClick, ...rest }: Props) {
  const internal = (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/login")) || href.startsWith("#");
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !internal) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...rest} />;
}
