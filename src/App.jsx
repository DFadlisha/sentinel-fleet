import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddCar from './pages/AddCar';

function App() {
  return (
    <BrowserRouter>
      {/* Global Background Color */}
      <div className="min-h-screen bg-sentinel-bg text-gray-100 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddCar />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
