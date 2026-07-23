import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates } from '../api/candidateApi';
import {
  createReview,
  addManualQuestions,
  addRandomQuestions,
  getReviewQuestions,
} from '../api/reviewApi';
import { getQuestions } from '../api/questionApi';
import type { Candidate } from '../types/candidate';
import type { ReviewTheoryQuestion } from '../types/review';
import type { Question } from '../types/question';

type QuestionMode = 'manual' | 'random';

export default function ReviewPage() {
  const navigate = useNavigate();

  // ── Section 1 ─────────────────────────────────────────────────────────────
  const [candidates, setCandidates]               = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError]     = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [reviewId, setReviewId]                   = useState<string | null>(null);
  const [creatingReview, setCreatingReview]       = useState(false);
  const [createReviewError, setCreateReviewError] = useState<string | null>(null);

  // ── Section 2 ─────────────────────────────────────────────────────────────
  const [mode, setMode]                           = useState<QuestionMode>('manual');
  const [allQuestions, setAllQuestions]           = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading]   = useState(false);
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set());
  const [addingManual, setAddingManual]           = useState(false);
  const [manualError, setManualError]             = useState<string | null>(null);
  const [randomCount, setRandomCount]             = useState('10');
  const [randomTopic, setRandomTopic]             = useState('');
  const [addingRandom, setAddingRandom]           = useState(false);
  const [randomError, setRandomError]             = useState<string | null>(null);

  // ── Section 3 ─────────────────────────────────────────────────────────────
  const [reviewQuestions, setReviewQuestions]     = useState<ReviewTheoryQuestion[]>([]);
  const [reviewQuestionsError, setReviewQuestionsError] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Set of question_ids already present in this review (for fast lookup)
  const addedQuestionIds = new Set(
    reviewQuestions.map((rq) => rq.questionId).filter(Boolean) as string[],
  );

  const allAdded =
    allQuestions.length > 0 &&
    allQuestions.every((q) => addedQuestionIds.has(q.id));

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    getCandidates()
      .then(setCandidates)
      .catch(() => setCandidatesError('Failed to load candidates.'))
      .finally(() => setCandidatesLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== 'manual' || !reviewId) return;
    setQuestionsLoading(true);
    getQuestions()
      .then(setAllQuestions)
      .catch(() => setAllQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, [mode, reviewId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const refreshReviewQuestions = useCallback(async (id: string) => {
    setReviewQuestionsError(null);
    try {
      const qs = await getReviewQuestions(id);
      setReviewQuestions(qs);
    } catch {
      setReviewQuestionsError('Failed to load review questions.');
    }
  }, []);

  // ── Section 1 handler ─────────────────────────────────────────────────────
  async function handleCreateReview() {
    if (!selectedCandidateId) return;
    setCreatingReview(true);
    setCreateReviewError(null);
    try {
      const review = await createReview(selectedCandidateId);
      setReviewId(review.id);
      setSelectedIds(new Set());
      // Immediately fetch any questions already on the draft
      await refreshReviewQuestions(review.id);
    } catch (err: unknown) {
      setCreateReviewError(err instanceof Error ? err.message : 'Failed to create review.');
    } finally {
      setCreatingReview(false);
    }
  }

  // ── Section 2 handlers ────────────────────────────────────────────────────
  function toggleQuestion(id: string) {
    if (addedQuestionIds.has(id)) return; // already added — ignore
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAddManual() {
    if (!reviewId || selectedIds.size === 0) return;
    setAddingManual(true);
    setManualError(null);
    try {
      await addManualQuestions(reviewId, [...selectedIds]);
      setSelectedIds(new Set());
      await refreshReviewQuestions(reviewId);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : 'Failed to add questions.');
    } finally {
      setAddingManual(false);
    }
  }

  async function handleAddRandom() {
    if (!reviewId) return;
    const count = parseInt(randomCount, 10);
    if (!count || count <= 0) {
      setRandomError('Enter a valid number greater than zero.');
      return;
    }
    setAddingRandom(true);
    setRandomError(null);
    try {
      await addRandomQuestions(reviewId, count, randomTopic.trim() || undefined);
      await refreshReviewQuestions(reviewId);
    } catch (err: unknown) {
      setRandomError(err instanceof Error ? err.message : 'Failed to add random questions.');
    } finally {
      setAddingRandom(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
      <h1>Review</h1>

      {/* ── Section 1: Candidate Selection ── */}
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>1. Candidate Selection</h2>

        {candidatesLoading && <p>Loading candidates…</p>}
        {candidatesError   && <p style={errorText}>{candidatesError}</p>}

        {!candidatesLoading && !candidatesError && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedCandidateId}
              onChange={(e) => {
                setSelectedCandidateId(e.target.value);
                setReviewId(null);
                setReviewQuestions([]);
                setSelectedIds(new Set());
              }}
              disabled={creatingReview}
              style={selectStyle}
            >
              <option value="">— Select a candidate —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={handleCreateReview}
              disabled={!selectedCandidateId || creatingReview}
              style={btnStyle}
            >
              {creatingReview ? 'Creating…' : 'Create Review'}
            </button>
          </div>
        )}

        {createReviewError && (
          <p style={{ ...errorText, marginTop: '0.5rem' }}>{createReviewError}</p>
        )}
        {reviewId && (
          <p style={{ marginTop: '0.5rem', color: '#2a7a2a', fontSize: '0.9rem' }}>
            ✓ Review ready — ID: <code>{reviewId}</code>
          </p>
        )}
      </section>

      {/* ── Section 2: Question Selection ── */}
      {reviewId && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>2. Question Selection</h2>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {(['manual', 'random'] as QuestionMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  ...btnStyle,
                  background: mode === m ? '#333' : '#fff',
                  color:      mode === m ? '#fff' : '#333',
                  border:     '1px solid #333',
                }}
              >
                {m === 'manual' ? 'Manual' : 'Random'}
              </button>
            ))}
          </div>

          {/* ── Manual mode ── */}
          {mode === 'manual' && (
            <>
              {questionsLoading && <p>Loading questions…</p>}

              {!questionsLoading && allQuestions.length === 0 && (
                <p>No questions in the bank yet.</p>
              )}

              {!questionsLoading && allQuestions.length > 0 && allAdded && (
                <p style={{ color: '#555' }}>
                  All available questions have already been added.
                </p>
              )}

              {!questionsLoading && allQuestions.length > 0 && !allAdded && (
                <>
                  <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: '36px' }} />
                          <th style={thStyle}>Question</th>
                          <th style={thStyle}>Topic</th>
                          <th style={{ ...thStyle, width: '70px' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {allQuestions.map((q) => {
                          const isAdded    = addedQuestionIds.has(q.id);
                          const isSelected = selectedIds.has(q.id);
                          return (
                            <tr
                              key={q.id}
                              onClick={() => !isAdded && toggleQuestion(q.id)}
                              style={{
                                cursor:     isAdded ? 'default' : 'pointer',
                                background: isAdded   ? '#f5f5f5'
                                          : isSelected ? '#eef5ff'
                                          : 'transparent',
                                opacity: isAdded ? 0.6 : 1,
                              }}
                            >
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isAdded || isSelected}
                                  disabled={isAdded}
                                  onChange={() => toggleQuestion(q.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td style={tdStyle}>{q.questionText}</td>
                              <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{q.topic}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                {isAdded && (
                                  <span style={badgeStyle}>Added</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {manualError && <p style={errorText}>{manualError}</p>}
                  <button
                    onClick={handleAddManual}
                    disabled={selectedIds.size === 0 || addingManual}
                    style={btnStyle}
                  >
                    {addingManual ? 'Adding…' : `Add Selected (${selectedIds.size})`}
                  </button>
                </>
              )}
            </>
          )}

          {/* ── Random mode ── */}
          {mode === 'random' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px' }}>
              <label>
                <span style={labelStyle}>Number of questions</span>
                <input
                  type="number"
                  min={1}
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  disabled={addingRandom}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={labelStyle}>Topic (optional)</span>
                <input
                  type="text"
                  placeholder="e.g. JavaScript"
                  value={randomTopic}
                  onChange={(e) => setRandomTopic(e.target.value)}
                  disabled={addingRandom}
                  style={inputStyle}
                />
              </label>
              {randomError && <p style={errorText}>{randomError}</p>}
              <button
                onClick={handleAddRandom}
                disabled={addingRandom}
                style={{ ...btnStyle, alignSelf: 'flex-start' }}
              >
                {addingRandom ? 'Generating…' : 'Generate Random Questions'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Review Progress Summary + Start Interview ── */}
      {reviewId && (
        <section style={{ ...cardStyle, background: '#f9fafb' }}>
          <h2 style={{ marginTop: 0 }}>Review Progress</h2>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={summaryLabelCell}>Candidate</td>
                <td style={summaryValueCell}>{selectedCandidate?.name ?? '—'}</td>
              </tr>
              <tr>
                <td style={summaryLabelCell}>Questions Selected</td>
                <td style={summaryValueCell}>{reviewQuestions.length}</td>
              </tr>
              <tr>
                <td style={summaryLabelCell}>Status</td>
                <td style={summaryValueCell}>
                  <span style={statusBadgeStyle}>Draft</span>
                </td>
              </tr>
            </tbody>
          </table>

          {reviewQuestions.length > 0 && (
            <button
              onClick={() => navigate(`/reviews/${reviewId}/interview`)}
              style={{ ...btnStyle, marginTop: '1.25rem', background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600, padding: '0.65rem 1.5rem' }}
            >
              Start Interview →
            </button>
          )}
        </section>
      )}

      {/* ── Section 3: Selected Questions ── */}
      {reviewId && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>3. Selected Questions</h2>
          {reviewQuestionsError && <p style={errorText}>{reviewQuestionsError}</p>}
          {reviewQuestions.length === 0 && !reviewQuestionsError && (
            <p style={{ color: '#888' }}>No questions added yet.</p>
          )}
          {reviewQuestions.length > 0 && (
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
                {reviewQuestions.map((q, i) => (
                  <tr key={q.id}>
                    <td style={{ ...tdStyle, color: '#888', width: '36px' }}>{i + 1}</td>
                    <td style={tdStyle}>{q.questionText}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{q.topic}</td>
                    <td style={{ ...tdStyle, ...resultStyle(q.result) }}>
                      {q.result ?? 'Unmarked'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function resultStyle(result: 'correct' | 'incorrect' | null): React.CSSProperties {
  if (result === 'correct')   return { color: '#2a7a2a', fontWeight: 600 };
  if (result === 'incorrect') return { color: '#c00',    fontWeight: 600 };
  return { color: '#888' };
}

// ── Static styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '1.25rem',
  marginBottom: '1.25rem',
};

const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  fontSize: '1rem',
  minWidth: '220px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontWeight: 600,
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

const errorText: React.CSSProperties = {
  color: 'red',
  margin: '0.25rem 0',
};

const badgeStyle: React.CSSProperties = {
  background: '#d4edda',
  color: '#155724',
  fontSize: '0.75rem',
  padding: '0.15rem 0.4rem',
  borderRadius: '4px',
  fontWeight: 600,
};

const statusBadgeStyle: React.CSSProperties = {
  background: '#fff3cd',
  color: '#856404',
  fontSize: '0.85rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  fontWeight: 600,
};

const summaryLabelCell: React.CSSProperties = {
  padding: '0.35rem 1rem 0.35rem 0',
  fontWeight: 600,
  color: '#555',
  whiteSpace: 'nowrap',
};

const summaryValueCell: React.CSSProperties = {
  padding: '0.35rem 0',
};
