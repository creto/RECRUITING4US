import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useCopy } from "@/content/i18n";
import { DEMO_EMAIL, DEMO_ENDPOINT, appHref } from "@/lib/env";
import { useReducedMotion } from "@/lib/media";
import { gsap } from "@/motion/scroll";
import s from "./Demo.module.css";

type Values = { name: string; org: string; email: string; phone: string; size: string; interests: string[]; message: string };
type Key = "name" | "org" | "email" | "size";
type Status = { kind: "idle" } | { kind: "invalid" } | { kind: "pending" } | { kind: "sent" } | { kind: "mailto"; href: string } | { kind: "error" };

const EMPTY: Values = { name: "", org: "", email: "", phone: "", size: "", interests: [], message: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORDER: Key[] = ["name", "org", "email", "size"];

function Field({
  id,
  label,
  error,
  children,
  hint,
  reserve = 1,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  /** Lines kept free under the input for its message, so errors never push the form. */
  reserve?: 0 | 1 | 2;
}) {
  return (
    <div className={s.field} data-invalid={error ? "" : undefined} style={{ ["--reserve" as string]: reserve }}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={s.hint}>
          {hint}
        </p>
      )}
      {!error && !hint && reserve > 0 && <span className={s.slot} aria-hidden="true" />}
      {error && (
        <p id={`${id}-error`} className={s.error}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.8v3.6M8 10.9v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/** The demo-request form. Reused as-is on /contacto. */
export function DemoForm() {
  const d = useCopy().demo;
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const validateOne = (k: Key, val: Values): string | undefined => {
    const raw = val[k].trim();
    if (!raw) return d.required;
    if (k === "email" && !EMAIL_RE.test(raw)) return d.invalidEmail;
    return undefined;
  };

  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...v, [k]: e.target.value };
    setV(next);
    // Once a field shows an error, re-validate it as the person types.
    if ((ORDER as string[]).includes(k) && errors[k as Key]) setErrors((prev) => ({ ...prev, [k]: validateOne(k as Key, next) }));
  };
  const blur = (k: Key) => () => {
    if (v[k].trim() || errors[k]) setErrors((prev) => ({ ...prev, [k]: validateOne(k, v) }));
  };
  const toggle = (interest: string) =>
    setV((prev) => ({ ...prev, interests: prev.interests.includes(interest) ? prev.interests.filter((x) => x !== interest) : [...prev.interests, interest] }));

  const describe = (k: Key, hint = false) => (errors[k] ? `${id(k)}-error` : hint ? `${id(k)}-hint` : undefined);

  const mailBody = (val: Values) =>
    [
      d.mailIntro,
      "",
      `${d.fields.name}: ${val.name.trim()}`,
      `${d.fields.org}: ${val.org.trim()}`,
      `${d.fields.email}: ${val.email.trim()}`,
      `${d.fields.phone}: ${val.phone.trim() || d.none}`,
      `${d.fields.size}: ${val.size}`,
      `${d.fields.interest}: ${val.interests.length ? val.interests.join(", ") : d.none}`,
      "",
      val.message.trim(),
    ]
      .join("\n")
      .trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status.kind === "pending") return;
    const next: Partial<Record<Key, string>> = {};
    ORDER.forEach((k) => {
      const err = validateOne(k, v);
      if (err) next[k] = err;
    });
    setErrors(next);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      setStatus({ kind: "invalid" });
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
      return;
    }

    if (DEMO_ENDPOINT) {
      setStatus({ kind: "pending" });
      try {
        const res = await fetch(DEMO_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: v.name.trim(),
            organization: v.org.trim(),
            email: v.email.trim(),
            phone: v.phone.trim() || null,
            teamSize: v.size,
            interests: v.interests,
            message: v.message.trim() || null,
            source: "website",
            locale: "es",
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus({ kind: "sent" });
        setV(EMPTY);
      } catch {
        setStatus({ kind: "error" });
      }
      return;
    }

    const href = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(`${d.mailSubject}: ${v.org.trim()}`)}&body=${encodeURIComponent(mailBody(v))}`;
    setStatus({ kind: "mailto", href });
    window.location.href = href;
  };

  const pending = status.kind === "pending";

  return (
    <form ref={formRef} className={s.form} noValidate onSubmit={submit} aria-describedby={id("privacy")}>
      <div className={s.row}>
        <Field id={id("name")} label={d.fields.name} error={errors.name}>
          <input
            id={id("name")}
            className={s.input}
            name="name"
            autoComplete="name"
            required
            value={v.name}
            onChange={set("name")}
            onBlur={blur("name")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describe("name")}
          />
        </Field>
        <Field id={id("org")} label={d.fields.org} error={errors.org}>
          <input
            id={id("org")}
            className={s.input}
            name="organization"
            autoComplete="organization"
            required
            value={v.org}
            onChange={set("org")}
            onBlur={blur("org")}
            aria-invalid={errors.org ? true : undefined}
            aria-describedby={describe("org")}
          />
        </Field>
      </div>

      <div className={s.row}>
        <Field id={id("email")} label={d.fields.email} error={errors.email} reserve={2}>
          <input
            id={id("email")}
            className={s.input}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={v.email}
            onChange={set("email")}
            onBlur={blur("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describe("email")}
          />
        </Field>
        <Field id={id("phone")} label={d.fields.phone}>
          <input id={id("phone")} className={s.input} type="tel" name="phone" autoComplete="tel" inputMode="tel" value={v.phone} onChange={set("phone")} />
        </Field>
      </div>

      <Field id={id("size")} label={d.fields.size} error={errors.size}>
        <span className={s.selectWrap}>
          <select
            id={id("size")}
            className={`${s.input} ${s.select}`}
            name="teamSize"
            required
            value={v.size}
            onChange={set("size")}
            onBlur={blur("size")}
            aria-invalid={errors.size ? true : undefined}
            aria-describedby={describe("size")}
            data-empty={v.size ? undefined : ""}
          >
            <option value="" disabled>
              {d.choose}
            </option>
            {d.sizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
          <svg className={s.selectCaret} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Field>

      <fieldset className={s.fieldset} aria-describedby={id("interest-hint")}>
        <legend className={s.label}>{d.fields.interest}</legend>
        <p id={id("interest-hint")} className={s.hint}>
          {d.interestHint}
        </p>
        <div className={s.chips}>
          {d.interests.map((interest) => {
            const on = v.interests.includes(interest);
            return (
              <button key={interest} type="button" className={`glass glass-press ${s.chip}`} aria-pressed={on} onClick={() => toggle(interest)}>
                <span className={s.chipMark} aria-hidden="true" />
                {interest}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field id={id("message")} label={d.fields.message} reserve={0}>
        <textarea id={id("message")} className={`${s.input} ${s.textarea}`} name="message" rows={4} value={v.message} onChange={set("message")} />
      </Field>

      <div className={s.submitRow}>
        <button type="submit" className={s.submit} disabled={pending} aria-disabled={pending || undefined}>
          <span>{pending ? d.sending : d.submit}</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 3.5 9.5 8 5 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p id={id("privacy")} className={s.privacy}>
          {d.privacy}
        </p>
      </div>

      <div className={s.status} role="status" aria-live="polite" data-kind={status.kind}>
        {status.kind === "invalid" && <p>{d.review}</p>}
        {status.kind === "pending" && <p>{d.sending}</p>}
        {status.kind === "sent" && <p>{d.sent}</p>}
        {status.kind === "mailto" && (
          <p>
            {d.mailto} {d.mailFallback} <a href={status.href}>{DEMO_EMAIL}</a>.
          </p>
        )}
        {status.kind === "error" && (
          <p>
            {d.error} <a href={`mailto:${DEMO_EMAIL}`}>{DEMO_EMAIL}</a>.
          </p>
        )}
      </div>
    </form>
  );
}

/** The last step of the journey, quietly: four chevrons, the fourth one lit. */
function Horizon() {
  const d = useCopy().demo;
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const marks = el.querySelectorAll<HTMLElement>(`.${s.hMark}`);
    if (reduced) {
      gsap.set(marks, { "--lit": 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        marks,
        { "--lit": 0 },
        { "--lit": 1, stagger: 0.25, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "top 62%", scrub: 0.5 } },
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <figure className={s.horizonFig}>
      <ol ref={ref} className={s.horizon} role="list" aria-hidden="true">
        {d.horizon.map((h, i) => (
          <li key={h} style={{ ["--tone" as string]: `var(--stage-${i + 1})` }} data-last={i === 3 ? "" : undefined}>
            <span className={s.hMark} />
            <span className={s.hLabel}>{h}</span>
          </li>
        ))}
      </ol>
      <figcaption className={s.horizonCaption}>{d.horizonCaption}</figcaption>
    </figure>
  );
}

export function Demo({ page = false }: { page?: boolean }) {
  const t = useCopy();
  const d = t.demo;
  const c = t.pages.contact;
  const H = page ? "h1" : "h2";
  return (
    <section id="demo" data-dock="demo" className={`section ${s.demo} ${page ? s.page : ""}`} aria-labelledby="demo-title">
      <div className={`wrap ${s.grid}`}>
        <div className={s.side}>
          <H id="demo-title" className={`${page ? "display" : "h2"} ${s.title}`}>
            {page ? c.title : d.title}
          </H>
          <p className={`lede ${s.lede}`}>{page ? c.lede : d.body}</p>
          <Horizon />
          {page && (
            <div className={s.next}>
              <h2 className={s.nextTitle}>{c.nextTitle}</h2>
              <ol className={s.nextList} role="list">
                {c.next.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
            </div>
          )}
          <p className={s.signIn}>
            {d.signIn}{" "}
            <a href={appHref("/login")} className={s.signInLink}>
              {d.signInLink}
            </a>
          </p>
        </div>
        <div className={s.formCol}>
          <DemoForm />
        </div>
      </div>
    </section>
  );
}
