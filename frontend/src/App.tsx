import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <>
      <NavBar />
      <div style={{ padding: 20 }}>
        <Outlet />
      </div>
    </>
  );
}
