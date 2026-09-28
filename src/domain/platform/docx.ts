export type ExtractResult = {
  status: "OK" | "UNREADABLE" | "REJECTED" | "EMPTY";
  confidence: "HIGH" | "LOW" | "NONE";
  text: string;
  reason: string;
};

const MAX_UNCOMPRESSED = 1_500_000;
const MAX_ENTRIES = 40;

function crc32(bytes: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < bytes.length; i += 1) {
    c ^= bytes[i]!;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function u16(buf: Uint8Array, offset: number): number {
  return buf[offset]! | (buf[offset + 1]! << 8);
}
function u32(buf: Uint8Array, offset: number): number {
  return (buf[offset]! | (buf[offset + 1]! << 8) | (buf[offset + 2]! << 16) | (buf[offset + 3]! << 24)) >>> 0;
}

type ZipEntry = { name: string; data: Uint8Array };

async function unzip(buf: Uint8Array): Promise<ZipEntry[] | { error: string }> {
  const { inflateRawSync } = await import("node:zlib");
  const entries: ZipEntry[] = [];
  let offset = 0;
  let total = 0;
  while (offset + 30 <= buf.length) {
    if (u32(buf, offset) !== 0x04034b50) break;
    const method = u16(buf, offset + 8);
    const compSize = u32(buf, offset + 18);
    const nameLen = u16(buf, offset + 26);
    const extraLen = u16(buf, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLen + extraLen;
    if (dataStart + compSize > buf.length) return { error: "The file ended early." };
    const name = new TextDecoder().decode(buf.slice(nameStart, nameStart + nameLen));
    const compressed = buf.slice(dataStart, dataStart + compSize);
    let data: Uint8Array;
    if (method === 0) data = compressed;
    else if (method === 8) {
      try {
        data = inflateRawSync(compressed);
      } catch {
        return { error: "A compressed entry could not be read." };
      }
    } else return { error: "This archive uses an unsupported compression method." };
    total += data.length;
    if (total > MAX_UNCOMPRESSED) return { error: "The document is too large to extract." };
    entries.push({ name, data });
    if (entries.length > MAX_ENTRIES) return { error: "The document has too many parts." };
    offset = dataStart + compSize;
  }
  return entries;
}

function xmlText(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sniffResume(filename: string, bytes: Uint8Array): { ok: true; kind: string } | { ok: false; reason: string } {
  const name = filename.toLowerCase();
  const ext = name.endsWith(".docx") ? "docx" : name.split(".").pop() ?? "";
  const pdf = bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const png = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const zip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  const ole = bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (ext === "doc" || (ole && ext !== "docx")) {
    return { ok: false, reason: "Legacy Word .doc is not extracted. Save the resume as DOCX or PDF. The upload was not opened." };
  }
  if (ext === "pdf" && !pdf) return { ok: false, reason: "This file does not look like a PDF." };
  if (ext === "png" && !png) return { ok: false, reason: "This file does not look like a PNG." };
  if ((ext === "jpg" || ext === "jpeg") && !jpeg) return { ok: false, reason: "This file does not look like a JPEG." };
  if (ext === "docx" && ole) return { ok: false, reason: "This is a legacy Word file, not a DOCX. Text was not extracted." };
  if (ext === "docx" && !zip) return { ok: false, reason: "This file does not look like a DOCX. A scanned or malformed document was not indexed." };
  if ((ext === "txt" || ext === "csv") && (pdf || png || jpeg || zip || ole)) {
    return { ok: false, reason: "The file contents do not match a text resume." };
  }
  return { ok: true, kind: ext };
}

export async function extractOffice(filename: string, bytes: Uint8Array): Promise<ExtractResult> {
  const lower = filename.toLowerCase();
  if (bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return {
      status: "REJECTED",
      confidence: "NONE",
      text: "",
      reason: "Legacy Word files are not extracted. Save the resume as DOCX or PDF and upload that. The original was kept.",
    };
  }
  if (!lower.endsWith(".docx") && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    return { status: "REJECTED", confidence: "NONE", text: "", reason: "This is not a DOCX file." };
  }
  const opened = await unzip(bytes);
  if ("error" in opened) return { status: "UNREADABLE", confidence: "NONE", text: "", reason: opened.error };
  const doc = opened.find((entry) => entry.name === "word/document.xml");
  if (!doc) return { status: "UNREADABLE", confidence: "NONE", text: "", reason: "The DOCX has no document text." };
  const text = xmlText(new TextDecoder().decode(doc.data));
  if (!text) return { status: "EMPTY", confidence: "LOW", text: "", reason: "No words were found. A scanned resume needs a person to read it." };
  return { status: "OK", confidence: "HIGH", text: text.slice(0, 50_000), reason: "Text was taken from the DOCX. The original file stays attached." };
}

export { crc32 };
