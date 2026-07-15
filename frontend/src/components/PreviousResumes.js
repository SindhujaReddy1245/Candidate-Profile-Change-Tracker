import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";

export default function PreviousResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
      if (!currentUser?.id) {
        alert("Please login to view previous resumes.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:8000/users/${currentUser.id}/resumes`);
        setResumes(res.data);
      } catch (err) {
        console.error(err);
        alert("Unable to fetch resumes");
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleDelete = async (resumeId) => {
    try {
      await axios.delete(`http://localhost:8000/resumes/${resumeId}`);
      setResumes((current) => current.filter((resume) => resume.id !== resumeId));
    } catch (err) {
      console.error(err);
      alert("Unable to delete resume");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">History</p>
            <h1>Previous Resumes</h1>
            <p className="muted-text">Review uploaded resume versions for the current candidate.</p>
          </div>
        </header>
        <section className="panel">
          {loading ? (
            <div className="empty-state">
              <h3>Loading resumes...</h3>
            </div>
          ) : resumes.length === 0 ? (
            <div className="empty-state">
              <h3>No resumes uploaded yet</h3>
              <p>Uploaded candidate resumes will be listed here.</p>
            </div>
          ) : (
            <div className="resume-table">
              {resumes.map((resume) => (
                <div className="resume-row" key={resume.id}>
                  <div>
                    <strong>Version {resume.version}</strong>
                    <span>{resume.file_path}</span>
                  </div>
                  <button className="danger-button" onClick={() => handleDelete(resume.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
