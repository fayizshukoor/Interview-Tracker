import { useState, useEffect, useCallback } from 'react';
import {
  getQuestions, getQuestionsByTopic, createQuestion, deleteQuestion,
} from '../api/questionApi';
import {
  getPracticalQuestions, createPracticalQuestion, deletePracticalQuestion,
} from '../api/practicalQuestionApi';
import type { Question } from '../types/question';
import type { PracticalQuestion } from '../types/review';
import { formatExpectedAnswer, normalizeExpectedAnswer } from '../utils/formatExpectedAnswer';

type Tab = 'theory' | 'practical';

const EMPTY_THEORY = { questionText: '', expectedAnswer: '', topic: '' };
const EMPTY_PRACTICAL = { taskText: '', expectedAnswer: '', topic: '' };

export default function QuestionsPage() {
  const [tab, setTab] = useState<Tab>('theory');

  // ── Theory state ──────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tLoading, setTLoading] = useState(true);
  const [tError, setTError] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState('');
  const [tForm, setTForm] = useState(EMPTY_THEORY);
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tSubmitError, setTSubmitError] = useState<string | null>(null);

  // ── Practical state ───────────────────────────────────────────────────────
  const [pQuestions, setPQuestions] = useState<PracticalQuestion[]>([]);
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState<string | null>(null);
  const [pTopicFilter, setPTopicFilter] = useState('');
  const [pForm, setPForm] = useState(EMPTY_PRACTICAL);
  const [pSubmitting, setPSubmitting] = useState(false);
  const [pSubmitError, setPSubmitError] = useState<string | null>(null);

  // ── Theory fetch ──────────────────────────────────────────────────────────
  const fetchTheory = useCallback(async (topic: string) => {
    setTLoading(true); setTError(null);
    try {
      const data = topic.trim() ? await getQuestionsByTopic(topic.trim()) : await getQuestions();
      setQuestions(data);
    } catch { setTError('Failed to load questions.'); }
    finally { setTLoading(false); }
  }, []);

  useEffect(() => { fetchTheory(topicFilter); }, [topicFilter, fetchTheory]);

  // ── Practical fetch ───────────────────────────────────────────────────────
  const fetchPractical = useCallback(async (topic: string) => {
    setPLoading(true); setPError(null);
    try {
      const data = await getPracticalQuestions(topic.trim() ? { topic: topic.trim() } : undefined);
      setPQuestions(data);
    } catch { setPError('Failed to load practical questions.'); }
    finally { setPLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'practical') fetchPractical(pTopicFilter);
  }, [tab, pTopicFilter, fetchPractical]);

  // ── Theory handlers ───────────────────────────────────────────────────────
  const tFormValid = tForm.questionText.trim() && tForm.expectedAnswer.trim() && tForm.topic.trim();

  async function handleAddTheory() {
    if (!tFormValid) return;
    setTSubmitting(true); setTSubmitError(null);
    try {
      await createQuestion({
        questionText: tForm.questionText.trim(),
        expectedAnswer: normalizeExpectedAnswer(tForm.expectedAnswer.trim()),
        topic: tForm.topic.trim(),
      });
      setTForm(EMPTY_THEORY);
      await fetchTheory(topicFilter);
    } catch (err: unknown) {
      setTSubmitError(err instanceof Error ? err.message : 'Failed to add question.');
    } finally { setTSubmitting(false); }
  }

  async function handleDeleteTheory(id: string, text: string) {
    if (!window.confirm(`Delete question:\n"${text}"?`)) return;
    try { await deleteQuestion(id); await fetchTheory(topicFilter); }
    catch { alert('Failed to delete question.'); }
  }

  // ── Practical handlers ────────────────────────────────────────────────────
  const pFormValid = pForm.taskText.trim() && pForm.topic.trim();

  async function handleAddPractical() {
    if (!pFormValid) return;
    setPSubmitting(true); setPSubmitError(null);
    try {
      await createPracticalQuestion({
        taskText: pForm.taskText.trim(),
        expectedAnswer: pForm.expectedAnswer.trim() || undefined,
        topic: pForm.topic.trim(),
      });
      setPForm(EMPTY_PRACTICAL);
      await fetchPractical(pTopicFilter);
    } catch (err: unknown) {
      setPSubmitError(err instanceof Error ? err.message : 'Failed to add practical question.');
    } finally { setPSubmitting(false); }
  }

  async function handleDeletePractical(id: string, text: string) {
    if (!window.confirm(`Delete practical question:\n"${text}"?`)) return;
    try { await deletePracticalQuestion(id); await fetchPractical(pTopicFilter); }
    catch { alert('Failed to delete practical question.'); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="page-title">Question Bank</h1>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        {(['theory', 'practical'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.55rem 1.25rem', cursor: 'pointer', border: 'none', background: 'transparent',
            fontWeight: tab === t ? 700 : 400, fontSize: '0.95rem',
            color: tab === t ? '#1a56db' : '#6b7280',
            borderBottom: tab === t ? '2px solid #1a56db' : '2px solid transparent',
            marginBottom: '-2px', fontFamily: 'inherit',
          }}>
            {t === 'theory' ? '📘 Theory Questions' : '💻 Practical Questions'}
          </button>
        ))}
      </div>

      {/* ── THEORY TAB ── */}
      {tab === 'theory' && (
        <>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700 }}>Add Theory Question</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <input className="input" placeholder="Question text" value={tForm.questionText}
                onChange={(e) => setTForm((p) => ({ ...p, questionText: e.target.value }))} disabled={tSubmitting} />
              <textarea className="input" placeholder="Expected answer" value={tForm.expectedAnswer}
                onChange={(e) => setTForm((p) => ({ ...p, expectedAnswer: e.target.value }))}
                disabled={tSubmitting} rows={3} style={{ resize: 'vertical' }} />
              <input className="input" placeholder="Topic (e.g. JavaScript)" value={tForm.topic}
                onChange={(e) => setTForm((p) => ({ ...p, topic: e.target.value }))} disabled={tSubmitting} />
              {tSubmitError && <p style={{ color: 'red', margin: 0, fontSize: '0.875rem' }}>{tSubmitError}</p>}
              <button className="btn btn-primary" onClick={handleAddTheory} disabled={tSubmitting || !tFormValid} style={{ alignSelf: 'flex-start' }}>
                {tSubmitting ? 'Adding…' : 'Add Question'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filter by topic:</label>
            <input className="input" placeholder="e.g. JavaScript" value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)} style={{ maxWidth: '240px' }} />
            {topicFilter && <button className="btn btn-secondary btn-sm" onClick={() => setTopicFilter('')}>Clear</button>}
          </div>

          {tLoading && <p className="text-muted">Loading…</p>}
          {!tLoading && tError && <div className="alert alert-error">{tError}</div>}
          {!tLoading && !tError && questions.length === 0 && (
            <p className="text-muted">No questions found{topicFilter ? ` for "${topicFilter}"` : ''}.</p>
          )}
          {!tLoading && !tError && questions.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead><tr><th>Question</th><th>Topic</th><th>Expected Answer</th><th style={{ width: 80 }}>Actions</th></tr></thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td>{q.questionText}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{q.topic}</td>
                      <td style={{ color: '#555', fontSize: '0.875rem' }}>{formatExpectedAnswer(q.expectedAnswer)}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteTheory(q.id, q.questionText)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── PRACTICAL TAB ── */}
      {tab === 'practical' && (
        <>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700 }}>Add Practical Question</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <textarea className="input" placeholder="Task description (e.g. Build a REST API endpoint)" value={pForm.taskText}
                onChange={(e) => setPForm((p) => ({ ...p, taskText: e.target.value }))}
                disabled={pSubmitting} rows={3} style={{ resize: 'vertical' }} />
              <textarea className="input" placeholder="Expected answer / evaluation criteria (optional)" value={pForm.expectedAnswer}
                onChange={(e) => setPForm((p) => ({ ...p, expectedAnswer: e.target.value }))}
                disabled={pSubmitting} rows={2} style={{ resize: 'vertical' }} />
              <input className="input" placeholder="Topic (e.g. Node.js)" value={pForm.topic}
                onChange={(e) => setPForm((p) => ({ ...p, topic: e.target.value }))} disabled={pSubmitting} />
              {pSubmitError && <p style={{ color: 'red', margin: 0, fontSize: '0.875rem' }}>{pSubmitError}</p>}
              <button className="btn btn-primary" onClick={handleAddPractical} disabled={pSubmitting || !pFormValid} style={{ alignSelf: 'flex-start' }}>
                {pSubmitting ? 'Adding…' : 'Add Practical Question'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filter by topic:</label>
            <input className="input" placeholder="e.g. Node.js" value={pTopicFilter}
              onChange={(e) => setPTopicFilter(e.target.value)} style={{ maxWidth: '240px' }} />
            {pTopicFilter && <button className="btn btn-secondary btn-sm" onClick={() => setPTopicFilter('')}>Clear</button>}
          </div>

          {pLoading && <p className="text-muted">Loading…</p>}
          {!pLoading && pError && <div className="alert alert-error">{pError}</div>}
          {!pLoading && !pError && pQuestions.length === 0 && (
            <p className="text-muted">No practical questions found{pTopicFilter ? ` for "${pTopicFilter}"` : ''}.</p>
          )}
          {!pLoading && !pError && pQuestions.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead><tr><th>Task</th><th>Topic</th><th>Expected Answer</th><th style={{ width: 80 }}>Actions</th></tr></thead>
                <tbody>
                  {pQuestions.map((q) => (
                    <tr key={q.id}>
                      <td>{q.taskText}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{q.topic}</td>
                      <td style={{ color: '#555', fontSize: '0.875rem' }}>{q.expectedAnswer ? formatExpectedAnswer(q.expectedAnswer) : <em className="text-muted">—</em>}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeletePractical(q.id, q.taskText)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
