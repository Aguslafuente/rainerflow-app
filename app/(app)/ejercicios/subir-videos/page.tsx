"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Ex = { id: string; name: string; video_url: string | null };
type Row = {
  file: File;
  exerciseId: string;
  status: "pendiente" | "subiendo" | "ok" | "error";
  error?: string;
};

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function SubirVideosPage() {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Ex[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("exercises")
      .select("id, name, video_url")
      .order("name")
      .then(({ data }) => setExercises((data ?? []) as Ex[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of exercises) m.set(normalize(e.name), e.id);
    return m;
  }, [exercises]);

  function matchExercise(filename: string): string {
    const n = normalize(filename);
    if (normMap.has(n)) return normMap.get(n)!;
    // includes match
    let best = "";
    let bestLen = 0;
    for (const e of exercises) {
      const en = normalize(e.name);
      if ((n.includes(en) || en.includes(n)) && en.length > bestLen) {
        best = e.id;
        bestLen = en.length;
      }
    }
    return best;
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    const newRows: Row[] = Array.from(files)
      .filter((f) => f.type.startsWith("video/"))
      .map((file) => ({
        file,
        exerciseId: matchExercise(file.name),
        status: "pendiente" as const,
      }));
    setRows(newRows);
    setDone(false);
  }

  async function uploadAll() {
    setBusy(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      const r = updated[i];
      if (!r.exerciseId) continue;
      updated[i] = { ...r, status: "subiendo" };
      setRows([...updated]);
      try {
        const path = `${r.exerciseId}.mp4`;
        const { error: upErr } = await supabase.storage
          .from("exercise-videos")
          .upload(path, r.file, {
            upsert: true,
            contentType: r.file.type || "video/mp4",
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("exercise-videos")
          .getPublicUrl(path);
        const url = `${pub.publicUrl}?t=${Date.now()}`;
        const { error: dbErr } = await supabase
          .from("exercises")
          .update({ video_url: url })
          .eq("id", r.exerciseId);
        if (dbErr) throw dbErr;
        updated[i] = { ...r, status: "ok" };
      } catch (e: any) {
        updated[i] = { ...r, status: "error", error: e?.message ?? "Error" };
      }
      setRows([...updated]);
    }
    setBusy(false);
    setDone(true);
  }

  const okCount = rows.filter((r) => r.status === "ok").length;
  const matchedCount = rows.filter((r) => r.exerciseId).length;

  return (
    <>
      <Link href="/ejercicios" className="back-link">
        ← Volver a ejercicios
      </Link>
      <div className="page-head">
        <div>
          <h1>Subir videos</h1>
          <div className="sub">
            Arrastrá o elegí todos los MP4 juntos. El sistema los vincula por
            nombre; revisá y ajustá lo que haga falta.
          </div>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: "100%", marginBottom: 20 }}>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          style={{ fontSize: 14 }}
        />
        {rows.length > 0 && (
          <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 10 }}>
            {rows.length} archivos · {matchedCount} vinculados automáticamente.
            {matchedCount < rows.length &&
              " Elegí el ejercicio en los que quedaron sin vincular."}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            Archivos
            <button
              className="btn btn-primary btn-sm"
              style={{ width: "auto" }}
              onClick={uploadAll}
              disabled={busy || matchedCount === 0}
            >
              {busy ? "Subiendo…" : `Subir y vincular (${matchedCount})`}
            </button>
          </div>
          <table className="list">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Ejercicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.file.name}</td>
                  <td>
                    <select
                      value={r.exerciseId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, exerciseId: v } : x
                          )
                        );
                      }}
                      style={{
                        width: "100%",
                        maxWidth: 320,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        fontSize: 13,
                      }}
                    >
                      <option value="">— elegí —</option>
                      {exercises.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {r.status === "ok" && (
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>
                        ✓ Subido
                      </span>
                    )}
                    {r.status === "subiendo" && (
                      <span style={{ color: "var(--violet)" }}>Subiendo…</span>
                    )}
                    {r.status === "error" && (
                      <span style={{ color: "var(--red)" }} title={r.error}>
                        Error
                      </span>
                    )}
                    {r.status === "pendiente" && (
                      <span style={{ color: "var(--gray-light)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {done && (
        <div className="notice" style={{ marginTop: 16 }}>
          Listo: {okCount} de {rows.length} videos subidos y vinculados. Podés
          verlos en la biblioteca de ejercicios y en las rutinas.
        </div>
      )}
    </>
  );
}
