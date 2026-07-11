"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  email: string;
}

export function TrainerProfileForm({ profile }: { profile: ProfileData }) {
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    business_name: profile.business_name || "",
    phone: profile.phone || "",
    address: profile.address || "",
    bio: profile.bio || "",
    social_instagram: profile.social_instagram || "",
    social_twitter: profile.social_twitter || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg("La imagen no puede superar 5 MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    fd.append("role", "trainer");
    fd.append("entityId", profile.id);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setAvatarUrl(data.url);
      setMsg("Foto actualizada");
    } else {
      setMsg("Error al subir la foto");
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setMsg("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        business_name: form.business_name.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        bio: form.bio.trim() || null,
        social_instagram: form.social_instagram.trim() || null,
        social_twitter: form.social_twitter.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMsg("Error al guardar");
    } else {
      setMsg("Perfil guardado");
      router.refresh();
    }
    setTimeout(() => setMsg(""), 3000);
  }

  const initials = (form.full_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form onSubmit={handleSave}>
      {/* Avatar */}
      <div className="profile-avatar-section">
        <div
          className="profile-avatar"
          onClick={() => fileRef.current?.click()}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
        >
          {!avatarUrl && <span className="profile-avatar-initials">{initials}</span>}
          <div className="profile-avatar-overlay">
            {uploading ? "..." : "Cambiar"}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatar}
        />
        <div className="profile-avatar-info">
          <div style={{ fontWeight: 600, fontSize: 18 }}>{form.full_name || "Tu nombre"}</div>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>{profile.email}</div>
        </div>
      </div>

      {/* Fields */}
      <div className="profile-fields">
        <div className="profile-field">
          <label>Nombre completo *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="profile-field">
          <label>Nombre del negocio / gym</label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            placeholder="Ej: FitStudio UY"
          />
        </div>
        <div className="profile-row">
          <div className="profile-field">
            <label>Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+598 99 123 456"
            />
          </div>
          <div className="profile-field">
            <label>Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Calle, Ciudad"
            />
          </div>
        </div>
        <div className="profile-field">
          <label>Bio / Descripción</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Contá brevemente sobre vos y tu servicio..."
            rows={3}
          />
        </div>
        <div className="profile-row">
          <div className="profile-field">
            <label>Instagram</label>
            <input
              type="text"
              value={form.social_instagram}
              onChange={(e) => set("social_instagram", e.target.value)}
              placeholder="@tuusuario"
            />
          </div>
          <div className="profile-field">
            <label>Twitter / X</label>
            <input
              type="text"
              value={form.social_twitter}
              onChange={(e) => set("social_twitter", e.target.value)}
              placeholder="@tuusuario"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions">
        {msg && (
          <span
            className={`profile-msg ${msg.includes("Error") || msg.includes("obligatorio") || msg.includes("superar") ? "error" : "ok"}`}
          >
            {msg}
          </span>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

/* ── Client profile form (simpler) ── */
interface ClientData {
  id: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  email: string;
  goal: string | null;
}

export function ClientProfileForm({ client }: { client: ClientData }) {
  const [form, setForm] = useState({
    full_name: client.full_name || "",
    phone: client.phone || "",
    bio: client.bio || "",
    goal: client.goal || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(client.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg("La imagen no puede superar 5 MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    fd.append("role", "client");
    fd.append("entityId", client.id);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setAvatarUrl(data.url);
      setMsg("Foto actualizada");
    } else {
      setMsg("Error al subir la foto");
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setMsg("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        goal: form.goal.trim() || null,
      })
      .eq("id", client.id);
    setSaving(false);
    if (error) {
      setMsg("Error al guardar");
    } else {
      setMsg("Perfil guardado");
      router.refresh();
    }
    setTimeout(() => setMsg(""), 3000);
  }

  const initials = (form.full_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form onSubmit={handleSave}>
      <div className="profile-avatar-section">
        <div
          className="profile-avatar"
          onClick={() => fileRef.current?.click()}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
        >
          {!avatarUrl && <span className="profile-avatar-initials">{initials}</span>}
          <div className="profile-avatar-overlay">
            {uploading ? "..." : "Cambiar"}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatar}
        />
        <div className="profile-avatar-info">
          <div style={{ fontWeight: 600, fontSize: 18 }}>{form.full_name || "Tu nombre"}</div>
          <div style={{ fontSize: 13, color: "var(--gray)" }}>{client.email}</div>
        </div>
      </div>

      <div className="profile-fields">
        <div className="profile-field">
          <label>Nombre completo *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="profile-field">
          <label>Teléfono</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+598 99 123 456"
          />
        </div>
        <div className="profile-field">
          <label>Mi objetivo</label>
          <input
            type="text"
            value={form.goal}
            onChange={(e) => set("goal", e.target.value)}
            placeholder="Ej: Bajar 5 kg, ganar masa muscular..."
          />
        </div>
        <div className="profile-field">
          <label>Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Algo sobre vos..."
            rows={3}
          />
        </div>
      </div>

      <div className="profile-actions">
        {msg && (
          <span
            className={`profile-msg ${msg.includes("Error") || msg.includes("obligatorio") || msg.includes("superar") ? "error" : "ok"}`}
          >
            {msg}
          </span>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
