import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';
import AiChatWidget from './components/ai/AiChatWidget';

export default function App() {
  return (
    <>
      <NavBar />
      <div className="p-5">
        <Outlet />
      </div>
      <AiChatWidget />
    </>
  );
}
