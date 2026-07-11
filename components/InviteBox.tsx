"use client";

import { useEffect, useState } from "react";

export function InviteBox({
  token,
  phone,
  clientName,
}: {
  token: string;
  phone?: string | null;
  clientName?: string;
}) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/invitacion/${token}`);
  }, [token]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const waHref = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `¡Hola${clientName ? " " + clientName.split(" ")[0] : ""}! Te dejo tu acceso a TrainerFlow para ver tu plan y estar en contacto: ${link}`
      )}`
    : null;

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 10 }}>
        Compartí este link con el cliente para que active su acceso y vea su
        plan.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1,
            minWidth: 220,
            fontSize: 13,
            padding: "10px 12px",
            border: "1.5px solid var(--line)",
            borderRadius: 10,
            background: "#fff",
            color: "var(--ink-soft)",
          }}
        />
        <button className="btn btn-ghost btn-sm" onClick={copy} type="button">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
        {waHref && (
          <a
            className="btn btn-primary btn-sm"
            href={waHref}
            target="_blank"
            rel="noreferrer"
            style={{ width: "auto" }}
          >
            Enviar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
