import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Registro() {
    const navigate = useNavigate();
    const [tipo, setTipo] = useState('dueño'); // Controla qué formulario mostrar
    const [mensaje, setMensaje] = useState('');

    // Datos generales
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    
    // Datos exclusivos de veterinario
    const [cedula, setCedula] = useState('');
    const [especialidad, setEspecialidad] = useState('');
    const [centro, setCentro] = useState('');

    const manejarRegistro = async (e) => {
        e.preventDefault();
        setMensaje('Procesando...');
        
        // Enviamos un objeto plano (JSON) para que coincida con Pydantic en FastAPI
        const datosParaEnviar = {
            nombre,
            apellido,
            correo,
            password
        };

        let url = 'http://127.0.0.1:8000/api/registro/usuario';

        if (tipo === 'veterinario') {
            datosParaEnviar.cedula = cedula;
            datosParaEnviar.especialidad = especialidad;
            datosParaEnviar.centro_veterinario = centro;
            url = 'http://127.0.0.1:8000/api/registro/veterinario';
        }

        try {
            await axios.post(url, datosParaEnviar);
            setMensaje('✅ ¡Registro exitoso! Redirigiendo...');
        setTimeout(() => navigate('/login'), 2000); // Lo manda al login después de 2 segundos
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setMensaje('❌ Error: Este correo ya está registrado.');
            } else {
                setMensaje('❌ Error al registrar. Revisa los datos.');
            }
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center' }}>Crear cuenta en Pata-Data</h2>
        
        {/* Botones para elegir el tipo de usuario */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <button 
                onClick={() => setTipo('dueño')}
                style={{ padding: '10px', background: tipo === 'dueño' ? '#007bff' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Soy Dueño
            </button>
            <button 
                onClick={() => setTipo('veterinario')}
                style={{ padding: '10px', background: tipo === 'veterinario' ? '#28a745' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                Soy Veterinario
            </button>
        </div>

        <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Campos Generales */}
            <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ padding: '8px' }}/>
            <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required style={{ padding: '8px' }}/>
        
            {/* Campos condicionales (Solo aparecen si es veterinario) */}
            {tipo === 'veterinario' && (
                <>
                    <input type="text" placeholder="Cédula Profesional" value={cedula} onChange={(e) => setCedula(e.target.value)} required style={{ padding: '8px' }}/>
                    <input type="text" placeholder="Especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} required style={{ padding: '8px' }}/>
                    <input type="text" placeholder="Centro Veterinario" value={centro} onChange={(e) => setCentro(e.target.value)} required style={{ padding: '8px' }}/>
                </>
            )}

                {/* Credenciales */}
                <input type="email" placeholder="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ padding: '8px' }}/>
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '8px' }}/>
                
                <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
                    Registrarme
                </button>
            </form>

            {/* Mensaje de éxito o error */}
            {mensaje && <p style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '15px' }}>{mensaje}</p>}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
                Ya tengo cuenta, ir al Login
                </button>
            </div>
        </div>
    );
}

export default Registro;