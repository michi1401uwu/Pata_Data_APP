/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Solución para que los iconos de los marcadores aparezcan correctamente con Vite/React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Función de utilidad para estilizar el mensaje del asistente
const getAssistantMessageStyle = (nivel_gravedad) => {
    switch (nivel_gravedad) {
        case 'critico':
            return { background: '#ffe0e0', border: '1px solid #dc3545', color: '#dc3545' };
        case 'alerta':
            return { background: '#fffbe0', border: '1px solid #ffc107', color: '#ffc107' };
        case 'informativo':
            return { background: '#e0f7fa', border: '1px solid #17a2b8', color: '#17a2b8' };
        default:
            return { background: '#f8f9fa', border: '1px solid #ccc', color: '#333' };
    }
};


const API_BASE = 'http://127.0.0.1:8000/api';

function Dashboard() {
    const navigate = useNavigate();
    const [rol] = useState(localStorage.getItem('rol') || '');
    const [correoUsuario, setCorreoUsuario] = useState(localStorage.getItem('correo') || '');

    const [nombre, setNombre] = useState('');
    const [especie, setEspecie] = useState('');
    const [raza, setRaza] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [misMascotas, setMisMascotas] = useState([]);
    const [signosMascota, setSignosMascota] = useState({});
    const [historialMascota, setHistorialMascota] = useState({});
    const [editandoId, setEditandoId] = useState(null);

    const [kardexMascota, setKardexMascota] = useState({});
    const [nuevoKardexTipo, setNuevoKardexTipo] = useState('vacuna');
    const [nuevoKardexDesc, setNuevoKardexDesc] = useState('');

    const [nombreEdit, setNombreEdit] = useState('');
    const [especieEdit, setEspecieEdit] = useState('');
    const [razaEdit, setRazaEdit] = useState('');
    const [infoAsistente, setInfoAsistente] = useState({});
    const [alertasMascota, setAlertasMascota] = useState({});
    const [activeSection, setActiveSection] = useState('INICIO');

    const [perfilDatos, setPerfilDatos] = useState({ nombre: '', apellido: '', correo: '', rol: '' });
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [perfilMensaje, setPerfilMensaje] = useState('');
    const [inicioData, setInicioData] = useState(null);

    const [busquedaNombre, setBusquedaNombre] = useState('');
    const [duenosEncontrados, setDuenosEncontrados] = useState([]);
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
    const [busquedaMensaje, setBusquedaMensaje] = useState('');

    // Estados para el Chat Kadsy
    const [chatHistory, setChatHistory] = useState([]);
    const [mensajeChat, setMensajeChat] = useState('');
    const [cargandoChat, setCargandoChat] = useState(false);
    const razasPorEspecie = {
        'Perro': ['Labrador', 'Poodle', 'Chihuahua', 'Pastor Alemán', 'Golden Retriever', 'Bulldog', 'Beagle', 'Pug', 'Otro'],
        'Gato': ['Siamés', 'Persa', 'Maine Coon', 'Bengala', 'Ragdoll', 'Esfinge', 'Común', 'Otro']
    };

    // Estilos constantes para la nueva estética "Pata Data"
    const styles = {
        appContainer: {
            display: 'flex',
            height: '100vh',
            backgroundColor: '#152433',
            fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
            color: '#000',
        },
        sidebar: {
            width: '260px',
            backgroundColor: '#8FA3B5',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderRight: '4px solid #000',
            overflowY: 'auto'
        },
        menuButton: (active) => ({
            backgroundColor: active ? '#E56B1F' : '#F5E6B8',
            border: '3px solid #000',
            borderRadius: '15px',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textAlign: 'left',
            textTransform: 'uppercase',
            boxShadow: active ? 'none' : '4px 4px 0px #000',
            transform: active ? 'translate(2px, 2px)' : 'none',
            transition: 'all 0.1s ease'
        }),
        header: {
            height: '100px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 30px',
        },
        headerButton: {
            backgroundColor: '#F0B144',
            border: '3px solid #000',
            borderRadius: '25px',
            padding: '10px 25px',
            fontWeight: 'bold',
            fontSize: '18px',
            marginRight: '15px'
        },
        logoBox: {
            backgroundColor: '#F5E6B8',
            border: '3px solid #000',
            borderRadius: '15px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 'bold',
            fontSize: '22px',
        },
        contentArea: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        tabCard: {
            backgroundColor: '#E56B1F',
            border: '3px solid #000',
            borderRadius: '25px',
            padding: '25px',
            marginBottom: '20px',
            minHeight: '200px',
            color: '#000',
            boxShadow: '6px 6px 0px #000',
        },
        input: {
            padding: '12px',
            borderRadius: '10px',
            border: '3px solid #000',
            fontFamily: 'inherit',
            fontSize: '16px'
        },
        saveButton: {
            backgroundColor: '#F0B144',
            border: '3px solid #000',
            borderRadius: '15px',
            padding: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px #000'
        }
    };

    useEffect(() => {
        if (correoUsuario) {
            cargarPerfil();
            cargarInicio();
        }

        if (rol === 'dueño' && correoUsuario) {
            cargarMascotas();
        }
    }, [rol, correoUsuario]);

    const cerrarSesion = () => {
        localStorage.clear();
        navigate('/login');
    };

    const cargarPerfil = async () => {
        if (!correoUsuario) return;

        try {
            const respuesta = await axios.get(`${API_BASE}/usuario/${correoUsuario}`);
            setPerfilDatos(respuesta.data);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            setPerfilMensaje('❌ No se pudo cargar el perfil.');
        }
    };

    const cargarMascotas = async () => {
        try {
            const respuesta = await axios.get(`${API_BASE}/mis-mascotas/${correoUsuario}`);
            setMisMascotas(Array.isArray(respuesta.data) ? respuesta.data : []);
        } catch (error) {
            console.error('Error al cargar mascotas:', error);
            setMensaje('❌ No se pudieron cargar las mascotas.');
        }
    };

    const cargarInicio = async () => {
        try {
            const respuesta = await axios.get(`${API_BASE}/inicio`);
            setInicioData(respuesta.data);
        } catch (error) {
            console.error('Error al cargar inicio:', error);
        }
    };

    const manejarRegistroMascota = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                nombre: nombre,
                especie: especie,
                raza: raza,
                correo_dueno: correoUsuario
            };

            await axios.post(`${API_BASE}/mascotas`, payload);

            setNombre('');
            setEspecie('');
            setRaza('');
            setMensaje(' Mascota registrada correctamente.');
            await cargarMascotas();
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error('Error al registrar la mascota:', error);
            setMensaje('❌ Error al registrar la mascota.');
        }
    };

    const actualizarPerfil = async (e) => {
        e.preventDefault();
        setPerfilMensaje('');

        if (!nuevoCorreo && !nuevaPassword) {
            setPerfilMensaje('❌ Ingresa un correo nuevo o una contraseña nueva.');
            return;
        }

        try {
            const params = new URLSearchParams();
            if (nuevoCorreo) params.append('new_correo', nuevoCorreo);
            if (nuevaPassword) params.append('new_password', nuevaPassword);

            await axios.put(`${API_BASE}/usuario/${correoUsuario}?${params.toString()}`);

            if (nuevoCorreo) {
                localStorage.setItem('correo', nuevoCorreo);
                setCorreoUsuario(nuevoCorreo);
                setPerfilDatos((prev) => ({ ...prev, correo: nuevoCorreo }));
            }

            setNuevoCorreo('');
            setNuevaPassword('');
            setPerfilMensaje('✅ Perfil actualizado con éxito.');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            if (error.response?.status === 400) {
                setPerfilMensaje(`❌ ${error.response.data.detail || 'Datos inválidos.'}`);
            } else {
                setPerfilMensaje('❌ No se pudo actualizar el perfil.');
            }
        }
    };

    const eliminarCuenta = async () => {
        const confirmado = window.confirm('¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.');
        if (!confirmado) return;

        try {
            await axios.delete(`${API_BASE}/usuario/${correoUsuario}`);
            localStorage.clear();
            navigate('/login');
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            setPerfilMensaje('❌ No se pudo eliminar la cuenta.');
        }
    };

    const buscarDuenoPorNombre = async (e) => {
        e.preventDefault();
        setBusquedaMensaje('');
        setDuenosEncontrados([]);
        setMascotaSeleccionada(null);

        if (!busquedaNombre.trim()) {
            setBusquedaMensaje('Ingresa el nombre o correo del dueño.');
            return;
        }

        try {
            const respuesta = await axios.get(`${API_BASE}/duenos`, {
                params: { nombre: busquedaNombre.trim() },
            });

            const dueños = Array.isArray(respuesta.data) ? respuesta.data : [];
            if (dueños.length === 0) {
                setBusquedaMensaje('❌ No se encontró ningún dueño con ese nombre.');
                return;
            }

            setDuenosEncontrados(dueños);
        } catch (error) {
            console.error('Error en búsqueda de dueño:', error);
            setBusquedaMensaje('❌ Error al buscar el dueño. Intenta de nuevo.');
        }
    };

    const seleccionarMascota = async (mascota) => {
        setMascotaSeleccionada(mascota);
        setBusquedaMensaje('');

        try {
            await verSignos(mascota.id);
            
            await cargarKardex(mascota.id);

            // Obtener interpretación del asistente
            try {
                const resAsistente = await axios.get(`${API_BASE}/mascotas/${mascota.id}/asistente`);
                setInfoAsistente(prev => ({ ...prev, [mascota.id]: resAsistente.data }));
            } catch (err) {
                console.error("Error asistente:", err);
            }

            // Obtener alertas para veterinarios
            if (rol === 'veterinario') {
                await cargarAlertas(mascota.id);
            }


        } catch (error) {
            console.error('Error al seleccionar mascota:', error);
            setBusquedaMensaje('❌ Error al cargar el historial de la mascota.');
        }
    };

    const simularCollar = async (mascotaId) => {
        try {
            await axios.post(`${API_BASE}/simular-collar/${mascotaId}`);
            await verSignos(mascotaId);
        } catch (error) {
            console.error('Error al simular el collar:', error);
            setMensaje('❌ Error al simular el collar.');
        }
    };

    const verSignos = async (mascotaId) => {
        try {
            const respuesta = await axios.get(`${API_BASE}/mascotas/${mascotaId}/historial`);
            const datos = Array.isArray(respuesta.data) ? respuesta.data : [];

            if (datos.length > 0) {
                setSignosMascota((prev) => ({ ...prev, [mascotaId]: datos[datos.length - 1] }));
                setHistorialMascota((prev) => ({ ...prev, [mascotaId]: datos }));

                // Actualizar asistente también al monitorear
                const resAsistente = await axios.get(`${API_BASE}/mascotas/${mascotaId}/asistente`);
                setInfoAsistente(prev => ({ 
                    ...prev, 
                    [mascotaId]: resAsistente.data 
                }));
            } else {
                setMensaje('ℹ️ La mascota no tiene datos de historial todavía.');
            }
        } catch (error) {
            console.error('Error al obtener el historial:', error);
            setMensaje('❌ No se pudo obtener el historial.');
        }
    };

    const cargarKardex = async (mascotaId) => {
        try {
            const res = await axios.get(`${API_BASE}/mascotas/${mascotaId}/kardex`);
            setKardexMascota(prev => ({ ...prev, [mascotaId]: res.data }));
        } catch (err) {
            console.error("Error al cargar Kardex:", err);
        }
    };

    const agregarEntradaKardex = async (e) => {
        e.preventDefault();
        if (!mascotaSeleccionada || !nuevoKardexDesc.trim()) return;

        try {
            await axios.post(`${API_BASE}/mascotas/kardex`, {
                mascota_id: mascotaSeleccionada.id,
                tipo: nuevoKardexTipo,
                descripcion: nuevoKardexDesc
            });
            setNuevoKardexDesc('');
            await cargarKardex(mascotaSeleccionada.id);
            
            // Forzar actualización del asistente tras cambios en historial clínico
            const resAsistente = await axios.get(`${API_BASE}/mascotas/${mascotaSeleccionada.id}/asistente`);
            setInfoAsistente(prev => ({ ...prev, [mascotaSeleccionada.id]: resAsistente.data }));
            
        } catch (err) {
            console.error("Error al agregar al Kardex:", err);
        }
    };

    const cargarAlertas = async (mascotaId) => {
        try {
            const respuesta = await axios.get(`${API_BASE}/mascotas/${mascotaId}/alertas`);
            const alertas = Array.isArray(respuesta.data) ? respuesta.data : [];
            setAlertasMascota(prev => ({
                ...prev,
                [mascotaId]: alertas
            }));
        } catch (error) {
            console.error('Error al cargar alertas:', error);
            setBusquedaMensaje('❌ No se pudieron cargar las alertas de la mascota.');
        }
    };

    const eliminarMascota = async (id) => {
        const confirmado = window.confirm('¿Estás segura de eliminar esta mascota? Se perderá todo su historial de análisis.');
        if (!confirmado) return;

        try {
            await axios.delete(`${API_BASE}/mascotas/${id}`);
            setMensaje('🗑️ Mascota eliminada.');
            cargarMascotas();
        } catch (error) {
            console.error('Error al eliminar mascota:', error);
            setMensaje('❌ No se pudo eliminar la mascota.');
        }
    };

    const guardarEdicion = async (id) => {
        try {
            const params = new URLSearchParams({
                nombre: nombreEdit,
                especie: especieEdit,
                raza: razaEdit,
            });

            await axios.put(`${API_BASE}/mascotas/${id}?${params.toString()}`);
            setEditandoId(null);
            setMensaje('✅ Datos actualizados.');
            await cargarMascotas();
        } catch (error) {
            console.error('Error al editar mascota:', error);
            setMensaje('❌ No se pudo actualizar la mascota.');
        }
    };

    const analizarSalud = (datos) => {
        if (!datos || typeof datos.temperatura === 'undefined') {
            return { mensaje: 'SIN DATOS', color: '#6c757d' };
        }

        const temp = Number(datos.temperatura);
        const pulsos = Number(datos.pulsaciones);

        if (temp > 40 || pulsos > 180) {
            return { mensaje: '🚨 MONITOREO CRÍTICO: RIESGO HEMODINÁMICO', color: '#dc3545' };
        }

        if (temp > 39.2 || temp < 37 || pulsos > 145) {
            return { mensaje: '⚠️ ALERTA: DESVIACIÓN DE RANGOS NORMALES', color: '#ffc107' };
        }

        return { mensaje: '✅ PACIENTE HEMODINÁMICAMENTE ESTABLE', color: '#28a745' };
    };

    const renderPerfil = () => (
        <div style={styles.tabCard}>
            <h3 style={{ textTransform: 'uppercase', marginBottom: '20px' }}>Configuración de Perfil</h3>
            <form onSubmit={actualizarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>Correo Electrónico:</label>
                    <input
                        type="email"
                        placeholder={perfilDatos.correo || "Nuevo correo"}
                        value={nuevoCorreo}
                        onChange={(e) => setNuevoCorreo(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <button type="submit" style={styles.saveButton}>
                    GUARDAR CAMBIOS
                </button>
            </form>
            {perfilMensaje && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{perfilMensaje}</p>}
        </div>
    );

    const renderSalud = () => {
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en INICIO</h3></div>;
        const historial = historialMascota[mascotaSeleccionada.id] || [];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>MONITOREO DE TEMPERATURA</h3>
                    <div style={{ height: '250px', background: '#fff', padding: '10px', borderRadius: '15px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historial}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha_hora" tick={{ fontSize: 10 }} />
                                <YAxis domain={[35, 42]} fontSize={10} />
                                <Tooltip />
                                <Line type="monotone" dataKey="temperatura" stroke="#ff4d4d" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>RITMO CARDIACO</h3>
                    <div style={{ height: '250px', background: '#fff', padding: '10px', borderRadius: '15px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historial}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha_hora" tick={{ fontSize: 10 }} />
                                <YAxis domain={[40, 200]} fontSize={10} />
                                <Tooltip />
                                <Line type="monotone" dataKey="pulsaciones" stroke="#007bff" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistorial = () => {
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en INICIO</h3></div>;
        const historial = historialMascota[mascotaSeleccionada.id] || [];
        return (
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>HISTORIAL CLÍNICO: {mascotaSeleccionada.nombre.toUpperCase()}</h3>
                <div style={{ maxHeight: '500px', overflowY: 'auto', background: '#F5E6B8', borderRadius: '15px', border: '3px solid #000', padding: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #000' }}>
                                <th style={{ padding: '10px' }}>Fecha/Hora</th>
                                <th style={{ padding: '10px' }}>Temp (°C)</th>
                                <th style={{ padding: '10px' }}>Pulso (bpm)</th>
                                <th style={{ padding: '10px' }}>Actividad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                                    <td style={{ padding: '10px' }}>{new Date(log.fecha_hora).toLocaleString()}</td>
                                    <td style={{ padding: '10px' }}>{log.temperatura}</td>
                                    <td style={{ padding: '10px' }}>{log.pulsaciones}</td>
                                    <td style={{ padding: '10px' }}>{log.estado_actividad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMaps = () => {
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en INICIO</h3></div>;
        const signo = signosMascota[mascotaSeleccionada.id];
        return (
            <div style={{ ...styles.tabCard, flex: 1 }}>
                <h3 style={{ textTransform: 'uppercase' }}>UBICACIÓN EN TIEMPO REAL: {mascotaSeleccionada.nombre.toUpperCase()}</h3>
                <div style={{ height: '500px', background: '#fff', borderRadius: '25px', border: '4px solid #000', overflow: 'hidden' }}>
                    {signo?.latitud ? (
                        <MapContainer center={[signo.latitud, signo.longitud]} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[signo.latitud, signo.longitud]}>
                                <Popup>📍 ¡{mascotaSeleccionada.nombre} está aquí!</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '20px' }}>
                            Sin datos de GPS. Simula datos en INICIO.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderKardex = () => {
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en INICIO</h3></div>;
        const entradas = kardexMascota[mascotaSeleccionada.id] || [];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>REGISTRO MÉDICO (KARDEX): {mascotaSeleccionada.nombre.toUpperCase()}</h3>
                    <form onSubmit={agregarEntradaKardex} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <select value={nuevoKardexTipo} onChange={(e) => setNuevoKardexTipo(e.target.value)} style={styles.input}>
                            <option value="vacuna">Vacuna</option>
                            <option value="alergia">Alergia</option>
                            <option value="condicion">Condición Médica</option>
                            <option value="tratamiento">Tratamiento</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Descripción del registro..." 
                            value={nuevoKardexDesc} 
                            onChange={(e) => setNuevoKardexDesc(e.target.value)} 
                            style={{ ...styles.input, flex: 1 }} 
                        />
                        <button type="submit" style={styles.saveButton}>AÑADIR</button>
                    </form>
                </div>

                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>HISTORIAL CLÍNICO Y ANTECEDENTES</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#F5E6B8', borderRadius: '15px', border: '3px solid #000', padding: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Tipo</th>
                                    <th style={{ padding: '10px' }}>Descripción</th>
                                    <th style={{ padding: '10px' }}>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entradas.map((entry) => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid #ccc' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#E56B1F' }}>{entry.tipo}</td>
                                        <td style={{ padding: '10px' }}>{entry.descripcion}</td>
                                        <td style={{ padding: '10px', fontSize: '12px' }}>{new Date(entry.fecha).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const enviarMensajeKadsy = async () => {
        if (!mensajeChat.trim() || !mascotaSeleccionada) return;

        const nuevoMensaje = { role: 'user', text: mensajeChat };
        setChatHistory(prev => [...prev, nuevoMensaje]);
        setMensajeChat('');
        setCargandoChat(true);

        try {
            const res = await axios.post(`${API_BASE}/chat`, {
                mascota_id: mascotaSeleccionada.id,
                mensaje: mensajeChat
            });
            setChatHistory(prev => [...prev, { role: 'kadsy', text: res.data.respuesta }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'kadsy', text: " Ups, algo salió mal. Inténtalo de nuevo." }]);
        } finally {
            setCargandoChat(false);
        }
    };

    const renderKadsy = () => {
        if (!mascotaSeleccionada) return (
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>💬 Kadsy: Tu Asistente Inteligente</h3>
                <p>¡Hola! Para poder ayudarte, primero selecciona una mascota en la pestaña <strong>INICIO</strong>.</p>
            </div>
        );
        
        return (
            <div style={{ ...styles.tabCard, display: 'flex', flexDirection: 'column', height: '600px', backgroundColor: '#8FA3B5' }}>
                <h3 style={{ textTransform: 'uppercase', marginBottom: '10px' }}>💬 CONSULTA CON KADSY</h3>
                <div style={{ flex: 1, overflowY: 'auto', background: '#F5E6B8', borderRadius: '15px', padding: '15px', marginBottom: '15px', border: '3px solid #000' }}>
                    <p style={{ fontSize: '13px', color: '#444', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                        <strong>Expediente:</strong> {mascotaSeleccionada.nombre} | {mascotaSeleccionada.especie} ({mascotaSeleccionada.raza})
                    </p>
                    {/* Resumen del Kardex para contexto visual en el Chat */}
                    <div style={{ marginBottom: '15px', fontSize: '12px', color: '#555' }}>
                        <strong>Contexto Clínico Detectado (Kardex):</strong>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                            {(kardexMascota[mascotaSeleccionada.id] || []).length > 0 ? (
                                kardexMascota[mascotaSeleccionada.id].map((entry, idx) => (
                                    <span key={idx} style={{ background: '#E56B1F', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {entry.tipo.toUpperCase()}: {entry.descripcion}
                                    </span>
                                ))
                            ) : (
                                <span style={{ fontStyle: 'italic' }}>Sin antecedentes previos. Kadsy analizará solo signos actuales.</span>
                            )}
                        </div>
                    </div>
                    {chatHistory.map((msg, i) => (
                        <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: '15px' }}>
                            <div style={{ 
                                display: 'inline-block', padding: '10px 15px', borderRadius: '15px', 
                                background: msg.role === 'user' ? '#E56B1F' : '#F5E6B8',
                                border: '2px solid #000', maxWidth: '85%', fontWeight: 'bold'
                            }}>
                                {msg.role === 'user' ? '👤 Tú: ' : ' Kadsy: '} {msg.text}
                            </div>
                        </div>
                    ))}
                    {cargandoChat && <p><em> Kadsy está analizando los signos vitales...</em></p>}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={mensajeChat} onChange={(e) => setMensajeChat(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajeKadsy()} placeholder={`Pregunta sobre la salud de ${mascotaSeleccionada.nombre}...`} style={{ ...styles.input, flex: 1 }} />
                    <button onClick={enviarMensajeKadsy} style={styles.saveButton}>ENVIAR</button>
                </div>
            </div>
        );
    };

    const renderOwnerDashboard = () => (
        <div style={{ padding: '20px' }}>
            {activeSection === 'SALUD' && renderSalud()}
            {activeSection === 'HISTORIAL' && renderHistorial()}
            {activeSection === 'MAPS' && renderMaps()}
            {activeSection === 'PERFIL' && renderPerfil()}
            {activeSection === 'KADSY' && renderKadsy()}
            {activeSection === 'KARDEX' && renderKardex()}
            {activeSection === 'MIS MASCOTAS' && renderMisMascotasSection()}
            
            {/* Sección por defecto para otras pestañas */}
            {['INICIO', 'COMUNIDAD'].includes(activeSection) && (
                <div style={styles.tabCard}>
                    {activeSection !== 'INICIO' && <h3 style={{ textTransform: 'uppercase' }}>SECCIÓN {activeSection}</h3>}
                    {activeSection === 'INICIO' && inicioData ? (
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '15px' }}>
                            <h1 style={{ 
                                fontSize: '42px', 
                                fontWeight: '900', 
                                textAlign: 'center', 
                                marginBottom: '25px', 
                                color: '#000',
                                textShadow: '4px 4px 0px #F0B144',
                                textTransform: 'uppercase',
                                lineHeight: '1.1'
                            }}>
                                {inicioData.mensaje}
                            </h1>
                            <p><strong>Total de mascotas en el sistema:</strong> {inicioData.cantidadMascotas}</p>
                            <p><em>Explora las opciones en el menú lateral para cuidar a tu mejor amigo.</em></p>
                            <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '15px' }}>
                                <h3 style={{ textTransform: 'uppercase' }}> ¿Qué es Pata-Data?</h3>
                                <p>Es un ecosistema inteligente diseñado para el monitoreo preventivo de salud animal. Combinamos collares IoT que miden signos vitales con una potente base de datos clínica para que tú y tu veterinario tengan información precisa en tiempo real.</p>
                                
                                <h3 style={{ textTransform: 'uppercase', marginTop: '20px' }}> Conoce a Kadsy</h3>
                                <p>Kadsy es tu asistente veterinario virtual impulsado por inteligencia artificial. No solo recibe datos, sino que los interpreta basándose en el historial médico (Kardex) de tu mascota.</p>
                                <p><strong>¿Qué puedes preguntarle?</strong></p>
                                <ul style={{ marginLeft: '20px' }}>
                                    <li>"¿Es normal que mi perro tenga 39.5°C si acaba de jugar?"</li>
                                    <li>"¿Qué relación hay entre sus pulsaciones actuales y su última vacuna?"</li>
                                    <li>"Interpretación de signos vitales según su raza y edad."</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p>Contenido en desarrollo para la pestaña {activeSection}.</p>
                    )}
                </div>
            )}
        </div>
    );

    const renderMisMascotasSection = () => (
        <>
            <section style={{ padding: '20px', border: '4px solid #000', borderRadius: '25px', background: '#F5E6B8', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px' }}>REGISTRAR NUEVA MASCOTA</h3>
                <form onSubmit={manejarRegistroMascota} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={styles.input} />
                    <select value={especie} onChange={(e) => { setEspecie(e.target.value); setRaza(''); }} required style={styles.input}>
                        <option value="">Especie</option>
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                    </select>
                    <select value={raza} onChange={(e) => setRaza(e.target.value)} required style={styles.input} disabled={!especie}>
                        <option value="">Selecciona Raza</option>
                        {especie && razasPorEspecie[especie].map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    
                    <button type="submit" style={styles.saveButton}>AÑADIR</button>
                </form>
            </section>

            <section style={{ padding: '20px', border: '4px solid #000', borderRadius: '25px', background: '#8FA3B5' }}>
                <h3 style={{ margin: '0 0 15px' }}>MIS MASCOTAS ({misMascotas.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {misMascotas.map(mascota => (
                        <div key={mascota.id} style={{ 
                            background: mascotaSeleccionada?.id === mascota.id ? '#E56B1F' : '#F5E6B8',
                            border: '3px solid #000',
                            borderRadius: '15px',
                            padding: '15px',
                            boxShadow: '4px 4px 0px #000'
                        }}>
                            <h4 style={{ margin: '0 0 5px' }}>{mascota.nombre.toUpperCase()}</h4>
                            <p style={{ margin: '0 0 10px', fontSize: '14px' }}>{mascota.especie} | {mascota.raza}</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => seleccionarMascota(mascota)} style={{ flex: 1, ...styles.saveButton, padding: '8px', fontSize: '12px' }}>
                                    MONITOREAR
                                </button>
                                <button onClick={() => simularCollar(mascota.id)} style={{ ...styles.saveButton, backgroundColor: '#17a2b8', padding: '8px', color: '#fff' }}>
                                    📡
                                </button>
                                <button onClick={() => eliminarMascota(mascota.id)} style={{ ...styles.saveButton, backgroundColor: '#dc3545', padding: '8px', color: '#fff' }}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );

    const renderVetDashboard = () => {
        const historial = mascotaSeleccionada ? historialMascota[mascotaSeleccionada.id] || [] : [];
        const ultimoRegistro = historial.length > 0 ? historial[historial.length - 1] : null;
        const analisisBusqueda = analizarSalud(ultimoRegistro);

        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa' }}>
                    <h3>Búsqueda de dueño</h3>
                    <form onSubmit={buscarDuenoPorNombre} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Ingresa nombre, apellido o correo del dueño"
                            value={busquedaNombre}
                            onChange={(e) => setBusquedaNombre(e.target.value)}
                            required
                            style={{ padding: '10px', flex: '1 1 220px' }}
                        />
                        <button type="submit" style={{ padding: '10px 15px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            Buscar
                        </button>
                    </form>
                    {busquedaMensaje && <p style={{ marginTop: '15px', color: busquedaMensaje.includes('❌') ? '#c82333' : '#155724', fontWeight: 'bold' }}>{busquedaMensaje}</p>}
                </section>

                {duenosEncontrados.length > 0 && (
                    <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                        <h3>Dueños encontrados</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {duenosEncontrados.map((dueno) => (
                                <div key={dueno.id} style={{ padding: '15px', background: '#f1f3f5', borderRadius: '8px' }}>
                                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{dueno.nombre} {dueno.apellido}</p>
                                    <p style={{ margin: '0 0 10px', color: '#555' }}>{dueno.correo}</p>
                                    {dueno.mascotas.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {dueno.mascotas.map((mascota) => (
                                                <button
                                                    key={mascota.id}
                                                    onClick={() => seleccionarMascota(mascota)}
                                                    style={{ padding: '8px 12px', border: 'none', borderRadius: '6px', background: mascotaSeleccionada?.id === mascota.id ? '#17a2b8' : '#007bff', color: '#fff', cursor: 'pointer' }}
                                                >
                                                    {mascota.nombre} ({mascota.especie})
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: '#666' }}>Este dueño no tiene mascotas registradas.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {mascotaSeleccionada && (
                    <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                        <h3>Mascota seleccionada</h3>
                        <p><strong>ID:</strong> {mascotaSeleccionada.id}</p>
                        <p><strong>Nombre:</strong> {mascotaSeleccionada.nombre}</p>
                        <p><strong>Especie:</strong> {mascotaSeleccionada.especie}</p>
                        <p><strong>Raza:</strong> {mascotaSeleccionada.raza}</p>

                        {historial.length > 0 ? (
                            <>
                                <div style={{ margin: '15px 0', padding: '12px', borderRadius: '8px', background: analisisBusqueda.color, color: '#fff', fontWeight: 'bold' }}>
                                    {analisisBusqueda.mensaje}
                                </div>
                                <div style={{ height: '240px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historial}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="fecha_hora" tick={{ fontSize: 10 }} />
                                            <YAxis yAxisId="left" domain={[35, 42]} fontSize={10} />
                                            <YAxis yAxisId="right" orientation="right" domain={[60, 160]} fontSize={10} />
                                            <Tooltip />
                                            <Line yAxisId="left" type="monotone" dataKey="temperatura" stroke="#ff4d4d" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="pulsaciones" stroke="#007bff" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {infoAsistente[mascotaSeleccionada.id] && infoAsistente[mascotaSeleccionada.id].interpretacion && (
                                    <div style={{ 
                                        marginTop: '10px', 
                                        padding: '10px', 
                                        borderRadius: '5px', 
                                        fontSize: '13px',
                                        ...getAssistantMessageStyle(infoAsistente[mascotaSeleccionada.id].nivel_gravedad) // Aplicar estilo dinámico
                                    }}>
                                        <strong> Asistente Pata-Data:</strong>
                                        <p style={{ margin: '5px 0' }}>{infoAsistente[mascotaSeleccionada.id].interpretacion}</p>
                                        <small>💡 <em>{infoAsistente[mascotaSeleccionada.id].consejo}</em></small>
                                    </div>
                                )}

                                {alertasMascota[mascotaSeleccionada.id] && alertasMascota[mascotaSeleccionada.id].length > 0 && (
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#fefefe', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                        <h4>Historial de Alertas</h4>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '5px', padding: '10px' }}>
                                            {alertasMascota[mascotaSeleccionada.id].map((alerta, index) => (
                                                <div key={index} style={{
                                                    marginBottom: '10px',
                                                    padding: '8px',
                                                    borderRadius: '5px',
                                                    borderLeft: `4px solid ${alerta.nivel_gravedad === 'critico' ? '#dc3545' : alerta.nivel_gravedad === 'alerta' ? '#ffc107' : '#17a2b8'}`,
                                                    background: alerta.nivel_gravedad === 'critico' ? '#ffe0e0' : alerta.nivel_gravedad === 'alerta' ? '#fffbe0' : '#e0f7fa',
                                                    fontSize: '13px'
                                                }}>
                                                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>
                                                        {new Date(alerta.fecha_hora).toLocaleString()} - <span style={{ textTransform: 'uppercase' }}>{alerta.nivel_gravedad}</span>
                                                    </p>
                                                    <p style={{ margin: '0 0 5px' }}>{alerta.interpretacion}</p>
                                                    <small style={{ color: '#555' }}>💡 {alerta.consejo}</small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </>
                        ) : (
                            <p style={{ marginTop: '15px', color: '#666' }}>La mascota no tiene registros de historial clínico aún.</p>
                        )}
                    </section>
                )}
            </div>
        );
    };

    return (
        <div style={styles.appContainer}>
            {(() => {
                const healthStatus = analizarSalud(mascotaSeleccionada ? signosMascota[mascotaSeleccionada.id] : null);
                return (
                    <>
            {/* 1. Menú Lateral (Sidebar) */}
            <aside style={styles.sidebar}>
                {['INICIO', 'MIS MASCOTAS', 'SALUD', 'HISTORIAL', 'MAPS', 'KADSY', 'KARDEX', 'COMUNIDAD', 'PERFIL'].map((tab) => (
                    <button 
                        key={tab} 
                        style={styles.menuButton(activeSection === tab)}
                        onClick={() => setActiveSection(tab)}
                    >
                        {tab}
                    </button>
                ))}
                <button onClick={cerrarSesion} style={{ ...styles.menuButton(false), marginTop: 'auto', backgroundColor: '#dc3545', color: 'white' }}>
                    SALIR
                </button>
            </aside>

            {/* Área de Contenido Principal */}
            <div style={styles.contentArea}>
                {/* 2. Barra Superior (Header) */}
                <header style={styles.header}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={styles.headerButton}>
                            {mascotaSeleccionada ? mascotaSeleccionada.nombre.toUpperCase() : 'SELECCIONA MASCOTA'}
                        </div>
                        <div style={{ ...styles.headerButton, backgroundColor: healthStatus.color, color: '#fff' }}>
                            {healthStatus.mensaje.split(':')[0]}
                        </div>
                    </div>
                    <div style={styles.logoBox}>
                        <span> Pata Data</span>
                    </div>
                </header>

                {/* 3. Contenido de Pestañas */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '0 30px 30px' }}>
                    {rol === 'dueño' ? renderOwnerDashboard() : rol === 'veterinario' ? renderVetDashboard() : (
                        <section style={styles.tabCard}>
                            <p>Rol no válido o no autenticado.</p>
                        </section>
                    )}
                </main>
            </div>
                    </>
                );
            })()}
        </div>
    );
}
export default Dashboard;
