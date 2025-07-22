import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CodeEditorPage from "./pages/CodeEditorPage";

export default function App() {
  return (
    <div className="bg-black text-white min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/editor" element={<CodeEditorPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
