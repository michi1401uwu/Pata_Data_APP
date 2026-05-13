import { Navigate } from 'react-router-dom';

// Este componente envuelve a las rutas que queremos proteger
function RutaSegura({ children }) {
    // Buscamos el gafete (token) en la memoria del navegador
    const token = localStorage.getItem('token');

    // Si no hay token, el guardia lo manda al /login inmediatamente
    if (!token) {
        return <Navigate to="/login" />;
    }

    // Si sí hay token, lo deja pasar al componente que solicitó (el Dashboard)
    return children;
}

export default RutaSegura;