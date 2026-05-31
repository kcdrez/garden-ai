import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';
import AiChatWidget from './components/ai/AiChatWidget';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <div className="flex-1 p-5">
        <Outlet />
      </div>
      <Footer />
      <AiChatWidget />
    </div>
  );
}
