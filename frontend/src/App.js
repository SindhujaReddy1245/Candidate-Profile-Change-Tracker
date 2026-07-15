import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import UploadResume from "./components/UploadResume";
import PreviousResumes from "./components/PreviousResumes";
import "./styles/app.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/upload" element={<UploadResume />} />
        <Route path="/dashboard/previous" element={<PreviousResumes />} />


      </Routes>
    </BrowserRouter>
  );
}
export default App;
