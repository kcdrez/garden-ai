import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <>
      <NavBar />
      <div className="p-5">
        <Outlet />
      </div>
    </>
  );
}
