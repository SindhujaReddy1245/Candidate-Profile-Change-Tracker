import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark">CP</div>
        <div>
          <p className="sidebar-title">Candidate Tracker</p>
          <p className="sidebar-subtitle">Profile change review</p>
        </div>
      </div>
      <nav className="nav-list">
        <button className={isActive("/dashboard") ? "nav-button active" : "nav-button"} onClick={() => navigate("/dashboard")}>
          Dashboard
        </button>
        <button className={isActive("/dashboard/upload") ? "nav-button active" : "nav-button"} onClick={() => navigate("/dashboard/upload")}>
          Upload Resume
        </button>
        <button className={isActive("/dashboard/previous") ? "nav-button active" : "nav-button"} onClick={() => navigate("/dashboard/previous")}>
          Previous Resumes
        </button>
      </nav>
    </aside>
  );
}
