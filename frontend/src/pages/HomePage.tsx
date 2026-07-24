import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    icon: '👤',
    title: 'Candidates',
    description: 'Add and manage candidate profiles. View their full review history in one place.',
    action: 'Go to Candidates',
    path: '/candidates',
    colour: '#1a56db',
  },
  {
    icon: '📚',
    title: 'Question Bank',
    description: 'Build and maintain a library of interview questions organised by topic.',
    action: 'Go to Question Bank',
    path: '/questions',
    colour: '#0e7c4f',
  },
  {
    icon: '📝',
    title: 'Start a Review',
    description: 'Select a candidate, choose questions manually or randomly, and run an interview session.',
    action: 'Start Review',
    path: '/reviews',
    colour: '#7e22ce',
  },
  {
    icon: '📋',
    title: 'Interview History',
    description: 'Browse all past and in-progress reviews. Filter by candidate or status, and jump straight to any summary.',
    action: 'View History',
    path: '/history',
    colour: '#b45309',
  },
];

const steps = [
  { step: '1', label: 'Add a candidate' },
  { step: '2', label: 'Build your question bank' },
  { step: '3', label: 'Create a review & pick questions' },
  { step: '4', label: 'Run the interview — mark each answer' },
  { step: '5', label: 'Finalize and view the summary' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home">

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">Interview Tracker</h1>
        <p className="hero-subtitle">
          Conduct structured candidate interviews, track results, and build a
          reusable question bank — all in one place.
        </p>
        {!user && (
          <div className="home-banner alert alert-info">
            You must be signed in to access candidates, questions, reviews, and history.
          </div>
        )}
        <div className="hero-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(user ? '/reviews' : '/login')}
          >
            {user ? 'Start a Review →' : 'Login to Get Started'}
          </button>
          {!user && (
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          )}
        </div>
      </section>

      {/* Feature cards */}
      <section className="section">
        <h2 className="section-title">Features</h2>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.path} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-card-title">{f.title}</h3>
              <p className="feature-card-desc">{f.description}</p>
              <button
                className="btn btn-outline"
                style={{
                  '--btn-colour': f.colour,
                  opacity: user ? 1 : 0.55,
                  cursor: user ? 'pointer' : 'not-allowed',
                } as React.CSSProperties}
                disabled={!user}
                onClick={() => {
                  if (user) {
                    navigate(f.path);
                  } else {
                    navigate('/login');
                  }
                }}
              >
                {user ? f.action : 'Login to access'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <h2 className="section-title">How It Works</h2>
        <ol className="steps">
          {steps.map(({ step, label }) => (
            <li key={step} className="step">
              <span className="step-number">{step}</span>
              <span className="step-label">{label}</span>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
