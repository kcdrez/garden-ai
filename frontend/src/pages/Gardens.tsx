import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import type { Garden } from "../types/gardens";
import { getErrorMessage } from "../lib/errors";
import GardenItem from "../components/GardenItem";

export default function Gardens() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // new form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/gardens/");
        if (mounted) setGardens(res.data ?? []);
      } catch (err: unknown) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post("/gardens/", {
        name: name.trim(),
        description,
      });
      // prepend new garden to the list
      setGardens((prev) => [res.data, ...prev]);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Gardens</h2>

      {/* Create garden form */}
      <form
        onSubmit={handleCreate}
        style={{ marginBottom: 20, display: "grid", gap: 8, maxWidth: 600 }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Garden"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
            }}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              marginTop: 4,
            }}
            rows={3}
          />
        </label>

        {createError && (
          <div style={{ color: "red" }}>
            Error creating garden: {createError}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={creating}
            style={{ padding: "8px 12px" }}
          >
            {creating ? "Creating…" : "Create Garden"}
          </button>
        </div>
      </form>

      {loading && <div>Loading gardens...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {!loading && !error && gardens.length === 0 && <div>No gardens yet.</div>}
      {!loading && !error && gardens.length > 0 && (
        <ul>
          {gardens.map((g: Garden) => (
            <GardenItem
              key={g.id}
              garden={g}
              onDeleted={(id) =>
                setGardens((prev) => prev.filter((x) => x.id !== id))
              }
              onError={setError}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
