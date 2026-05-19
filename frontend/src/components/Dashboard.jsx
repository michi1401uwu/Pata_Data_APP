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
    const [nombreEdit, setNombreEdit] = useState('');
    const [especieEdit, setEspecieEdit] = useState('');
    const [razaEdit, setRazaEdit] = useState('');
    const [infoAsistente, setInfoAsistente] = useState({});

    const [perfilDatos, setPerfilDatos] = useState({ nombre: '', apellido: '', correo: '', rol: '' });
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [perfilMensaje, setPerfilMensaje] = useState('');
    const [inicioData, setInicioData] = useState(null);

    const [busquedaNombre, setBusquedaNombre] = useState('');
    const [duenosEncontrados, setDuenosEncontrados] = useState([]);
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
    const [busquedaMensaje, setBusquedaMensaje] = useState('');

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
            setMensaje('🐾 Mascota registrada correctamente.');
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
            
            // Obtener interpretación del asistente
            try {
                const resAsistente = await axios.get(`${API_BASE}/mascotas/${mascota.id}/asistente`);
                setInfoAsistente(prev => ({ ...prev, [mascota.id]: resAsistente.data }));
            } catch (err) {
                console.error("Error asistente:", err);
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
            return { mensaje: 'Iniciando análisis...', color: '#6c757d' };
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

    const renderInicio = () => {
        if (!inicioData) return null;

        return (
            <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#e9f7ff' }}>
                <h2 style={{ marginTop: 0 }}>Bienvenido a Pata-Data</h2>
                <p style={{ margin: '10px 0' }}>{inicioData.mensaje}</p>
                <p style={{ margin: '5px 0' }}><strong>Fecha y hora del servidor:</strong> {new Date(inicioData.fechaHora).toLocaleString()}</p>
                <p style={{ margin: '5px 0' }}><strong>Total de mascotas registradas:</strong> {inicioData.cantidadMascotas}</p>
                <div style={{ marginTop: '15px' }}>
                    <strong>5 módulos del proyecto:</strong>
                    <ul style={{ margin: '10px 0 0 20px' }}>
                        {inicioData.modulos.map((modulo, index) => (
                            <li key={index}>{modulo}</li>
                        ))}
                    </ul>
                </div>
            </section>
        );
    };

    const renderPerfil = () => (
        <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa' }}>
            <h3>Mi Perfil</h3>
            <p style={{ margin: '0 0 5px' }}><strong>Rol:</strong> {perfilDatos.rol || rol}</p>
            <p style={{ margin: '0 0 15px' }}><strong>Correo:</strong> {perfilDatos.correo || correoUsuario}</p>
            <p style={{ margin: '0 0 15px' }}><strong>Nombre:</strong> {perfilDatos.nombre || '—'} {perfilDatos.apellido || ''}</p>

            <form onSubmit={actualizarPerfil} style={{ display: 'grid', gap: '12px' }}>
                <input
                    type="email"
                    placeholder="Nuevo correo"
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <button
                    type="submit"
                    style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                    Actualizar perfil
                </button>
            </form>

            <button
                onClick={eliminarCuenta}
                style={{ marginTop: '15px', padding: '10px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
                Eliminar cuenta
            </button>

            {perfilMensaje && (
                <p style={{ marginTop: '15px', fontWeight: 'bold', color: perfilMensaje.includes('❌') ? '#c82333' : '#155724' }}>
                    {perfilMensaje}
                </p>
            )}
        </section>
    );

    const renderOwnerDashboard = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa' }}>
                <h3>Registrar Nueva Mascota</h3>
                <form onSubmit={manejarRegistroMascota} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ padding: '10px' }} />
                    <input type="text" placeholder="Especie" value={especie} onChange={(e) => setEspecie(e.target.value)} required style={{ padding: '10px' }} />
                    <input type="text" placeholder="Raza" value={raza} onChange={(e) => setRaza(e.target.value)} required style={{ padding: '10px' }} />
                    <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Agregar Mascota
                    </button>
                </form>
            </section>

            <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                <h3>Mis Mascotas ({misMascotas.length})</h3>
                {misMascotas.length === 0 ? (
                    <p style={{ color: '#666' }}>Aún no tienes mascotas registradas.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {misMascotas.map((mascota) => {
                            const signo = signosMascota[mascota.id];
                            const historial = historialMascota[mascota.id] || [];
                            const asistente = infoAsistente[mascota.id];
                            const analisis = analizarSalud(signo);

                            return (
                                <div key={mascota.id} style={{ padding: '15px', background: '#e9ecef', borderRadius: '5px', borderLeft: '5px solid #007bff' }}>
                                    {editandoId === mascota.id ? (
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            <input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} style={{ padding: '8px' }} />
                                            <input value={especieEdit} onChange={(e) => setEspecieEdit(e.target.value)} style={{ padding: '8px' }} />
                                            <input value={razaEdit} onChange={(e) => setRazaEdit(e.target.value)} style={{ padding: '8px' }} />
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => guardarEdicion(mascota.id)} style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                                    Guardar
                                                </button>
                                                <button onClick={() => setEditandoId(null)} style={{ padding: '8px 12px', background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{mascota.nombre}</h4>
                                                    <p style={{ margin: '5px 0 0', color: '#555' }}>{mascota.especie} | {mascota.raza}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => {
                                                        setEditandoId(mascota.id);
                                                        setNombreEdit(mascota.nombre);
                                                        setEspecieEdit(mascota.especie);
                                                        setRazaEdit(mascota.raza);
                                                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                                                        ✏️
                                                    </button>
                                                    <button onClick={() => eliminarMascota(mascota.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={() => simularCollar(mascota.id)} style={{ padding: '8px 12px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                            📡 Simular
                                        </button>
                                        <button onClick={() => verSignos(mascota.id)} style={{ padding: '8px 12px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            ❤️ Monitorear
                                        </button>
                                    </div>

                                    {asistente?.interpretacion && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: '#fff9c4', borderRadius: '5px', border: '1px solid #fbc02d', fontSize: '13px' }}>
                                            <strong>🤖 Asistente Pata-Data:</strong>
                                            <p style={{ margin: '5px 0' }}>{asistente.interpretacion}</p>
                                            <small>💡 <em>{asistente.consejo}</em></small>
                                        </div>
                                    )}

                                    {signo?.latitud && (
                                        <div style={{ marginTop: '10px', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                                            <MapContainer center={[signo.latitud, signo.longitud]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Marker position={[signo.latitud, signo.longitud]}>
                                                    <Popup>📍 ¡{mascota.nombre} está aquí!</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    )}

                                    {signo && (
                                        <div style={{ marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ccc' }}>
                                            <div style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                background: analisis.color,
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                marginBottom: '10px',
                                                fontSize: '13px',
                                            }}>
                                                {analisis.mensaje}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px' }}>
                                                🌡️ Temp: {signo.temperatura}°C | 💓 Pulso: {signo.pulsaciones} bpm
                                            </p>
                                        </div>
                                    )}

                                    {historial.length > 0 && (
                                        <div style={{ marginTop: '15px', height: '150px', background: '#fff', padding: '5px', borderRadius: '5px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={historial}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="id" hide />
                                                    <YAxis domain={[35, 42]} fontSize={10} />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="temperatura" stroke="#ff4d4d" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
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
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '960px', margin: '0 auto' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
                <h1>Pata-Data Dashboard</h1>
                <button onClick={cerrarSesion} style={{ padding: '8px 15px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Cerrar Sesión
                </button>
            </nav>

            {(mensaje || perfilMensaje) && (
                <div style={{ marginBottom: '20px', fontWeight: 'bold', color: (mensaje.includes('❌') || perfilMensaje.includes('❌')) ? '#c82333' : '#155724' }}>
                    {mensaje || perfilMensaje}
                </div>
            )}

            <div style={{ display: 'grid', gap: '20px' }}>
                {renderInicio()}
                {renderPerfil()}

                {rol === 'dueño' ? renderOwnerDashboard() : rol === 'veterinario' ? renderVetDashboard() : (
                    <section style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
                        <p style={{ color: '#666' }}>Rol no válido o no autenticado.</p>
                    </section>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
