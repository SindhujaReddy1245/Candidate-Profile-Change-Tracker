import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";

const emptyResult = {
  fileName: "No upload yet",
  resume: {},
  changes: [],
  has_previous: false,
};

const getSeverity = (classification = "") => {
  const label = classification.toLowerCase();
  if (label.includes("critical")) return "Critical";
  if (label.includes("important")) return "Important";
  if (label.includes("moderate")) return "Moderate";
  return "Minor";
};

export default function Dashboard() {
  const location = useLocation();
  const [latestResult, setLatestResult] = useState(emptyResult);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalResumes, setTotalResumes] = useState(0);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    setCurrentUser(user);

    if (location.state?.uploadResult) {
      sessionStorage.setItem("latestUploadResult", JSON.stringify(location.state.uploadResult));
      setLatestResult(location.state.uploadResult);
    }

    if (!user?.id) {
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/users/${user.id}/dashboard`);
        setTotalResumes(res.data.total_resumes || 0);
        if (res.data.latest_result) {
          setLatestResult(res.data.latest_result);
          sessionStorage.setItem("latestUploadResult", JSON.stringify(res.data.latest_result));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboard();
  }, [location.state]);

  const skills = useMemo(() => latestResult.resume?.skills || [], [latestResult]);
  const changes = latestResult.changes || [];
  const hasUpload = latestResult.fileName !== "No upload yet";
  const hasPrevious = Boolean(latestResult.has_previous);
  const severityCounts = changes.reduce(
    (counts, change) => {
      const severity = getSeverity(change.classification);
      counts[severity] += 1;
      return counts;
    },
    { Critical: 0, Important: 0, Moderate: 0, Minor: 0 }
  );
  const overallStatus = !hasUpload
    ? "Waiting for Upload"
    : !hasPrevious
      ? "Baseline Created"
      : severityCounts.Critical > 0
        ? "Critical Review Required"
        : severityCounts.Important > 0
          ? "Important Changes Found"
          : changes.length > 0
            ? "Minor Updates Found"
            : "No Differences Detected";
  const overallDescription = !hasUpload
    ? "Upload resumes to start comparison."
    : !hasPrevious
      ? "This is the first resume for this user, so it is stored as the baseline."
      : changes.length > 0
        ? "The latest resume was compared with the previous version and the detected changes are listed below."
        : "The latest resume was compared with the previous version and no tracked differences were found.";

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Candidate Profile Change Tracker</h1>
            <p className="muted-text">
              {currentUser?.username
                ? `Showing resume activity for ${currentUser.username}.`
                : "Login to view your resume activity."}
            </p>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total uploads</span>
            <strong>{totalResumes}</strong>
          </article>
          <article className="stat-card">
            <span>Latest file</span>
            <strong>{latestResult.fileName}</strong>
          </article>
          <article className="stat-card">
            <span>Detected skills</span>
            <strong>{skills.length}</strong>
          </article>
          <article className="stat-card">
            <span>Resume version</span>
            <strong>{latestResult.version || "-"}</strong>
          </article>
          <article className="stat-card">
            <span>Profile changes</span>
            <strong>{changes.length}</strong>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Comparison</p>
                <h2>Changes Found</h2>
              </div>
              <span className={changes.length > 0 ? "status-pill warning" : "status-pill"}>
                {changes.length > 0 ? "Review" : "Stable"}
              </span>
            </div>
            <div className="overall-status">
              <div>
                <span>Overall Status</span>
                <strong>{overallStatus}</strong>
                <p>{overallDescription}</p>
              </div>
              <div className="severity-grid">
                <div>
                  <span>Critical</span>
                  <strong>{severityCounts.Critical}</strong>
                </div>
                <div>
                  <span>Important</span>
                  <strong>{severityCounts.Important}</strong>
                </div>
                <div>
                  <span>Moderate</span>
                  <strong>{severityCounts.Moderate}</strong>
                </div>
                <div>
                  <span>Minor</span>
                  <strong>{severityCounts.Minor}</strong>
                </div>
              </div>
            </div>
            {changes.length === 0 ? (
              <div className="empty-state">
                <h3>{hasUpload && hasPrevious ? "No differences detected" : "No comparison available yet"}</h3>
                <p>
                  {hasUpload && hasPrevious
                    ? "The latest resume was compared with the previous version and no tracked differences were found."
                    : "Upload at least two resumes for the same candidate to see comparison differences here."}
                </p>
              </div>
            ) : (
              <div className="change-list">
                {changes.map((change, index) => (
                  <div className="change-item" key={`${change.change_type}-${index}`}>
                    <div>
                      <strong>{change.change_type}</strong>
                      <span>{change.classification}</span>
                    </div>
                    <p><b>Old:</b> {change.old_value}</p>
                    <p><b>New:</b> {change.new_value}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Extracted profile</p>
                <h2>Resume Signals</h2>
              </div>
            </div>
            <div className="signal-list">
              <div>
                <span>Skills</span>
                <strong>{skills.length ? skills.join(", ") : "No skills detected yet"}</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{latestResult.resume?.email || latestResult.resume?.phone || "No contact details detected yet"}</strong>
                {latestResult.resume?.email && latestResult.resume?.phone ? <p>{latestResult.resume.phone}</p> : null}
              </div>
              <div>
                <span>Resume preview</span>
                <p>{latestResult.resume?.summary || "Upload a resume to show extracted text here."}</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
