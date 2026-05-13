import React, { useState } from "react";
import type { Garden } from "../types/gardens";
import { api } from "../api/client";
import { getErrorMessage } from "../lib/errors";

type Props = {
  garden: Garden;
  onDeleted: (id: string) => void;
  onError?: (msg: string | null) => void;
};

export default function GardenItem({ garden, onDeleted, onError }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/gardens/${garden.id}/`);
      onDeleted(garden.id);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (onError) onError(msg);
      else console.error("Delete error:", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <strong>{garden.name}</strong>
          {garden.description ? <div>{garden.description}</div> : null}
          <div style={{ fontSize: 12, color: "#666" }}>{garden.created_at}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: "6px 10px" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
