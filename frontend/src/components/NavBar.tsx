import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
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
      </ul>
    </nav>
  );
}
