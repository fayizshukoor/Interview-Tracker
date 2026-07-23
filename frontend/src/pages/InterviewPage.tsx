import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getReviewQuestions,
  markQuestionResult,
  addManualQuestions,
  addPracticalTask,
  getPracticalTasks,
  scorePracticalTask,
  deletePracticalTask,
  startPracticalTaskTimer,
  stopPracticalTaskTimer,
  finalizeReview,
} from '../api/reviewApi';
import { getQuestions } from '../api/questionApi';
import type { ReviewTheoryQuestion, ReviewPracticalTask } from '../types/review';
import type { Question } from '../types/question';

type Phase = 'theory' | 'practical';

export default function InterviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  // ── Theory ────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<ReviewTheoryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  // ── Phase ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('theory');

  // ── Question bank picker ───────────────────────────────────────────────────
  const [bankOpen, setBankOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankFilter, setBankFilter] = useState('');
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [addingFromBank, setAddingFromBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // ── Practical ─────────────────────────────────────────────────────────────
  const [practicalTasks, setPracticalTasks] = useState<ReviewPracticalTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [addTaskError, setAddTaskError] = useState<string | null>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scoring ───────────────────────────────────────────────────────────────
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});

  // ── Finalize ──────────────────────────────────────────────────────────────
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  // ── Load theory questions on mount ────────────────────────────────────────
  useEffect(() => {
    if (!reviewId) return;
    getReviewQuestions(reviewId)
      .then((qs) => { setQuestions(qs); setCurrentIndex(0); })
      .catch(() => setLoadError('Failed to load questions. Please go back and try again.'))
      .finally(() => setLoading(false));
  }, [reviewId]);

  useEffect(() => { setAnswerVisible(false); setMarkError(null); }, [currentIndex]);

  useEffect(() => {
    if (phase !== 'practical' || !reviewId) return;
    getPracticalTasks(reviewId)
      .then((tasks) => {
        setPracticalTasks(tasks);
        const inputs: Record<string, string> = {};
        const initialTimers: Record<string, number> = {};
        let runningId: string | null = null;

        tasks.forEach((t) => {
          inputs[t.id] = t.score !== null ? String(t.score) : '';
          if (t.startTime) {
            const start = new Date(t.startTime).getTime();
            if (t.endTime) {
              const end = new Date(t.endTime).getTime();
              initialTimers[t.id] = Math.max(0, Math.floor((end - start) / 1000));
            } else {
              // running task
              const now = Date.now();
              initialTimers[t.id] = Math.max(0, Math.floor((now - start) / 1000));
              runningId = t.id;
            }
          } else {
            initialTimers[t.id] = 0;
          }
        });

        setScoreInputs(inputs);
        setTimers(initialTimers);
        if (runningId) {
          setRunningTaskId(runningId);
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            setTimers((prev) => ({ ...prev, [runningId!]: (prev[runningId!] ?? 0) + 1 }));
          }, 1000);
        }
      })
      .catch(() => { });
  }, [phase, reviewId]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Bank picker ───────────────────────────────────────────────────────────
  function openBank() {
    setBankOpen(true);
    setBankError(null);
    setPickedIds(new Set());
    setBankFilter('');
    if (bankQuestions.length > 0) return;
    setBankLoading(true);
    getQuestions()
      .then(setBankQuestions)
      .catch(() => setBankError('Failed to load question bank.'))
      .finally(() => setBankLoading(false));
  }

  // IDs already in this review — disable them in the picker
  const alreadyAddedIds = new Set(
    questions.map((q) => q.questionId).filter(Boolean) as string[]
  );

  const filteredBank = bankFilter.trim()
    ? bankQuestions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(bankFilter.toLowerCase()) ||
        q.topic.toLowerCase().includes(bankFilter.toLowerCase()),
    )
    : bankQuestions;

  async function handleAddFromBank() {
    if (!reviewId || pickedIds.size === 0) return;
    setAddingFromBank(true);
    setBankError(null);
    try {
      const added = await addManualQuestions(reviewId, [...pickedIds]);
      setQuestions((prev) => [...prev, ...added]);
      setBankOpen(false);
      setPickedIds(new Set());
    } catch (err: unknown) {
      setBankError(err instanceof Error ? err.message : 'Failed to add questions.');
    } finally {
      setAddingFromBank(false);
    }
  }

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const startTimer = useCallback(async (taskId: string) => {
    // stop any running task first (persist end time)
    const prev = runningTaskId;
    if (prev && prev !== taskId) {
      try {
        await stopPracticalTaskTimer(prev, new Date().toISOString());
      } catch {
        // ignore persistence failure
      }
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    // persist start time and update task locally
    try {
      const updated = await startPracticalTaskTimer(taskId, new Date().toISOString());
      setPracticalTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // initialize timer for this task
      const start = updated.startTime ? new Date(updated.startTime).getTime() : Date.now();
      const now = Date.now();
      setTimers((prev) => ({ ...prev, [taskId]: Math.max(0, Math.floor((now - start) / 1000)) }));
    } catch (err) {
      // surface errors to console for debugging
      // (UI remains resilient; we still start the local timer)
      // eslint-disable-next-line no-console
      console.error('Failed to persist start time', err);
    }

    setRunningTaskId(taskId);
    intervalRef.current = setInterval(() => {
      setTimers((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? 0) + 1 }));
    }, 1000);
  }, [runningTaskId]);

  const stopTimer = useCallback(async (taskId?: string) => {
    const idToStop = taskId ?? runningTaskId;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setRunningTaskId(null);

    if (!idToStop) return;
    try {
      const updated = await stopPracticalTaskTimer(idToStop, new Date().toISOString());
      setPracticalTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // set final elapsed based on persisted times
      if (updated.startTime && updated.endTime) {
        const start = new Date(updated.startTime).getTime();
        const end = new Date(updated.endTime).getTime();
        setTimers((prev) => ({ ...prev, [idToStop]: Math.max(0, Math.floor((end - start) / 1000)) }));
      }
    } catch (err) {
      // surface errors to console for debugging
      // eslint-disable-next-line no-console
      console.error('Failed to persist end time', err);
    }
  }, [runningTaskId]);

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Theory handlers ───────────────────────────────────────────────────────
  async function handleMark(result: 'correct' | 'incorrect') {
    if (!questions[currentIndex] || !reviewId) return;
    setMarking(true); setMarkError(null);
    try {
      const updated = await markQuestionResult(questions[currentIndex]!.id, result);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    } catch (err: unknown) {
      setMarkError(err instanceof Error ? err.message : 'Failed to mark question.');
    } finally { setMarking(false); }
  }

  function handleNext() {
    const total = questions.length;
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  }

  // ── Practical handlers ────────────────────────────────────────────────────
  async function handleAddTask() {
    if (!reviewId || !newTaskText.trim()) return;
    setAddingTask(true); setAddTaskError(null);
    try {
      const task = await addPracticalTask(reviewId, newTaskText.trim(), newExpected.trim() || undefined);
      setPracticalTasks((prev) => [...prev, task]);
      setScoreInputs((prev) => ({ ...prev, [task.id]: '' }));
      setTimers((prev) => ({ ...prev, [task.id]: 0 }));
      setNewTaskText(''); setNewExpected('');
    } catch (err: unknown) {
      setAddTaskError(err instanceof Error ? err.message : 'Failed to add task.');
    } finally { setAddingTask(false); }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm('Remove this practical task?')) return;
    if (runningTaskId === taskId) stopTimer();
    try {
      await deletePracticalTask(taskId);
      setPracticalTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTimers((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
      setScoreInputs((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
    } catch { /* ignore */ }
  }

  async function handleSaveScore(task: ReviewPracticalTask) {
    const val = parseFloat(scoreInputs[task.id] ?? '');
    if (isNaN(val) || val < 0 || val > 100) {
      setScoreErrors((prev) => ({ ...prev, [task.id]: 'Enter a number between 0 and 100.' }));
      return;
    }
    setScoringId(task.id);
    setScoreErrors((prev) => { const n = { ...prev }; delete n[task.id]; return n; });
    try {
      const updated = await scorePracticalTask(task.id, val);
      setPracticalTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch { /* ignore */ }
    finally { setScoringId(null); }
  }

  // ── Finalize ──────────────────────────────────────────────────────────────
  async function handleFinalize() {
    if (!reviewId) return;
    await stopTimer();
    setFinalizing(true); setFinalizeError(null);
    try {
      await finalizeReview(reviewId);
      navigate(`/reviews/${reviewId}/summary`);
    } catch (err: unknown) {
      setFinalizeError(err instanceof Error ? err.message : 'Failed to finalize review.');
    } finally { setFinalizing(false); }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const total = questions.length;
  const current = questions[currentIndex];
  const isLast = total > 0 && currentIndex === total - 1;
  const isMarked = current?.result !== null && current?.result !== undefined;

  // ── Render: loading / error ───────────────────────────────────────────────
  if (loading) return <Wrap><p>Loading…</p></Wrap>;

  if (loadError) return (
    <Wrap>
      <p style={S.error}>{loadError}</p>
      <button onClick={() => navigate('/reviews')} style={S.btn}>← Back</button>
    </Wrap>
  );

  // ── Shared: bank picker modal ──────────────────────────────────────────────
  const BankPicker = bankOpen ? (
    <div style={S.modal}>
      <div style={S.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Add Questions from Bank</h3>
          <button onClick={() => setBankOpen(false)} style={{ ...S.btn, padding: '0.2rem 0.6rem' }}>✕</button>
        </div>

        <input
          type="text"
          placeholder="Filter by question or topic…"
          value={bankFilter}
          onChange={(e) => setBankFilter(e.target.value)}
          style={{ ...S.input, marginBottom: '0.75rem' }}
        />

        {bankLoading && <p style={{ color: '#888' }}>Loading questions…</p>}
        {bankError && <p style={S.error}>{bankError}</p>}

        {!bankLoading && filteredBank.length === 0 && (
          <p style={{ color: '#888' }}>No questions found.</p>
        )}

        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '0.75rem' }}>
          {filteredBank.map((q) => {
            const isAdded = alreadyAddedIds.has(q.id);
            const isPicked = pickedIds.has(q.id);
            return (
              <label
                key={q.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  padding: '0.65rem 0.75rem',
                  borderBottom: '1px solid #f3f4f6',
                  background: isAdded ? '#f9fafb' : isPicked ? '#eff6ff' : '#fff',
                  opacity: isAdded ? 0.55 : 1,
                  cursor: isAdded ? 'default' : 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  disabled={isAdded}
                  checked={isAdded || isPicked}
                  onChange={() => {
                    if (isAdded) return;
                    setPickedIds((prev) => {
                      const n = new Set(prev);
                      n.has(q.id) ? n.delete(q.id) : n.add(q.id);
                      return n;
                    });
                  }}
                  style={{ marginTop: '3px', flexShrink: 0 }}
                />
                <span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginRight: '0.4rem' }}>
                    [{q.topic}]
                  </span>
                  {q.questionText}
                  {isAdded && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>✓ Added</span>}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={handleAddFromBank}
            disabled={pickedIds.size === 0 || addingFromBank}
            style={{ ...S.btn, background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            {addingFromBank ? 'Adding…' : `Add ${pickedIds.size > 0 ? `(${pickedIds.size})` : ''} Selected`}
          </button>
          <button onClick={() => setBankOpen(false)} style={S.btn}>Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Render: THEORY phase ──────────────────────────────────────────────────
  if (phase === 'theory') {
    return (
      <Wrap>
        {BankPicker}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>
            {total > 0 ? `Theory — Question ${currentIndex + 1} of ${total}` : 'Theory Questions'}
          </h1>
          <button onClick={openBank} style={{ ...S.btn, fontWeight: 600, color: '#1a56db', border: '1px solid #bfdbfe' }}>
            + Add from Bank
          </button>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '1.5rem' }}>
            <div style={{ height: '100%', width: `${((currentIndex + 1) / total) * 100}%`, background: '#1a56db', borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <section style={{ ...S.card, textAlign: 'center', padding: '2.5rem 1rem', color: '#6b7280' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
            <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>No questions added yet.</p>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem' }}>Use "Add from Bank" above to pick questions for this interview.</p>
            <button onClick={openBank} style={{ ...S.btn, background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600 }}>
              + Add from Bank
            </button>
          </section>
        )}

        {/* Current question card */}
        {total > 0 && current && (
          <section style={S.card}>
            <p style={{ fontSize: '0.82rem', color: '#888', margin: '0 0 0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {current.topic}
            </p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.25rem' }}>{current.questionText}</p>

            {!answerVisible ? (
              <button onClick={() => setAnswerVisible(true)} style={{ ...S.btn, background: '#f3f4f6' }}>
                Show Expected Answer
              </button>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Expected Answer</p>
                <p style={{ margin: 0 }}>{current.expectedAnswer}</p>
              </div>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              {!isMarked ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleMark('correct')} disabled={marking}
                    style={{ ...S.btn, background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', fontWeight: 600 }}>
                    {marking ? '…' : '✓ Correct'}
                  </button>
                  <button onClick={() => handleMark('incorrect')} disabled={marking}
                    style={{ ...S.btn, background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', fontWeight: 600 }}>
                    {marking ? '…' : '✗ Incorrect'}
                  </button>
                </div>
              ) : (
                <p style={{ fontWeight: 700, fontSize: '1rem', color: current.result === 'correct' ? '#155724' : '#721c24', margin: 0 }}>
                  Result: {current.result === 'correct' ? 'Correct ✓' : 'Incorrect ✗'}
                </p>
              )}
              {markError && <p style={S.error}>{markError}</p>}
            </div>
          </section>
        )}

        {/* Navigation */}
        {total > 0 && isMarked && (
          <div style={{ marginTop: '1rem' }}>
            {isLast ? (
              <button onClick={() => setPhase('practical')}
                style={{ ...S.btn, background: '#7e22ce', color: '#fff', border: 'none', fontWeight: 600, padding: '0.65rem 1.5rem' }}>
                Continue to Practical →
              </button>
            ) : (
              <button onClick={handleNext}
                style={{ ...S.btn, background: '#333', color: '#fff', border: 'none', padding: '0.6rem 1.5rem' }}>
                Next Question →
              </button>
            )}
          </div>
        )}

        {/* Skip to practical if no questions or all done */}
        {total > 0 && !isLast && (
          <button
            onClick={() => setPhase('practical')}
            style={{ ...S.btn, marginTop: '1rem', color: '#6b7280', display: 'block' }}
          >
            Skip to Practical →
          </button>
        )}

        <button onClick={() => navigate('/reviews')} style={{ ...S.btn, marginTop: '1.5rem', color: '#6b7280' }}>
          ← Back to Review
        </button>
      </Wrap>
    );
  }

  // ── Render: PRACTICAL phase ───────────────────────────────────────────────
  return (
    <Wrap>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Practical Tasks</h1>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{practicalTasks.length} task{practicalTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Add task */}
      <section style={S.card}>
        <p style={{ fontWeight: 700, margin: '0 0 0.75rem' }}>Add a Practical Task</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <textarea placeholder="Describe the task…" value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)} disabled={addingTask}
            rows={3} style={{ ...S.input, resize: 'vertical' }} />
          <input type="text" placeholder="Expected answer (optional)" value={newExpected}
            onChange={(e) => setNewExpected(e.target.value)} disabled={addingTask} style={S.input} />
          {addTaskError && <p style={S.error}>{addTaskError}</p>}
          <button onClick={handleAddTask} disabled={addingTask || !newTaskText.trim()}
            style={{ ...S.btn, alignSelf: 'flex-start', background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600 }}>
            {addingTask ? 'Adding…' : '+ Add Task'}
          </button>
        </div>
      </section>

      {practicalTasks.length === 0 && (
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No tasks yet. Add one above, or finish the review now.</p>
      )}

      {practicalTasks.map((task, idx) => {
        const elapsed = timers[task.id] ?? 0;
        const isRunning = runningTaskId === task.id;
        return (
          <section key={task.id} style={{ ...S.card, borderLeft: isRunning ? '4px solid #1a56db' : '4px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Task {idx + 1}</span>
              <button onClick={() => handleDeleteTask(task.id)}
                style={{ ...S.btn, padding: '0.15rem 0.5rem', fontSize: '0.78rem', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                Remove
              </button>
            </div>
            <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>{task.taskText}</p>
            {task.expectedAnswer && (
              <details style={{ marginBottom: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>Show Expected Answer</summary>
                <p style={{ margin: '0.4rem 0 0', background: '#f9fafb', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                  {task.expectedAnswer}
                </p>
              </details>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.4rem', fontWeight: 700, color: isRunning ? '#1a56db' : '#374151', minWidth: '60px' }}>
                {formatTime(elapsed)}
              </span>
              {!isRunning ? (
                <button onClick={() => startTimer(task.id)}
                  style={{ ...S.btn, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600 }}>
                  ▶ Start Timer
                </button>
              ) : (
                <button onClick={() => stopTimer(task.id)}
                  style={{ ...S.btn, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600 }}>
                  ■ Stop Timer
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Score (0–100)</label>
              <input type="number" min={0} max={100} placeholder="—"
                value={scoreInputs[task.id] ?? (task.score !== null ? String(task.score) : '')}
                onChange={(e) => setScoreInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                style={{ ...S.input, width: '90px' }} />
              <button onClick={() => handleSaveScore(task)} disabled={scoringId === task.id} style={{ ...S.btn, fontWeight: 600 }}>
                {scoringId === task.id ? 'Saving…' : 'Save Score'}
              </button>
              {task.score !== null && <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>✓ {task.score}</span>}
            </div>
            {scoreErrors[task.id] && <p style={S.error}>{scoreErrors[task.id]}</p>}
            <div style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: '#555' }}>
              <div>Start: {task.startTime ? new Date(task.startTime).toLocaleString() : '—'}</div>
              <div>End: {task.endTime ? new Date(task.endTime).toLocaleString() : (isRunning ? 'Running…' : '—')}</div>
            </div>
          </section>
        );
      })}

      <div style={{ marginTop: '1rem' }}>
        {finalizeError && <p style={S.error}>{finalizeError}</p>}
        <button onClick={handleFinalize} disabled={finalizing}
          style={{ ...S.btn, background: '#1a56db', color: '#fff', border: 'none', fontWeight: 600, padding: '0.65rem 1.5rem', fontSize: '1rem' }}>
          {finalizing ? 'Finalizing…' : 'Finish Review'}
        </button>
      </div>

      <button onClick={() => navigate('/reviews')} style={{ ...S.btn, marginTop: '2rem', color: '#6b7280' }}>
        ← Back to Review
      </button>
    </Wrap>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Wrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '2rem', maxWidth: '740px', margin: '0 auto' }}>{children}</div>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  card: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem', background: '#fff' } as React.CSSProperties,
  btn: { padding: '0.5rem 1rem', fontSize: '0.95rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
  input: { padding: '0.5rem 0.65rem', fontSize: '0.95rem', border: '1.5px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' } as React.CSSProperties,
  error: { color: '#b91c1c', fontSize: '0.875rem', margin: '0.25rem 0' } as React.CSSProperties,
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modalBox: { background: '#fff', borderRadius: '10px', padding: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};
