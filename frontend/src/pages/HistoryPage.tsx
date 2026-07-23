import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listReviews } from '../api/reviewApi';
import { getCandidates } from '../api/candidateApi';
import type { ReviewListItem } from '../types/review';
import type { Candidate } from '../types/candidate';

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'draft',     label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
];

export default function HistoryPage() {
  const navigate = useNavigate();

  const [reviews, setReviews]         = useState<ReviewListItem[]>([]);
  const [candidates, setCandidates]   = useState<Candidate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Filters
  const [candidateId, setCandidateId] = useState('');
  const [status, setStatus]           = useState('');

  const fetchReviews = useCallback(async (cId: string, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReviews({
        candidateId: cId || undefined,
        status:      st  || undefined,
      });
      setReviews(data);
    } catch {
      setError('Failed to load review history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load candidates for the filter dropdown (once)
  useEffect(() => {
    getCandidates().then(setCandidates).catch(() => {/* non-critical */});
  }, []);

  // Reload whenever a filter changes
  useEffect(() => {
    fetchReviews(candidateId, status);
  }, [candidateId, status, fetchReviews]);

  function handleReset() {
    setCandidateId('');
    setStatus('');
  }

  const hasFilters = candidateId || status;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Interview History</h1>
          <p className="text-muted text-small">All past and in-progress reviews</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '180px' }}>
            <label className="form-label" htmlFor="filter-candidate">Candidate</label>
            <select
              id="filter-candidate"
              className="select"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
            >
              <option value="">All Candidates</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '160px' }}>
            <label className="form-label" htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button className="btn btn-secondary" onClick={handleReset}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {loading && <p className="text-muted">Loading history…</p>}
      {!loading && error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && reviews.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
          <p className="text-muted">
            {hasFilters ? 'No reviews match the current filters.' : 'No reviews yet.'}
          </p>
          {hasFilters && (
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleReset}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <>
          <p className="text-muted text-small" style={{ marginBottom: '0.75rem' }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} found
          </p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Theory Score</th>
                  <th>Questions</th>
                  <th>Conducted</th>
                  <th>Created</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <ReviewRow
                    key={r.id}
                    review={r}
                    onOpen={() => {
                      if (r.status === 'finalized') {
                        navigate(`/reviews/${r.id}/summary`);
                      } else {
                        navigate(`/reviews/${r.id}/interview`);
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Row sub-component ─────────────────────────────────────────────────────────

function ReviewRow({
  review,
  onOpen,
}: {
  review: ReviewListItem;
  onOpen: () => void;
}) {
  const conducted = review.conductedAt
    ? new Date(review.conductedAt).toLocaleDateString()
    : '—';
  const created = new Date(review.createdAt).toLocaleDateString();

  const score = review.theoryScore !== null
    ? `${review.theoryScore}%`
    : '—';

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{review.candidateName}</td>
      <td><StatusBadge status={review.status} /></td>
      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</td>
      <td style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
        {review.questionCount}
      </td>
      <td className="text-muted" style={{ fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
        {conducted}
      </td>
      <td className="text-muted" style={{ fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
        {created}
      </td>
      <td>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpen}
        >
          {review.status === 'finalized' ? 'View Summary' : 'Continue'}
        </button>
      </td>
    </tr>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'finalized' ? 'badge badge-green' : 'badge badge-yellow';
  const label = status === 'finalized' ? 'Finalized' : 'Draft';
  return <span className={cls}>{label}</span>;
}
