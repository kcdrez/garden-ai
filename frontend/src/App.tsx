import { useState } from "react";
import { login } from "./api/auth";
import { api } from "./api/client";

function App() {
  const [data, setData] = useState<any>(null);

  const handleLogin = async () => {
    await login("kcdrez", "Password123!");

    const res = await api.get("/gardens/");
    setData(res.data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Garden AI</h1>

      <button onClick={handleLogin}>Login + Fetch Gardens</button>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
