"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

export function Chat({
  clientId,
  meRole,
  otherName,
}: {
  clientId: string;
  meRole: "trainer" | "client";
  otherName: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("id, sender_role, body, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setMessages(data as Msg[]);
      });

    const channel = supabase
      .channel(`messages-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ client_id: clientId, sender_role: meRole, body })
      .select("id, sender_role, body, created_at")
      .single();
    setSending(false);
    if (error) {
      setText(body);
      alert("No se pudo enviar el mensaje. Probá de nuevo.");
      return;
    }
    if (data) {
      setMessages((prev) =>
        prev.some((x) => x.id === (data as Msg).id)
          ? prev
          : [...prev, data as Msg]
      );
    }
  }

  return (
    <div className="chat">
      <div className="chat-msgs">
        {messages.length === 0 && (
          <div className="chat-empty">
            Todavía no hay mensajes con {otherName}. ¡Escribí el primero! 👋
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.sender_role === meRole ? "me" : "them"}`}
          >
            <div className="bubble-body">{m.body}</div>
            <div className="bubble-time">
              {new Date(m.created_at).toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje…"
          autoComplete="off"
        />
        <button className="btn btn-primary" disabled={sending}>
          Enviar
        </button>
      </form>
    </div>
  );
}
