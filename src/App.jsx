import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import AddCar from './pages/AddCar';
import ReportIncident from './pages/ReportIncident';

function App() {
  return (
    <BrowserRouter>
      {/* Global Background Color */}
      <div className="min-h-screen bg-sentinel-bg text-gray-100 font-sans pb-20 md:pb-0">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddCar />} />
          <Route path="/report" element={<ReportIncident />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
