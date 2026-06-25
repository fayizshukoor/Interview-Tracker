import { useState, useEffect } from 'react';
import { getCandidates, createCandidate } from '../api/candidateApi';
import type { Candidate } from '../types/candidate';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [name, setName]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function fetchCandidates() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch {
      setError('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function handleAddCandidate() {
    if (!name.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createCandidate(name.trim());
      setName('');
      await fetchCandidates();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create candidate.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Candidates</h1>

      {/* Add candidate form */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Candidate name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCandidate()}
          disabled={submitting}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button
          onClick={handleAddCandidate}
          disabled={submitting || !name.trim()}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
        >
          {submitting ? 'Adding…' : 'Add Candidate'}
        </button>
      </div>

      {submitError && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{submitError}</p>
      )}

      {/* Candidate list */}
      {loading && <p>Loading candidates…</p>}

      {!loading && error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && candidates.length === 0 && (
        <p>No candidates yet. Add one above.</p>
      )}

      {!loading && !error && candidates.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Added</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem',
  borderBottom: '2px solid #ccc',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderBottom: '1px solid #eee',
};
