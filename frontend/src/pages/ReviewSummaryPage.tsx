import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getReview,
  getReviewQuestions,
  getPendingTopics,
  updateReviewFeedback,
} from '../api/reviewApi';
import { getCandidates } from '../api/candidateApi';
import type { Review, ReviewTheoryQuestion, ReviewPendingTopic } from '../types/review';

export default function ReviewSummaryPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate     = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [review, setReview]       = useState<Review | null>(null);
  const [questions, setQuestions] = useState<ReviewTheoryQuestion[]>([]);
  const [pending, setPending]     = useState<ReviewPendingTopic[]>([]);
  const [candidateName, setCandidateName] = useState<string>('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [feedbackText, setFeedbackText]     = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  // ── Clipboard ─────────────────────────────────────────────────────────────
  const [copiedWith, setCopiedWith]       = useState(false);
  const [copiedWithout, setCopiedWithout] = useState(false);

  // ── Load all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reviewId) return;

    Promise.all([
      getReview(reviewId),
      getReviewQuestions(reviewId),
      getPendingTopics(reviewId),
      getCandidates(),
    ])
      .then(([r, qs, pt, candidates]) => {
        setReview(r);
        setQuestions(qs);
        setPending(pt);
        setFeedbackText(r.feedback ?? '');
        const match = candidates.find((c) => c.id === r.candidateId);
        setCandidateName(match?.name ?? r.candidateId);
      })
      .catch(() => setError('Failed to load review summary. Please try again.'))
      .finally(() => setLoading(false));
  }, [reviewId]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const total     = questions.length;
  const correct   = questions.filter((q) => q.result === 'correct').length;
  const incorrect = questions.filter((q) => q.result === 'incorrect').length;
  const pct       = total > 0 ? ((correct / total) * 100).toFixed(1) : '—';

  // ── Save feedback ─────────────────────────────────────────────────────────
  const handleSaveFeedback = useCallback(async () => {
    if (!reviewId) return;
    setSavingFeedback(true);
    setFeedbackMsg(null);
    try {
      const updated = await updateReviewFeedback(reviewId, feedbackText);
      setReview(updated);
      setFeedbackMsg({ text: 'Feedback saved.', ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save feedback.';
      setFeedbackMsg({ text: msg, ok: false });
    } finally {
      setSavingFeedback(false);
    }
  }, [reviewId, feedbackText]);

  // ── Clipboard helpers ─────────────────────────────────────────────────────
  function buildPendingsAndFeedback(includeTopic: boolean): string {
    const lines: string[] = [];

    lines.push('Pending Topics', '');
    if (pending.length === 0) {
      lines.push('No pending topics.', '');
    } else if (includeTopic) {
      // Group by topic
      const grouped = pending.reduce<Record<string, string[]>>((acc, pt) => {
        (acc[pt.topic] ??= []).push(pt.questionText);
        return acc;
      }, {});
      for (const [topic, qs] of Object.entries(grouped)) {
        lines.push(`• Topic: ${topic}`);
        qs.forEach((q) => lines.push(`  - ${q}`));
        lines.push('');
      }
    } else {
      // Questions only — no topic grouping
      pending.forEach((pt) => lines.push(`- ${pt.questionText}`));
      lines.push('');
    }

    lines.push('Feedback', '');
    lines.push(feedbackText.trim() || '—');

    return lines.join('\n').trim();
  }

  async function copyToClipboard(text: string, onSuccess: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch {
      alert('Failed to copy to clipboard.');
    }
  }

  function handleCopyWith() {
    copyToClipboard(buildPendingsAndFeedback(true), () => {
      setCopiedWith(true);
      setTimeout(() => setCopiedWith(false), 2500);
    });
  }

  function handleCopyWithout() {
    copyToClipboard(buildPendingsAndFeedback(false), () => {
      setCopiedWithout(true);
      setTimeout(() => setCopiedWithout(false), 2500);
    });
  }

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) return <Wrap><p>Loading summary…</p></Wrap>;

  if (error || !review) {
    return (
      <Wrap>
        <p style={errorStyle}>{error ?? 'Review not found.'}</p>
        <button onClick={() => navigate('/reviews')} style={btnStyle}>← Back to Reviews</button>
      </Wrap>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Wrap>
      <h1>Review Summary</h1>

      {/* ── Review details ── */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Review Details</h2>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <Row label="Candidate"    value={candidateName} />
            <Row label="Status"       value={<StatusBadge status={review.status} />} />
            <Row label="Theory Score" value={review.theoryScore !== null ? `${review.theoryScore}%` : '—'} />
            <Row label="Practical Score" value={review.practicalScore !== null ? `${review.practicalScore}%` : '—'} />
            <Row
              label="Conducted At"
              value={review.conductedAt ? new Date(review.conductedAt).toLocaleString() : '—'}
            />
          </tbody>
        </table>
      </section>

      {/* ── Stats ── */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Summary</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Stat label="Total" value={String(total)} />
          <Stat label="Correct"   value={String(correct)}   colour="#155724" />
          <Stat label="Incorrect" value={String(incorrect)} colour="#721c24" />
          <Stat label="Score"     value={`${pct}%`}         colour="#1a56db" />
        </div>
      </section>

      {/* ── Theory questions ── */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Theory Questions</h2>
        {questions.length === 0 ? (
          <p style={{ color: '#888' }}>No questions found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Question</th>
                <th style={thStyle}>Topic</th>
                <th style={thStyle}>Result</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={{ ...tdStyle, color: '#888', width: '36px' }}>{i + 1}</td>
                  <td style={tdStyle}>{q.questionText}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{q.topic}</td>
                  <td style={{ ...tdStyle, ...resultColour(q.result) }}>
                    {q.result === 'correct' ? '✓ Correct' : q.result === 'incorrect' ? '✗ Incorrect' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Pending topics ── */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Pending Topics</h2>
        {pending.length === 0 ? (
          <p style={{ color: '#888' }}>No pending topics.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Topic</th>
                <th style={thStyle}>Question</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((pt) => (
                <tr key={pt.id}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontWeight: 600 }}>{pt.topic}</td>
                  <td style={tdStyle}>{pt.questionText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Feedback ── */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Feedback</h2>
        <textarea
          value={feedbackText}
          onChange={(e) => { setFeedbackText(e.target.value); setFeedbackMsg(null); }}
          placeholder="Write interview feedback..."
          rows={5}
          disabled={savingFeedback}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.6rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleSaveFeedback}
            disabled={savingFeedback}
            style={{ ...btnStyle, background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            {savingFeedback ? 'Saving…' : 'Save Feedback'}
          </button>
          {feedbackMsg && (
            <span style={{ color: feedbackMsg.ok ? '#155724' : 'red', fontSize: '0.9rem' }}>
              {feedbackMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
        <button onClick={() => navigate('/reviews')} style={btnStyle}>
          ← Back to Reviews
        </button>
        <button
          onClick={() => navigate('/reviews')}
          style={{ ...btnStyle, background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600 }}
        >
          Start New Review
        </button>

        {/* Copy button group */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #1a56db' }}>
            <button
              onClick={handleCopyWith}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: copiedWith ? '#1648c0' : '#1a56db',
                color: '#fff',
                border: 'none',
                borderRight: '1px solid rgba(255,255,255,0.25)',
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
              title="Copy pending questions grouped by topic, plus feedback"
            >
              {copiedWith ? '✓ Copied' : '📋 With Topic'}
            </button>
            <button
              onClick={handleCopyWithout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: copiedWithout ? '#1648c0' : '#1a56db',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
              title="Copy pending questions only (no topic labels), plus feedback"
            >
              {copiedWithout ? '✓ Copied' : '📋 Without Topic'}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>
            Copy Pendings &amp; Feedback
          </span>
        </div>
      </div>
    </Wrap>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '0.4rem 1.5rem 0.4rem 0', fontWeight: 600, color: '#555', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ padding: '0.4rem 0', verticalAlign: 'top' }}>{value}</td>
    </tr>
  );
}

function Stat({ label, value, colour = '#333' }: { label: string; value: string; colour?: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '90px' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: colour }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.15rem' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const bg    = status === 'finalized' ? '#d4edda' : '#fff3cd';
  const color = status === 'finalized' ? '#155724' : '#856404';
  return (
    <span style={{ background: bg, color, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function resultColour(result: 'correct' | 'incorrect' | null): React.CSSProperties {
  if (result === 'correct')   return { color: '#155724', fontWeight: 600 };
  if (result === 'incorrect') return { color: '#721c24', fontWeight: 600 };
  return { color: '#888' };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '1.25rem',
  marginBottom: '1.25rem',
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: '0.75rem',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#333',
};

const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem',
  borderBottom: '2px solid #ccc',
  background: '#f9f9f9',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  margin: '0 0 1rem',
};
