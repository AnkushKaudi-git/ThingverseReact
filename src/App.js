import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/layout';
import ProtectedRoute from './protection/protectedRoute';
import './App.css'

// Component imports
import Login from './modules/login/login';
import SupportMonitoring from './modules/support/support-monitoring/components/support-monitoring';

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/support/support-monitoring" element={<ProtectedRoute><SupportMonitoring /></ProtectedRoute>} />
          <Route path='/' element={<Login />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}