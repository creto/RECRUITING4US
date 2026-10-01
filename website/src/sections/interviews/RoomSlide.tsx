import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useCopy } from "@/content/i18n";
import { LinkGlyph, Refresh } from "./glyphs";
import s from "./Room.module.css";

type Line = { code: string; added?: boolean };

const BASE: Line[] = [
  { code: "function masFrecuente(items) {" },
  { code: "  const cuenta = new Map();" },
  { code: "  for (const x of items) {" },
  { code: "    cuenta.set(x, (cuenta.get(x) ?? 0) + 1);" },
  { code: "  }" },
  { code: "  let mejor = null;" },
  { code: "  let max = 0;" },
  { code: "  for (const [x, n] of cuenta) {" },
  { code: "    if (n > max) [mejor, max] = [x, n];" },
  { code: "  }" },
  { code: "  return mejor;" },
  { code: "}" },
];

/** Revision 15, saved by the candidate while you looked at 14. */
const NEWER: Line[] = [
  BASE[0],
  { code: "  if (items.length === 0) return null;", added: true },
  ...BASE.slice(1),
];

const KEYWORDS = /\b(function|const|let|for|of|if|return|new|null)\b/g;

function Code({ text }: { text: string }) {
  const parts: { k: boolean; v: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(KEYWORDS)) {
    if (m.index! > last) parts.push({ k: false, v: text.slice(last, m.index) });
    parts.push({ k: true, v: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ k: false, v: text.slice(last) });
  return (
    <>
      {parts.map((p, i) =>
        p.k ? (
          <span key={i} className={s.kw}>
            {p.v}
          </span>
        ) : (
          p.v
        ),
      )}
    </>
  );
}

/**
 * Step 2: the live room. Shared code by revision with stale-save protection,
 * private notes and chat, and the external meeting link. No video tile: the
 * call happens in the team's own tool.
 */
export function RoomSlide({ active }: { active: boolean }) {
  const t = useCopy();
  const r = t.interview.room;
  const c = t.interview;
  const uid = useId();

  const [local, setLocal] = useState(14);
  const [server, setServer] = useState(14);
  const [lines, setLines] = useState<Line[]>(BASE);
  const [stale, setStale] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState(r.messages);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const simulated = useRef(false);

  // Once the slide is on screen, the candidate saves revision 15.
  useEffect(() => {
    if (!active || simulated.current) return;
    const id = window.setTimeout(() => {
      simulated.current = true;
      setServer((v) => Math.max(v, 15));
    }, 1400);
    return () => window.clearTimeout(id);
  }, [active]);

  const save = () => {
    setSaved(null);
    if (server > local) {
      setStale(true);
      return;
    }
    const next = local + 1;
    setLocal(next);
    setServer(next);
    setSaved(next);
    setLines((ls) => ls.map((l) => ({ ...l, added: false })));
  };

  const reload = () => {
    setLocal(server);
    setLines(NEWER);
    setStale(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(`https://${r.link}`);
    } catch {
      /* clipboard may be unavailable; the label still confirms the intent */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { who: r.messages[0].who, text }]);
    setDraft("");
  };

  const tabs = [c.privateNotes, r.chat];
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (tab + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setTab(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  const newer = server > local;

  return (
    <div className={s.room}>
      <div className={s.meeting}>
        <span className={s.meetIcon}>
          <LinkGlyph />
        </span>
        <div className={s.meetText}>
          <p className={s.meetLabel}>
            {c.meetingLink}, <span className={s.meetHint}>{c.meetingHint.toLowerCase()}</span>
          </p>
          <p className={s.meetUrl}>{r.link}</p>
        </div>
        <button type="button" className={`glass glass-press ${s.copy}`} onClick={copy}>
          {copied ? r.copied : r.copy}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? r.copied : ""}
        </span>
      </div>

      <div className={s.split}>
        <section className={s.editor} aria-label={`${r.file}, ${c.roomCode} ${local}`}>
          <header className={s.edHead}>
            <span className={s.file}>{r.file}</span>
            <span className={s.badge} key={local}>
              {c.roomCode} {local}
            </span>
            {newer && (
              <span className={s.pulse} role="status">
                <i aria-hidden="true" />
                {r.newer} {server}
              </span>
            )}
          </header>

          <div className={s.codeWrap}>
            {stale && (
              <div className={s.stale} role="alert">
                <p>{c.roomStale}</p>
                <button type="button" className={s.reload} onClick={reload}>
                  <Refresh />
                  {r.reload}
                </button>
              </div>
            )}

            <pre className={s.code} data-no-drag="">
              <code>
                {lines.map((l, i) => (
                  <span key={`${local}-${i}`} className={s.line} data-added={l.added ? "" : undefined}>
                    <span className={s.ln} aria-hidden="true">
                      {i + 1}
                    </span>
                    <Code text={l.code} />
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <footer className={s.edFoot}>
            <p className={s.typing}>
              <span className={s.dots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {r.typing}
            </p>
            <p className={s.savedMsg} aria-live="polite">
              {saved !== null ? `${r.saved} ${saved}` : ""}
            </p>
            <button type="button" className={s.save} onClick={save}>
              {r.save}
            </button>
          </footer>
        </section>

        <section className={s.side} aria-label={r.panels}>
          <div className={`glass ${s.tabs}`} role="tablist" aria-label={r.panels}>
            {tabs.map((name, i) => (
              <button
                key={name}
                id={`${uid}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={tab === i}
                aria-controls={`${uid}-panel-${i}`}
                tabIndex={tab === i ? 0 : -1}
                className={s.tab}
                onClick={() => setTab(i)}
                onKeyDown={onTabKey}
              >
                {name}
              </button>
            ))}
            <span className={s.tabInk} style={{ transform: `translateX(${tab * 100}%)` }} aria-hidden="true" />
          </div>

          <div id={`${uid}-panel-0`} role="tabpanel" aria-labelledby={`${uid}-tab-0`} hidden={tab !== 0} className={s.panel}>
            <label className={s.noteLabel} htmlFor={`${uid}-notes`}>
              {r.notesHint}
            </label>
            <textarea id={`${uid}-notes`} className={s.notes} defaultValue={r.notes} rows={6} />
          </div>

          <div id={`${uid}-panel-1`} role="tabpanel" aria-labelledby={`${uid}-tab-1`} hidden={tab !== 1} className={s.panel}>
            <ol className={s.msgs} role="list" aria-live="polite">
              {messages.map((m, i) => (
                <li key={i} data-me={m.who === r.messages[0].who ? "" : undefined}>
                  <span className={s.who}>{m.who}</span>
                  <span className={s.bubble}>{m.text}</span>
                </li>
              ))}
            </ol>
            <form className={s.chatForm} onSubmit={send}>
              <label htmlFor={`${uid}-chat`} className="sr-only">
                {r.chatLabel}
              </label>
              <input id={`${uid}-chat`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={r.chatLabel} autoComplete="off" />
              <button type="submit" className={s.send}>
                {r.send}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
