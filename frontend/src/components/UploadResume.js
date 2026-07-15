import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";

export default function UploadResume() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  const handleUpload = async () => {
    if (!currentUser?.id) {
      alert("Please login before uploading a resume.");
      navigate("/login");
      return;
    }
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("candidate_id", 1);
    formData.append("version", 1);
    formData.append("uploaded_by", currentUser.id);
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload_resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = { ...res.data, fileName: file.name };
      sessionStorage.setItem("latestUploadResult", JSON.stringify(result));
      setUploadResult(result);
    } catch (err) {
      console.error(err);
      alert("Error uploading resume");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Upload</p>
            <h1>Upload Candidate Resume</h1>
            <p className="muted-text">Add a PDF resume to extract profile details and compare it with previous versions.</p>
          </div>
          <button className="secondary-button" onClick={() => navigate("/dashboard")}>Home</button>
        </header>

        <section className="upload-layout">
          <article className="panel upload-panel">
            <label className="file-drop">
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
              <span>{file ? file.name : "Choose a PDF resume"}</span>
              <small>PDF files only</small>
            </label>
            <button className="primary-button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload and Compare"}
            </button>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Result</p>
                <h2>Upload Summary</h2>
              </div>
            </div>
            {uploadResult ? (
              <div className="success-box">
                <h3>Resume uploaded successfully</h3>
                <p>
                  {uploadResult.fileName} has been processed as version {uploadResult.version}.{" "}
                  {uploadResult.has_previous
                    ? `${uploadResult.changes?.length || 0} comparison change(s) were detected.`
                    : "Upload one more resume for this candidate to generate comparison changes."}
                </p>
                <div className="button-row">
                  <button className="primary-button" onClick={() => navigate("/dashboard", { state: { uploadResult } })}>
                    View Dashboard
                  </button>
                  <button className="secondary-button" onClick={() => navigate("/dashboard")}>
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Waiting for upload</h3>
                <p>The comparison result will appear here after the file is processed.</p>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
