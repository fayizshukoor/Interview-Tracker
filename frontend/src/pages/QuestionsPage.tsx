import { useState, useEffect, useCallback } from 'react';
import {
  getQuestions,
  getQuestionsByTopic,
  createQuestion,
  deleteQuestion,
} from '../api/questionApi';
import type { Question } from '../types/question';

const EMPTY_FORM = { questionText: '', expectedAnswer: '', topic: '' };

export default function QuestionsPage() {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [topicFilter, setTopicFilter] = useState('');

  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Fetch
  // --------------------------------------------------------------------------

  const fetchQuestions = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = topic.trim()
        ? await getQuestionsByTopic(topic.trim())
        : await getQuestions();
      setQuestions(data);
    } catch {
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(topicFilter);
  }, [topicFilter, fetchQuestions]);

  // --------------------------------------------------------------------------
  // Create
  // --------------------------------------------------------------------------

  function handleFormChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isFormValid =
    form.questionText.trim() && form.expectedAnswer.trim() && form.topic.trim();

  async function handleAddQuestion() {
    if (!isFormValid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createQuestion({
        questionText:   form.questionText.trim(),
        expectedAnswer: form.expectedAnswer.trim(),
        topic:          form.topic.trim(),
      });
      setForm(EMPTY_FORM);
      await fetchQuestions(topicFilter);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add question.');
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------

  async function handleDelete(id: string, questionText: string) {
    if (!window.confirm(`Delete question:\n"${questionText}"?`)) return;
    try {
      await deleteQuestion(id);
      await fetchQuestions(topicFilter);
    } catch {
      alert('Failed to delete question. Please try again.');
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Question Bank</h1>

      {/* Add question form */}
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Add Question</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Question text"
            value={form.questionText}
            onChange={(e) => handleFormChange('questionText', e.target.value)}
            disabled={submitting}
            style={inputStyle}
          />
          <textarea
            placeholder="Expected answer"
            value={form.expectedAnswer}
            onChange={(e) => handleFormChange('expectedAnswer', e.target.value)}
            disabled={submitting}
            rows={3}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Topic (e.g. JavaScript)"
            value={form.topic}
            onChange={(e) => handleFormChange('topic', e.target.value)}
            disabled={submitting}
            style={inputStyle}
          />
          {submitError && <p style={{ color: 'red', margin: 0 }}>{submitError}</p>}
          <button
            onClick={handleAddQuestion}
            disabled={submitting || !isFormValid}
            style={{ ...buttonStyle, alignSelf: 'flex-start' }}
          >
            {submitting ? 'Adding…' : 'Add Question'}
          </button>
        </div>
      </section>

      {/* Topic filter */}
      <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label htmlFor="topic-filter" style={{ fontWeight: 600 }}>Filter by topic:</label>
        <input
          id="topic-filter"
          type="text"
          placeholder="e.g. JavaScript"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '240px' }}
        />
        {topicFilter && (
          <button onClick={() => setTopicFilter('')} style={buttonStyle}>
            Clear
          </button>
        )}
      </div>

      {/* Question table */}
      {loading && <p>Loading questions…</p>}
      {!loading && error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && questions.length === 0 && (
        <p>No questions found{topicFilter ? ` for topic "${topicFilter}"` : ''}.</p>
      )}
      {!loading && !error && questions.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Question</th>
              <th style={thStyle}>Topic</th>
              <th style={thStyle}>Expected Answer</th>
              <th style={{ ...thStyle, width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td style={tdStyle}>{q.questionText}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{q.topic}</td>
                <td style={{ ...tdStyle, color: '#555', fontSize: '0.9rem' }}>
                  {q.expectedAnswer}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(q.id, q.questionText)}
                    style={deleteBtnStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '1.25rem',
  marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  cursor: 'pointer',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.6rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
  color: '#c00',
  background: 'none',
  border: '1px solid #c00',
  borderRadius: '4px',
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
