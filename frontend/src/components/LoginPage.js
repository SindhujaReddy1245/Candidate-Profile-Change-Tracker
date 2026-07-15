import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveUserAndOpenDashboard = (user) => {
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    sessionStorage.removeItem("latestUploadResult");
    navigate("/dashboard");
  };

  const handleLogin = async () => {
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await axios.post("http://127.0.0.1:8000/login", formData);
      saveUserAndOpenDashboard(res.data.user);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setMessage(detail || "Login failed. Please check your username and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("full_name", fullName);

    try {
      const res = await axios.post("http://127.0.0.1:8000/register", formData);
      saveUserAndOpenDashboard(res.data.user);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setMessage(detail || "Account creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRegistering = mode === "register";

  return (
    <div className="auth-page">
      <main className="login-card">
        <p className="eyebrow">Secure access</p>
        <h1>{isRegistering ? "Create Account" : "Welcome Back"}</h1>
        <p className="muted-text">
          {isRegistering
            ? "Create a recruiter account to store your resume uploads and comparison history."
            : "Sign in to review candidate profile updates and resume comparisons."}
        </p>

        <div className="segmented-control">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Sign Up</button>
        </div>

        {isRegistering ? (
          <label>
            Full Name
            <input placeholder="Sindhuja" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
        ) : null}

        <label>
          Username
          <input placeholder="demo" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input placeholder="demo" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {message ? <p className="form-message">{message}</p> : null}

        <button
          className="primary-button full-width"
          onClick={isRegistering ? handleRegister : handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait..." : isRegistering ? "Create Account" : "Login"}
        </button>
      </main>
    </div>
  );
}
