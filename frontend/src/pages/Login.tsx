import { useState } from "react";
import { login } from "../api/auth";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Garden AI Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <br />

        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        <button type="submit">Login</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
