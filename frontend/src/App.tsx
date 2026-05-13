import { useEffect, useState } from "react";
import Login from "./pages/Login";
import { auth } from "./auth/auth";
import { api } from "./api/client";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(auth.isLoggedIn());
  const [gardens, setGardens] = useState<any[]>([]);

  const fetchGardens = async () => {
    const res = await api.get("/gardens/");
    setGardens(res.data);
  };

  useEffect(() => {
    if (loggedIn) {
      fetchGardens();
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Garden AI</h1>

      <button
        onClick={() => {
          localStorage.clear();
          setLoggedIn(false);
        }}
      >
        Logout
      </button>

      <h2>Your Gardens</h2>

      <pre>{JSON.stringify(gardens, null, 2)}</pre>
    </div>
  );
}
