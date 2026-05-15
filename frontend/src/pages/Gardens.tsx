import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import type { Garden } from '../types/gardens';
import { getErrorMessage } from '../lib/errors';
import GardenItem from '../components/GardenItem';

export default function Gardens() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // new form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/gardens/');
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
      setCreateError('Name is required');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post('/gardens/', {
        name: name.trim(),
        description,
      });
      // prepend new garden to the list
      setGardens((prev) => [res.data, ...prev]);
      setName('');
      setDescription('');
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-5">
      <h2>Your Gardens</h2>

      {/* Create garden form */}
      <form onSubmit={handleCreate} className="mb-5 grid gap-2 max-w-xl">
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Garden"
            required
            className="block w-full p-2 mt-1 border rounded"
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="block w-full p-2 mt-1 border rounded"
            rows={3}
          />
        </label>

        {createError && (
          <div className="text-red-500">
            Error creating garden: {createError}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={creating}
            className="px-3 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Garden'}
          </button>
        </div>
      </form>

      {loading && <div>Loading gardens...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
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
