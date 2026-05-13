import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Registro from './components/Registro';
import Dashboard from './components/Dashboard';
import RutaSegura from './components/RutaSegura'; // <-- 1. Importamos al guardia

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      
      {/* 2. Envolvemos el Dashboard con la RutaSegura */}
      <Route 
        path="/dashboard" 
        element={
          <RutaSegura>
            <Dashboard />
          </RutaSegura>
        } 
      /> 
    </Routes>
  );
}

export default App;