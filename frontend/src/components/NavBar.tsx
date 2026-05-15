import { useState } from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        borderBottom: "1px solid #eee",
      }}
    >
      <Link
        to="/"
        style={{
          fontWeight: 700,
          marginRight: "auto",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        Garden AI
      </Link>
      <ul
        style={{
          display: "flex",
          gap: 12,
          listStyle: "none",
          margin: 0,
          padding: 0,
          alignItems: "center",
        }}
      >
        <li>
          <Link
            to="/gardens"
            style={{ textDecoration: "none", color: "#0366d6" }}
          >
            View Gardens
          </Link>
        </li>
        <li>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </li>
      </ul>
    </nav>
  );
}
