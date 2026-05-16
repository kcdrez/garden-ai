import { createBrowserRouter, redirect } from 'react-router-dom';
import App from './App';
import Gardens from './pages/Gardens';
import GardenDetail from './pages/GardenDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import { auth } from './auth/auth';
import { LoadingSpinner } from './components/ui/query-state';

function requireAuth() {
  if (!auth.isLoggedIn()) return redirect('/login');
  return null;
}

function Home() {
  return (
    <div className="text-center py-12">
      <h1>Welcome to Garden AI</h1>
      <p className="text-muted-foreground">Manage and visualize your home garden layouts.</p>
      <LoadingSpinner />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    loader: () => (auth.isLoggedIn() ? redirect('/gardens') : null),
  },
  {
    path: '/register',
    element: <Register />,
    loader: () => (auth.isLoggedIn() ? redirect('/gardens') : null),
  },
  {
    path: '/',
    element: <App />,
    loader: requireAuth,
    children: [
      { index: true, element: <Home /> },
      { path: 'gardens', element: <Gardens /> },
      { path: 'gardens/:id', element: <GardenDetail /> },
    ],
  },
]);
