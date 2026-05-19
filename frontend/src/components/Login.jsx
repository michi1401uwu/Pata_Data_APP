import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    
    const navigate = useNavigate();

    const manejarLogin = async (e) => {
        e.preventDefault();
        
        try {
        const respuesta = await axios.post('http://127.0.0.1:8000/api/login', {
            username: correo,
            password: password
        });
        
        // Guardamos el gafete de entrada
        localStorage.setItem('token', respuesta.data.access_token);
        localStorage.setItem('rol', respuesta.data.rol);
        localStorage.setItem('correo', correo);
        
        setMensaje('¡Inicio de sesión exitoso!');
        
        // Viajamos al Dashboard después de 1 segundo
        setTimeout(() => {
            navigate('/dashboard');
        }, 1000);

        } catch (error) {
        console.error("Detalles del error:", error);
        setMensaje('Error: Correo o contraseña incorrectos');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h2>Iniciar Sesión en Pata-Data</h2>
        <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={correo} 
            onChange={(e) => setCorreo(e.target.value)} 
            required 
            style={{ padding: '8px' }}
            />
            <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            Entrar
            </button>
        </form>
        
        {mensaje && (
            <p style={{ color: mensaje.includes('Error') ? 'red' : 'green', fontWeight: 'bold' }}>
            {mensaje}
            </p>
        )}

        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px', textAlign: 'center' }}>
            <p>¿Aún no tienes cuenta?</p>
            <button 
            onClick={() => navigate('/registro')} 
            style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
            >
            Crear una cuenta
            </button>
        </div>
        </div>
    );
}

export default Login;