import { extractOffice } from "@/domain/platform/docx";
import { extractResumeText } from "@/domain/screen";

export async function readResume(mime: string, bytes: Uint8Array, filename = ""): Promise<{ text: string | null; readable: boolean; note: string }> {
  const name = filename.toLowerCase();
  if (name.endsWith(".doc") && !name.endsWith(".docx")) {
    return { text: null, readable: false, note: "Legacy Word .doc is stored and not extracted. Convert it to DOCX or PDF." };
  }
  if (mime.includes("wordprocessingml") || name.endsWith(".docx")) {
    const extracted = await extractOffice(filename || "resume.docx", bytes);
    if (extracted.status !== "OK") return { text: null, readable: false, note: extracted.reason };
    const readable = extracted.text.trim().length >= 40;
    return { text: readable ? extracted.text : null, readable, note: extracted.reason };
  }
  const plain = extractResumeText(mime, bytes);
  return { text: plain.readable ? plain.text : plain.text, readable: plain.readable, note: plain.note };
}
