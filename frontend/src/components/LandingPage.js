import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <main className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Resume intelligence workspace</p>
          <h1>Candidate Profile Change Tracker</h1>
          <p className="hero-text">
            Upload candidate resumes, review extracted profile signals, and spot meaningful changes in one focused dashboard.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/login")}>Open Dashboard</button>
          </div>
        </div>
        <div className="hero-preview" aria-hidden="true">
          <div className="preview-header">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-row strong" />
          <div className="preview-row" />
          <div className="preview-row short" />
          <div className="metric-grid">
            <div>
              <strong>12</strong>
              <span>Profiles</span>
            </div>
            <div>
              <strong>04</strong>
              <span>Changes</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
