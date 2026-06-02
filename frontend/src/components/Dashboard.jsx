/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import VetDashboard from './VetDashboard';

import logoImg from '../../../img/logo.jpg';
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
    const [rol, setRol] = useState(localStorage.getItem('rol') || '');
    const [correoUsuario, setCorreoUsuario] = useState(localStorage.getItem('correo') || '');

    const [nombre, setNombre] = useState('');
    const [especie, setEspecie] = useState('');
    const [raza, setRaza] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [misMascotas, setMisMascotas] = useState([]);
    const [signosMascota, setSignosMascota] = useState({});
    const [historialMascota, setHistorialMascota] = useState({});
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
    const [editandoId, setEditandoId] = useState(null);
    const [busquedaMensaje, setBusquedaMensaje] = useState('');

    const [chatHistory, setChatHistory] = useState([]);
    const [mensajeChat, setMensajeChat] = useState('');
    const [cargandoChat, setCargandoChat] = useState(false);

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

    // Estados de Comunidad y Búsqueda
    const [foroPosts, setForoPosts] = useState([]);
    const [nuevoPost, setNuevoPost] = useState('');
    const [veterinarios, setVeterinarios] = useState([]);
    const [vetParaChat, setVetParaChat] = useState(null);
    const [mensajesChatVet, setMensajesChatVet] = useState([]);
    const [nuevoMsjVet, setNuevoMsjVet] = useState('');

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
            padding: '0 0 0 30px',
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
            borderTop: 'none',
            borderRight: 'none',
            borderRadius: '0 0 0 20px',
            padding: '10px 25px',
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
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
        // Sincronizar estados con localStorage al montar el componente
        const currentRol = localStorage.getItem('rol') || '';
        const currentCorreo = localStorage.getItem('correo') || '';

        setRol(currentRol);
        setCorreoUsuario(currentCorreo);

        if (currentCorreo) {
            cargarPerfil();
            cargarInicio();
        }

        if (currentRol === 'dueno' && currentCorreo) {
            cargarMascotas();
        }

        if (activeSection === 'COMUNIDAD') cargarForo();
        if (activeSection === 'BUSCAR VETS' || activeSection === 'COMUNIDAD') cargarVeterinarios();
    }, [rol, correoUsuario, activeSection]);

    const cargarForo = async () => {
        try {
            const res = await axios.get(`${API_BASE}/foro`);
            setForoPosts(res.data);
        } catch (e) { console.error(e); }
    };

    const cargarVeterinarios = async () => {
        try {
            const res = await axios.get(`${API_BASE}/veterinarios`);
            setVeterinarios(res.data);
        } catch (e) { console.error(e); }
    };

    const enviarPostForo = async (e) => {
        e.preventDefault();
        if (!nuevoPost.trim()) return;
        try {
            await axios.post(`${API_BASE}/foro`, { contenido: nuevoPost, correo: correoUsuario });
            setNuevoPost('');
            cargarForo();
        } catch (e) { console.error(e); }
    };

    const enviarComentarioVet = async (vetId, comentario) => {
        try {
            await axios.post(`${API_BASE}/comentarios-vet`, { vet_id: vetId, correo_usuario: correoUsuario, comentario });
            alert("✅ Comentario enviado al perfil del veterinario.");
        } catch (e) { console.error(e); }
    };

    const abrirChatVet = async (vet) => {
        setVetParaChat(vet);
        try {
            const res = await axios.get(`${API_BASE}/mensajes/${correoUsuario}/${vet.correo}`);
            setMensajesChatVet(res.data);
        } catch (e) { console.error(e); }
    };

    const enviarMensajeVet = async () => {
        if (!nuevoMsjVet.trim()) return;
        try {
            await axios.post(`${API_BASE}/mensajes`, { emisor: correoUsuario, receptor: vetParaChat.correo, contenido: nuevoMsjVet });
            setNuevoMsjVet('');
            abrirChatVet(vetParaChat);
        } catch (e) { console.error(e); }
    };

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

    const seleccionarMascota = async (mascota) => {
        setMascotaSeleccionada(mascota);
        setBusquedaMensaje('');
        try {
            await verSignos(mascota.id);
            await cargarKardex(mascota.id);
            await cargarAlertas(mascota.id);
            setActiveSection('SALUD');
        } catch (error) {
            console.error('Error al seleccionar mascota:', error);
        }
    };

    const simularCollar = async (mascotaId) => {
        try {
            await axios.post(`${API_BASE}/simular-collar/${mascotaId}`);
            setMensaje('📡 Datos simulados enviados.');
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
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en "MIS MASCOTAS"</h3></div>;
        const historial = historialMascota[mascotaSeleccionada.id] || [];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>MONITOREO DE TEMPERATURA</h3>
                    <div style={{ height: '250px', width: '100%', background: '#fff', padding: '10px', borderRadius: '15px' }}>
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
                    <div style={{ height: '250px', width: '100%', background: '#fff', padding: '10px', borderRadius: '15px' }}>
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
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en "MIS MASCOTAS"</h3></div>;
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
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en "MIS MASCOTAS"</h3></div>;
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
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en "MIS MASCOTAS"</h3></div>;
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
                <p>¡Hola! Para poder ayudarte, primero selecciona una mascota en la pestaña <strong>"MIS MASCOTAS"</strong>.</p>
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

    const renderComunidad = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>📢 FORO DE LA COMUNIDAD</h3>
                <form onSubmit={enviarPostForo} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input type="text" placeholder="Comparte algo con otros dueños..." value={nuevoPost} onChange={(e) => setNuevoPost(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                    <button type="submit" style={styles.saveButton}>PUBLICAR</button>
                </form>
                <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#F5E6B8', borderRadius: '15px', padding: '15px', border: '3px solid #000' }}>
                    {foroPosts.map(post => (
                        <div key={post.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #000' }}>
                            <strong style={{ color: '#E56B1F' }}>{post.usuario}</strong>
                            <p style={{ margin: '5px 0' }}>{post.contenido}</p>
                            <small>{new Date(post.fecha).toLocaleString()}</small>
                        </div>
                    ))}
                </div>
            </div>
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>⭐ CALIFICAR VETERINARIOS</h3>
                <p style={{ fontSize: '14px', marginBottom: '10px' }}>Deja un comentario público sobre tu experiencia:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {veterinarios.slice(0, 5).map(v => (
                        <div key={v.id} style={{ background: '#F5E6B8', padding: '10px', borderRadius: '10px', border: '2px solid #000' }}>
                            <strong>Dr. {v.nombre} {v.apellido}</strong>
                            <input 
                                type="text" 
                                placeholder="Escribe tu reseña..." 
                                onKeyPress={(e) => { if(e.key === 'Enter') enviarComentarioVet(v.id, e.target.value); }}
                                style={{ ...styles.input, width: '100%', marginTop: '1px', fontSize: '12px' }} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderBusquedaVets = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>🏥 VETERINARIAS ASOCIADAS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {veterinarios.map(v => (
                        <div key={v.id} style={{ background: '#F5E6B8', padding: '15px', borderRadius: '15px', border: '3px solid #000' }}>
                            <h4>{v.centro_veterinario || 'Consultorio Profesional'}</h4>
                            <p>{v.nombre} {v.apellido} | {v.especialidad}</p>
                            <button onClick={() => abrirChatVet(v)} style={{ ...styles.saveButton, marginTop: '10px', fontSize: '12px' }}>💬 HABLAR POR CHAT</button>
                        </div>
                    ))}
                </div>
            </div>
            {vetParaChat && (
                <div style={{ ...styles.tabCard, backgroundColor: '#8FA3B5', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ textTransform: 'uppercase' }}>💬 CHAT: DR. {vetParaChat.nombre.toUpperCase()}</h3>
                    <div style={{ flex: 1, background: '#F5E6B8', borderRadius: '15px', padding: '15px', border: '3px solid #000', marginBottom: '10px', overflowY: 'auto', minHeight: '300px' }}>
                        {mensajesChatVet.map((m, i) => (
                            <div key={i} style={{ textAlign: m.emisor_correo === correoUsuario ? 'right' : 'left', marginBottom: '10px' }}>
                                <span style={{ background: m.emisor_correo === correoUsuario ? '#E56B1F' : '#fff', padding: '8px 12px', borderRadius: '10px', border: '2px solid #000', display: 'inline-block' }}>
                                    {m.contenido}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" value={nuevoMsjVet} onChange={(e) => setNuevoMsjVet(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajeVet()} style={{ ...styles.input, flex: 1 }} placeholder="Escribe un mensaje..." />
                        <button onClick={enviarMensajeVet} style={styles.saveButton}>ENVIAR</button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderOwnerDashboard = () => (
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 0 20px 0' }}>
            {activeSection === 'SALUD' && renderSalud()}
            {activeSection === 'HISTORIAL' && renderHistorial()}
            {activeSection === 'MAPS' && renderMaps()}
            {activeSection === 'PERFIL' && renderPerfil()}
            {activeSection === 'KADSY' && renderKadsy()}
            {activeSection === 'KARDEX' && renderKardex()}
            {activeSection === 'MIS MASCOTAS' && renderMisMascotasSection()}
            {activeSection === 'COMUNIDAD' && renderComunidad()}
            {activeSection === 'BUSCAR VETS' && renderBusquedaVets()}
            
            {/* Sección por defecto para otras pestañas */}
            {['INICIO'].includes(activeSection) && (
                <div style={styles.tabCard}>
                    {activeSection === 'INICIO' && inicioData ? (
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '25px', borderRadius: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                                <img src={logoImg} alt="Logo Pata Data" style={{ width: '140px', height: '140px', borderRadius: '35px', border: '4px solid #000', marginBottom: '15px' }} />
                                <h1 style={{ 
                                    fontSize: '42px', 
                                    fontWeight: '900', 
                                    textAlign: 'center', 
                                    margin: 0, 
                                    color: '#000',
                                    textShadow: '4px 4px 0px #F0B144',
                                    textTransform: 'uppercase',
                                    lineHeight: '1.1'
                                }}>
                                    {inicioData.mensaje}
                                </h1>
                            </div>
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

    return (
        <div style={styles.appContainer}>
            {rol === 'veterinario' ? (
                <VetDashboard />
            ) : (
                (() => {

                const healthStatus = analizarSalud(mascotaSeleccionada ? (signosMascota[mascotaSeleccionada.id] || null) : null);
                return (
                    <>
            {/* 1. Menú Lateral (Sidebar) */}
            <aside style={styles.sidebar}>
                {['INICIO', 'MIS MASCOTAS', 'SALUD', 'HISTORIAL', 'MAPS', 'KADSY', 'KARDEX', 'COMUNIDAD', 'BUSCAR VETS', 'PERFIL'].map((tab) => (
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

            {/* 2. Área de Contenido */}
            <div style={styles.contentArea}>
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={styles.headerButton}>
                            {mascotaSeleccionada ? `ESTADO DE ${mascotaSeleccionada.nombre.toUpperCase()}:` : 'SELECCIONA UNA MASCOTA'}
                        </div>
                        {mascotaSeleccionada && (
                            <div style={{ 
                                backgroundColor: healthStatus.color, 
                                padding: '10px 20px', 
                                borderRadius: '25px', 
                                color: '#fff', 
                                fontWeight: 'bold',
                                border: '3px solid #000'
                            }}>
                                {healthStatus.mensaje}
                            </div>
                        )}
                    </div>
                    <div style={styles.logoBox}>
                        <img src={logoImg} alt="Logo" style={{ height: '60px', borderRadius: '5px' }} />
                    </div>
                </header>

                <main style={styles.mainScrollArea}>
                    {renderOwnerDashboard()}
                </main>
            </div>
            </>
                );
            })()
            )}
        </div>
    );
}

export default Dashboard;