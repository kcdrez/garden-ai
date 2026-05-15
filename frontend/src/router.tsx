import { createBrowserRouter, redirect, useNavigate } from 'react-router-dom';
import App from './App';
import Gardens from './pages/Gardens';
import Login from './pages/Login';
import { auth } from './auth/auth';

function requireAuth() {
  if (!auth.isLoggedIn()) return redirect('/login');
  return null;
}

function Home() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Garden AI</h1>
      <button onClick={() => { auth.clearTokens(); navigate('/login'); }}>
        Logout
      </button>
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    loader: () => (auth.isLoggedIn() ? redirect('/gardens') : null),
  },
  {
    path: '/',
    element: <App />,
    loader: requireAuth,
    children: [
      { index: true, element: <Home /> },
      { path: 'gardens', element: <Gardens /> },
    ],
  },
]);
