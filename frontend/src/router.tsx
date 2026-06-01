import { createBrowserRouter, redirect } from 'react-router-dom';
import App from './App';
import AllGardens from './pages/gardens/AllGardens';
import GardenDetail from './pages/gardens/GardenDetail';
import AllBeds from './pages/beds/AllBeds';
import BedDetail from './pages/beds/BedDetail';
import AllPlants from './pages/plants/AllPlants';
import PlantDetail from './pages/plants/PlantDetail';
import ProfilePage from './pages/profile/ProfilePage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { auth } from './auth/auth';

function requireAuth() {
  if (!auth.isLoggedIn()) return redirect('/login');
  return null;
}

function Home() {
  return (
    <div className="text-center py-12">
      <h1>Welcome to Garden AI</h1>
      <p className="text-muted-foreground">
        Manage and visualize your home garden layouts.
      </p>
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
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    path: '/',
    element: <App />,
    loader: requireAuth,
    children: [
      { index: true, element: <Home /> },
      { path: 'gardens', element: <AllGardens /> },
      { path: 'gardens/:id', element: <GardenDetail /> },
      { path: 'gardens/:id/beds/:bedId', element: <BedDetail /> },
      { path: 'beds', element: <AllBeds /> },
      { path: 'plants', element: <AllPlants /> },
      { path: 'plants/:plantId', element: <PlantDetail /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
