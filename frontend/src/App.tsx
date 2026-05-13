import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Gardens from "./pages/Gardens";
import { auth } from "./auth/auth";
import NavBar from "./components/NavBar";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(auth.isLoggedIn());

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <div>
        <NavBar />
        <div style={{ padding: 20 }}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1>Garden AI</h1>

                  <button
                    onClick={() => {
                      localStorage.clear();
                      setLoggedIn(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              }
            />
            <Route path="/gardens" element={<Gardens />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
