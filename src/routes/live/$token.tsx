import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { admitLive, endLive, livePackage, readLive, runLiveSample, syncLive } from "@/server/talent.functions";
import { diffEdit } from "@/domain/platform/collab";
import { Alert, Button, Gate, Loading, PageTitle, useAuthed } from "@/components/talent/kit";

export const Route = createFileRoute("/live/$token")({ component: LiveRoom });

function LiveRoom() {
  const { token } = Route.useParams();
  const state = useAuthed(() => readLive({ data: { token } }), [token]);
  const [source, setSource] = useState<string | null>(null);
  const [chat, setChat] = useState("");
  const [privateNote, setPrivateNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [packet, setPacket] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const baseRef = useRef<{ revision: number; source: string } | null>(null);
  const sourceRef = useRef("");
  const sending = useRef(false);
  const room = state.data;
  const text = source ?? room?.source ?? "";
  sourceRef.current = text;

  useEffect(() => {
    if (!room?.admitted) return;
    const timer = setInterval(() => {
      readLive({ data: { token } }).then((next) => {
        setLink(null);
        const base = baseRef.current;
        const local = sourceRef.current;
        const dirty = base ? local !== base.source : false;
        if (!dirty) {
          setSource(next.source);
          baseRef.current = { revision: next.revision, source: next.source };
          state.reload();
        } else if (base && next.revision !== base.revision && !sending.current) {
          const edit = diffEdit(base.source, local);
          sending.current = true;
          syncLive({
            data: {
              token,
              baseRevision: base.revision,
              source: local,
              boardRevision: next.boardRevision ?? 0,
              useEdit: true,
              editAt: edit.at,
              editDel: edit.del,
              editInsert: edit.insert,
              cursor: local.length,
            },
          }).then((row) => {
            setSource(row.source);
            baseRef.current = { revision: row.revision, source: row.source };
            if (row.conflict) setError(row.conflict);
          }).catch(() => setLink("Reconnecting. Your text stays on this page."))
            .finally(() => { sending.current = false; });
        }
      }).catch(() => setLink("Reconnecting. Your text stays on this page."));
    }, 1500);
    return () => clearInterval(timer);
  }, [token, room?.admitted]);

  function sendEdit(next: string, extra: { chat?: string; fileName?: string; reveal?: boolean } = {}) {
    const known = baseRef.current ?? { revision: room?.revision ?? 0, source: room?.source ?? "" };
    const edit = diffEdit(known.source, next);
    sending.current = true;
    syncLive({
      data: {
        token,
        baseRevision: known.revision,
        source: next,
        boardRevision: room?.boardRevision ?? 0,
        useEdit: known.source !== next,
        editAt: edit.at,
        editDel: edit.del,
        editInsert: edit.insert,
        cursor: next.length,
        chat: extra.chat ?? "",
        privateNote,
        reveal: extra.reveal,
        fileName: extra.fileName,
      },
    }).then((row) => {
      setSource(row.source);
      baseRef.current = { revision: row.revision, source: row.source };
      if (extra.chat) setChat("");
      if (row.conflict) setError(row.conflict);
      else setError(null);
      state.reload();
    }).catch((err: Error) => setError(err.message))
      .finally(() => { sending.current = false; });
  }

  return (
    <Gate pending={state.isPending} signedOut={state.signedOut}>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <PageTitle title={room?.title || "Interview room"} lede={room?.meetingNote} />
        {state.loading ? <Loading /> : null}
        {state.error ? <Alert>{state.error}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
        {link ? <p className="mb-3 text-sm">{link}</p> : null}
        {room && !room.admitted ? <p className="mb-3 text-sm">You are in the waiting room. An interviewer has to admit you.</p> : null}
        {room?.promptHidden ? <p className="mb-3 text-sm">The question stays hidden until an interviewer reveals it.</p> : null}
        {room?.meetingUrl ? <p className="mb-3 text-sm">Outside meeting link: <a className="underline" href={room.meetingUrl}>{room.meetingUrl}</a>. This is not a video call hosted here.</p> : null}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="mb-2 whitespace-pre-wrap text-sm">{room?.prompt}</p>
            <p className="mb-2 text-xs text-muted">Active file {room?.activeFile || "solve.js"}. The run uses solve.js in the secure judge. A timeout is not a score. A meeting link is an outside call.</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {(room?.files ?? []).map((file: { name: string }) => (
                <Button key={file.name} type="button" variant={file.name === room?.activeFile ? "primary" : "secondary"} onClick={() => sendEdit(text, { fileName: file.name })}>{file.name}</Button>
              ))}
            </div>
            <textarea id="shared-editor" className="min-h-80 w-full rounded-md border border-line bg-bg p-3 font-mono text-sm" value={text} onChange={(event) => { setSource(event.target.value); sourceRef.current = event.target.value; }} disabled={!room?.admitted} spellCheck={false} aria-label="Shared editor" />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" disabled={!room?.admitted} onClick={() => sendEdit(text)}>Save</Button>
              <Button type="button" variant="secondary" onClick={() => runLiveSample({ data: { token } }).then((row) => setError(`${row.status}: ${row.detail}`)).catch((err: Error) => setError(err.message))}>Run solve.js</Button>
              <Button type="button" variant="ghost" onClick={() => readLive({ data: { token } }).then((next) => { setSource(next.source); baseRef.current = { revision: next.revision, source: next.source }; })}>Reload</Button>
              {room?.role === "INTERVIEWER" ? <Button type="button" variant="secondary" onClick={() => sendEdit(text, { reveal: true })}>Reveal question</Button> : null}
              {room?.role === "INTERVIEWER" ? (
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (fileName.trim()) sendEdit(text, { fileName: fileName.trim() }); }}>
                  <input className="rounded-md border border-line px-2 text-sm" aria-label="New file" value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="util.js" />
                  <Button type="submit" variant="secondary">Add file</Button>
                </form>
              ) : null}
              {room?.role === "INTERVIEWER" ? <Button type="button" variant="secondary" onClick={() => livePackage({ data: { token } }).then((row) => setPacket(`${row.note} Revision ${row.revision}. Files: ${(row.files ?? []).map((file: { name: string }) => file.name).join(", ")}`)).catch((err: Error) => setError(err.message))}>Review package</Button> : null}
              {room?.role === "INTERVIEWER" ? <Button type="button" variant="danger" onClick={() => endLive({ data: { token } }).then(() => setError("Room ended. Scorecards are still written by each interviewer."))}>End</Button> : null}
            </div>
            {packet ? <p className="mt-2 text-sm">{packet}</p> : null}
          </div>
          <aside>
            <h2 className="text-xl">People</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(room?.people ?? []).map((person: { role: string; name: string; admitted: boolean; cursor_at?: number }) => (
                <li key={`${person.role}-${person.name}`} className="flex items-center justify-between gap-2">
                  <span>{person.name} · {person.role}{person.admitted ? "" : " · waiting"}{typeof person.cursor_at === "number" ? ` · cursor ${person.cursor_at}` : ""}</span>
                  {room?.role === "INTERVIEWER" && !person.admitted ? <Button type="button" variant="secondary" onClick={() => admitLive({ data: { token, name: person.name } }).then(() => setError(`${person.name} admitted.`))}>Admit</Button> : null}
                </li>
              ))}
            </ul>
            <h2 className="mt-4 text-xl">Chat</h2>
            <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
              {(room?.chat ?? []).map((line: { author: string; body: string; private_note?: boolean }, index: number) => <li key={`${line.author}-${index}`}><span className="font-medium">{line.author}{line.private_note ? " (private)" : ""}: </span>{line.body}</li>)}
            </ul>
            <label className="mt-2 block text-sm" htmlFor="chat">Message</label>
            <textarea id="chat" className="mt-1 min-h-16 w-full rounded-md border border-line p-2 text-sm" value={chat} onChange={(event) => setChat(event.target.value)} />
            {room?.role === "INTERVIEWER" ? <label className="mt-2 block text-sm"><input type="checkbox" checked={privateNote} onChange={(event) => setPrivateNote(event.target.checked)} /> Private interviewer note</label> : null}
            <Button type="button" className="mt-2" variant="secondary" onClick={() => sendEdit(text, { chat })}>Send</Button>
          </aside>
        </div>
      </main>
    </Gate>
  );
}
