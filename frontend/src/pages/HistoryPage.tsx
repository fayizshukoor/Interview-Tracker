import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { listReviews, deleteReview } from '../api/reviewApi';
import { getCandidates } from '../api/candidateApi';
import type { ReviewListItem } from '../types/review';
import type { Candidate } from '../types/candidate';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
];

// Confirmation modal component (portal) — declared at top-level to avoid recreating during render
function ConfirmModal({
  open,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 6, maxWidth: '90%', width: 420 }}>
        <div style={{ marginBottom: 12 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} className="btn">Cancel</button>
          <button onClick={onConfirm} style={{ background: '#d9534f', color: 'white' }} className="btn">Delete</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ open: boolean; ids: string[]; message: string; onConfirm?: () => void }>({ open: false, ids: [], message: '' });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [candidateId, setCandidateId] = useState('');
  const [status, setStatus] = useState('');

  const fetchReviews = useCallback(async (cId: string, st: string, p: number, ps: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReviews({
        candidateId: cId || undefined,
        status: st || undefined,
        page: p,
        pageSize: ps,
      });
      setReviews(result.items);
      const maybeTotal = (typeof result.total === 'number' && result.total > 0) ? result.total : result.items.length;
      setTotal(maybeTotal);

      // If the requested page is now out of range (e.g. after deletions), clamp to last page.
      if (typeof p === 'number' && typeof ps === 'number' && maybeTotal > 0) {
        const lastPage = Math.max(0, Math.ceil(maybeTotal / ps) - 1);
        if (p > lastPage) {
          setPage(lastPage);
          return;
        }
      }
    } catch {
      setError('Failed to load review history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load candidates for the filter dropdown (once)
  useEffect(() => {
    getCandidates().then(setCandidates).catch(() => {/* non-critical */ });
  }, []);

  // Reload whenever filters or pagination change
  useEffect(() => {
    // call in an async IIFE to avoid lint warnings about sync setState in effects
    (async () => {
      await fetchReviews(candidateId, status, page, pageSize);
    })();
  }, [candidateId, status, page, pageSize, fetchReviews]);



  function handleReset() {
    setCandidateId('');
    setStatus('');
  }

  const hasFilters = candidateId || status;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <ConfirmModal
          open={confirm.open}
          message={confirm.message}
          onCancel={() => setConfirm({ open: false, ids: [], message: '' })}
          onConfirm={() => { if (confirm.onConfirm) confirm.onConfirm(); else setConfirm({ open: false, ids: [], message: '' }); }}
        />
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
                  <th style={{ width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={reviews.length > 0 && reviews.every((r) => selectedIds.has(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(reviews.map((r) => r.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
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
                    selected={selectedIds.has(r.id)}
                    onToggleSelect={() => setSelectedIds((prev) => {
                      const n = new Set(prev);
                      if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                      return n;
                    })}
                    onOpen={() => {
                      if (r.status === 'finalized') {
                        navigate(`/reviews/${r.id}/summary`);
                      } else {
                        navigate(`/reviews/${r.id}/interview`);
                      }
                    }}
                    onDelete={() => {
                      setConfirm({
                        open: true,
                        ids: [r.id],
                        message: 'Delete this review? This cannot be undone.',
                        onConfirm: async () => {
                          try {
                            await deleteReview(r.id);
                            fetchReviews(candidateId, status, page, pageSize);
                            setSelectedIds((prev) => { const n = new Set(prev); n.delete(r.id); return n; });
                          } catch {
                            alert('Failed to delete review.');
                          } finally {
                            setConfirm({ open: false, ids: [], message: '' });
                          }
                        },
                      });
                    }}
                  />
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-danger"
                  disabled={selectedIds.size === 0}
                  onClick={() => {
                    const ids = Array.from(selectedIds);
                    setConfirm({
                      open: true,
                      ids,
                      message: `Delete ${ids.length} selected review(s)? This cannot be undone.`,
                      onConfirm: async () => {
                        try {
                          await Promise.all(ids.map((id) => deleteReview(id)));
                          setSelectedIds(new Set());
                          fetchReviews(candidateId, status, page, pageSize);
                        } catch {
                          alert('Failed to delete some reviews.');
                        } finally {
                          setConfirm({ open: false, ids: [], message: '' });
                        }
                      },
                    });
                  }}
                >
                  Delete Selected
                </button>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Showing {reviews.length} of {total} reviews
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
                <span style={{ margin: '0 0.5rem' }}>Page {page + 1}</span>
                <button className="btn" disabled={(page + 1) * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
                  {[5, 10, 20, 50].map((s) => <option key={s} value={s}>{s} / page</option>)}
                </select>
              </div>
            </div>
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
  onDelete,
  selected,
  onToggleSelect,
}: {
  review: ReviewListItem;
  onOpen: () => void;
  onDelete?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
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
      <td style={{ textAlign: 'center' }}>
        <input type="checkbox" checked={!!selected} onChange={onToggleSelect} />
      </td>
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={onOpen}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}
          >
            {review.status === 'finalized' ? 'View Summary' : 'Continue'}
          </button>
          {typeof onDelete === 'function' && (
            <button onClick={onDelete} title="Delete review" style={{ padding: '0.35rem 0.55rem', fontSize: '0.85rem', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c' }}>
              Delete
            </button>
          )}
        </div>
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
