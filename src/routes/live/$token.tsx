import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { admitLive, endLive, livePackage, readLive, runLiveSample, syncLive } from "@/server/talent.functions";
import { diffEdit } from "@/domain/platform/collab";
import { useCandidateSignals } from "@/components/talent/live-signals";
import { ProblemPrompt } from "@/components/talent/code-block";
import { Alert, Button, Gate, Loading, PageTitle, useAuthed, when } from "@/components/talent/kit";

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
  const [follow, setFollow] = useState(true);
  const baseRef = useRef<{ revision: number; source: string } | null>(null);
  const sourceRef = useRef("");
  const sending = useRef(false);
  const reloadRef = useRef(state.reload);
  reloadRef.current = state.reload;
  const room = state.data;
  const watching = room?.role === "INTERVIEWER" && follow;
  const text = source ?? room?.source ?? "";
  sourceRef.current = text;
  const watchingRef = useRef(watching);
  watchingRef.current = watching;
  useCandidateSignals(token, room?.role === "CANDIDATE" && Boolean(room?.admitted));

  useEffect(() => {
    if (!room?.admitted || baseRef.current) return;
    baseRef.current = { revision: room.revision ?? 0, source: room.source ?? "" };
  }, [room?.admitted, room?.revision, room?.source]);

  useEffect(() => {
    if (room?.role === "CANDIDATE") setFollow(false);
  }, [room?.role]);

  useEffect(() => {
    if (!room?.admitted) return;
    const timer = setInterval(() => {
      readLive({ data: { token } }).then((next) => {
        setLink(null);
        const base = baseRef.current;
        const local = sourceRef.current;
        const dirty = !watchingRef.current && base ? local !== base.source : false;
        if (!dirty) {
          setSource(next.source);
          baseRef.current = { revision: next.revision, source: next.source };
          reloadRef.current();
        } else if (base && !sending.current) {
          const edit = diffEdit(base.source, local);
          sending.current = true;
          const oversized = edit.insert.length > 8000;
          syncLive({
            data: {
              token,
              baseRevision: base.revision,
              source: local,
              boardRevision: next.boardRevision ?? 0,
              useEdit: !oversized,
              editAt: edit.at,
              editDel: edit.del,
              editInsert: oversized ? "" : edit.insert,
              cursor: local.length,
            },
          }).then((row) => {
            if (!watchingRef.current) {
              setSource(row.source);
              baseRef.current = { revision: row.revision, source: row.source };
            }
            if (row.conflict) setError(row.conflict);
          }).catch(() => setLink("Reconnecting. Your text stays on this page."))
            .finally(() => { sending.current = false; });
        }
      }).catch(() => setLink("Reconnecting. Your text stays on this page."));
    }, 800);
    return () => clearInterval(timer);
  }, [token, room?.admitted]);

  function sendEdit(next: string, extra: { chat?: string; fileName?: string; reveal?: boolean } = {}) {
    const known = baseRef.current ?? { revision: room?.revision ?? 0, source: room?.source ?? "" };
    const edit = diffEdit(known.source, next);
    const oversized = edit.insert.length > 8000;
    sending.current = true;
    syncLive({
      data: {
        token,
        baseRevision: known.revision,
        source: next,
        boardRevision: room?.boardRevision ?? 0,
        useEdit: known.source !== next && !oversized,
        editAt: edit.at,
        editDel: edit.del,
        editInsert: oversized ? "" : edit.insert,
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
        {room?.role === "CANDIDATE" ? <p className="mb-3 text-sm">The interviewer sees this editor as you type. This page notes how many screens are connected, when you leave the tab, and the text you copy or paste. It does not record the camera, and these notes do not change a score.</p> : null}
        {room?.role === "INTERVIEWER" ? <p className="mb-3 text-sm">You are watching the shared pad. The candidate’s typing shows up here. Screen, tab, and clipboard notes stay with you. They do not change a score.</p> : null}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-3"><ProblemPrompt prompt={String(room?.prompt ?? "")} compact /></div>
            <p className="mb-2 text-xs text-muted">Active file {room?.activeFile || "solve.js"}. The run uses solve.js in the secure judge. A timeout is not a score. A meeting link is an outside call.</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {(room?.files ?? []).map((file: { name: string }) => (
                <Button key={file.name} type="button" variant={file.name === room?.activeFile ? "primary" : "secondary"} onClick={() => sendEdit(text, { fileName: file.name })}>{file.name}</Button>
              ))}
            </div>
            <textarea id="shared-editor" className="min-h-80 w-full rounded-md border border-line bg-bg p-3 font-mono text-sm" value={text} onChange={(event) => { if (watching) return; setSource(event.target.value); sourceRef.current = event.target.value; }} readOnly={watching} disabled={!room?.admitted} spellCheck={false} aria-label="Shared editor" />
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
            {room?.role === "INTERVIEWER" ? (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={follow} onChange={(event) => setFollow(event.target.checked)} />
                Watch only
              </label>
            ) : null}
            <ul className="mt-2 space-y-1 text-sm">
              {(room?.people ?? []).map((person: { role: string; name: string; admitted: boolean; cursor_at?: number }) => (
                <li key={`${person.role}-${person.name}`} className="flex items-center justify-between gap-2">
                  <span>{person.name} · {person.role}{person.admitted ? "" : " · waiting"}{typeof person.cursor_at === "number" ? ` · cursor ${person.cursor_at}` : ""}</span>
                  {room?.role === "INTERVIEWER" && !person.admitted ? <Button type="button" variant="secondary" onClick={() => admitLive({ data: { token, name: person.name } }).then(() => setError(`${person.name} admitted.`))}>Admit</Button> : null}
                </li>
              ))}
            </ul>
            {room?.role === "INTERVIEWER" ? (
              <>
                <h2 className="mt-4 text-xl">What they are doing</h2>
                <p className="mt-1 text-xs text-muted">{(room.signals ?? []).find((item: { kind: string }) => item.kind === "SCREENS")?.label ?? "Waiting for a screen note."}</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                  {(room.signals ?? []).filter((item: { kind: string }) => item.kind !== "SCREENS").length === 0 ? <li className="text-muted">No tab or clipboard notes yet.</li> : null}
                  {(room.signals ?? []).filter((item: { kind: string; label: string; at: string }) => item.kind !== "SCREENS").map((item: { kind: string; label: string; at: string }) => (
                    <li key={`${item.at}-${item.label}`}><span className="text-muted">{when(item.at)}</span> {item.label}</li>
                  ))}
                </ul>
              </>
            ) : null}
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
