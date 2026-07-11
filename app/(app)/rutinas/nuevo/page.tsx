import Link from "next/link";
import { createRoutineAction } from "../actions";

export default function NuevaRutinaPage() {
  return (
    <>
      <Link href="/rutinas" className="back-link">
        ← Volver a rutinas
      </Link>
      <div className="page-head">
        <div>
          <h1>Nueva rutina</h1>
          <div className="sub">
            Poné un nombre y después le agregás los ejercicios.
          </div>
        </div>
      </div>
      <form action={createRoutineAction} className="form-card">
        <div className="field">
          <label>Nombre de la rutina *</label>
          <input name="name" placeholder="Full body 3 días" autoFocus required />
        </div>
        <div className="field">
          <label>Descripción</label>
          <textarea
            name="description"
            placeholder="Objetivo, nivel, aclaraciones…"
          />
        </div>
        <div className="actions-row">
          <button className="btn btn-primary" style={{ width: "auto" }}>
            Crear y agregar ejercicios
          </button>
          <Link href="/rutinas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
