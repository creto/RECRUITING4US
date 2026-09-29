import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bold, Italic, Link2, List, ListOrdered, ImagePlus, ContactRound } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  contactBlockHtml,
  editorIsEmpty,
  plainToEditorHtml,
  sanitizeMailHtml,
  type ContactBlock,
} from "@/domain/mail-html";
import { Button, inputClass, useCompanyWorkspace } from "@/components/talent/kit";

const PHONE_KEY = "recruit4us.mail.contact.phone";

function readPhone(): string {
  try {
    return localStorage.getItem(PHONE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writePhone(value: string) {
  try {
    localStorage.setItem(PHONE_KEY, value);
  } catch {
    /* ignore */
  }
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-accent"
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export function RichMailEditor({
  value,
  onChange,
  required = false,
  minHeightClass = "min-h-28",
  contact,
}: {
  value: string;
  onChange: (html: string) => void;
  required?: boolean;
  minHeightClass?: string;
  contact?: ContactBlock;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const user = useCurrentUser();
  const workspace = useCompanyWorkspace();
  const companyName = workspace.data?.company.name ?? "";
  const [phone, setPhone] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const seeded = useRef(false);

  useEffect(() => {
    setPhone(readPhone());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = plainToEditorHtml(value);
    if (!seeded.current) {
      el.innerHTML = next;
      seeded.current = true;
      if (next !== value) onChange(next);
      return;
    }
    if (value === "" && el.innerHTML !== "") {
      el.innerHTML = "";
      return;
    }
    if (el.innerHTML !== value && editorIsEmpty(el.innerHTML) && !editorIsEmpty(value)) {
      el.innerHTML = next;
    }
  }, [value, onChange]);

  function emit() {
    onChange(ref.current?.innerHTML ?? "");
  }

  function run(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  function insertHtml(html: string) {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
  }

  function insertContact() {
    insertHtml(
      contactBlockHtml({
        name: contact?.name ?? user?.displayName ?? "",
        email: contact?.email ?? user?.primaryEmail ?? "",
        phone: contact?.phone ?? phone,
        company: contact?.company ?? companyName,
      }),
    );
  }

  function applyLink() {
    const href = linkUrl.trim();
    if (!/^(https?:|mailto:)/i.test(href)) return;
    run("createLink", href);
    setLinkOpen(false);
    setLinkUrl("https://");
  }

  function applyImage() {
    const src = imageUrl.trim();
    if (!/^https:\/\//i.test(src)) return;
    insertHtml(`<img src="${src.replace(/"/g, "&quot;")}" alt="" style="max-width:100%;height:auto">`);
    setImageOpen(false);
    setImageUrl("");
  }

  const empty = editorIsEmpty(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <ToolBtn label="Bold" onClick={() => run("bold")}><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Italic" onClick={() => run("italic")}><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Bullet list" onClick={() => run("insertUnorderedList")}><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Numbered list" onClick={() => run("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Link" onClick={() => { setLinkOpen((v) => !v); setImageOpen(false); }}><Link2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Insert image" onClick={() => { setImageOpen((v) => !v); setLinkOpen(false); }}><ImagePlus className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Insert contact block" onClick={insertContact}><ContactRound className="h-4 w-4" /></ToolBtn>
      </div>
      {linkOpen ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-2">
          <input
            className={inputClass}
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https:// or mailto:"
            aria-label="Link URL"
          />
          <Button type="button" variant="secondary" onClick={applyLink}>Add link</Button>
        </div>
      ) : null}
      {imageOpen ? (
        <div className="space-y-2 rounded-2xl border border-line bg-white p-2">
          <input
            className={inputClass}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https:// image URL"
            aria-label="Image URL"
          />
          {/^https:\/\//i.test(imageUrl.trim()) ? (
            <img src={imageUrl.trim()} alt="Preview" className="max-h-40 rounded-xl border border-line object-contain" />
          ) : null}
          <Button type="button" variant="secondary" onClick={applyImage}>Insert image</Button>
          <p className="text-xs text-muted">Only https image URLs are kept when the message is sent.</p>
        </div>
      ) : null}
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        contentEditable
        suppressContentEditableWarning
        className={`${inputClass} ${minHeightClass} py-2 whitespace-pre-wrap [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-link [&_a]:underline`}
        onInput={emit}
        onBlur={emit}
      />
      <label className="block min-w-[12rem] space-y-1 text-xs text-muted">
        <span>Phone for contact block (saved on this device)</span>
        <input
          className={inputClass}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            writePhone(event.target.value);
          }}
          placeholder="+1 …"
        />
      </label>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={empty ? "" : "ok"}
          onChange={() => undefined}
          required
        />
      ) : null}
    </div>
  );
}

/** Render stored mail safely: HTML when present, otherwise plain text. */
export function SafeMailBody({ body, className = "mt-2 text-sm" }: { body: string; className?: string }) {
  const raw = String(body ?? "");
  if (/<\/?[a-z][\s\S]*>/i.test(raw)) {
    return (
      <div
        className={`${className} [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-link [&_a]:underline`}
        dangerouslySetInnerHTML={{ __html: sanitizeMailHtml(raw) }}
      />
    );
  }
  return <p className={`${className} whitespace-pre-wrap`}>{raw}</p>;
}
