"use client";

import { deleteClientAction } from "@/app/(app)/clientes/actions";

export function DeleteClientButton({ id }: { id: string }) {
  return (
    <form
      action={deleteClientAction.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("¿Seguro que querés eliminar este cliente?")) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn btn-danger btn-sm">Eliminar</button>
    </form>
  );
}
