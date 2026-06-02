/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import logoImg from '../../../img/logo.jpg';

const API_BASE = 'http://127.0.0.1:8000/api';

const getAssistantMessageStyle = (nivel_gravedad) => {
    switch (nivel_gravedad) {
        case 'critico': return { background: '#ffe0e0', border: '1px solid #dc3545', color: '#dc3545' };
        case 'alerta': return { background: '#fffbe0', border: '1px solid #ffc107', color: '#ffc107' };
        case 'informativo': return { background: '#e0f7fa', border: '1px solid #17a2b8', color: '#17a2b8' };
        default: return { background: '#f8f9fa', border: '1px solid #ccc', color: '#333' };
    }
};

function VetDashboard() {
    const navigate = useNavigate();
    const [correoUsuario, setCorreoUsuario] = useState(localStorage.getItem('correo') || '');
    const [activeSection, setActiveSection] = useState('INICIO');
    
    const [busquedaNombre, setBusquedaNombre] = useState('');
    const [duenosEncontrados, setDuenosEncontrados] = useState([]);
    const [busquedaMensaje, setBusquedaMensaje] = useState('');
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
    const [historialMascota, setHistorialMascota] = useState({});
    const [infoAsistente, setInfoAsistente] = useState({});
    const [kardexMascota, setKardexMascota] = useState({});
    const [alertasMascota, setAlertasMascota] = useState({});
    const [perfilDatos, setPerfilDatos] = useState({ nombre: '', apellido: '', correo: '', rol: '' });
    const [inicioData, setInicioData] = useState(null);
    const [comentariosPublicos, setComentariosPublicos] = useState([]);

    // Estados para Chat
    const [contactos, setContactos] = useState([]);
    const [chatSeleccionado, setChatSeleccionado] = useState(null);
    const [mensajesChat, setMensajesChat] = useState([]);
    const [nuevoMsj, setNuevoMsj] = useState('');

    // Estados para edición de perfil
    const [nombreEdit, setNombreEdit] = useState('');
    const [apellidoEdit, setApellidoEdit] = useState('');
    const [cedulaEdit, setCedulaEdit] = useState('');
    const [especialidadEdit, setEspecialidadEdit] = useState('');
    const [centroEdit, setCentroEdit] = useState('');
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [perfilMensaje, setPerfilMensaje] = useState('');
    const [fotoPreview, setFotoPreview] = useState(null);

    const styles = {
        appContainer: { display: 'flex', height: '100vh', backgroundColor: '#152433', fontFamily: '"Comic Sans MS", "Comic Sans", cursive', color: '#000' },
        sidebar: { width: '280px', backgroundColor: '#8FA3B5', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '4px solid #000', overflowY: 'auto' },
        menuButton: (active) => ({
            backgroundColor: active ? '#E56B1F' : '#F5E6B8',
            border: '3px solid #000', borderRadius: '15px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase',
            boxShadow: active ? 'none' : '4px 4px 0px #000', transform: active ? 'translate(2px, 2px)' : 'none', transition: 'all 0.1s ease'
        }),
        header: { height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '50px', padding: '0 30px' },
        headerButton: { backgroundColor: '#F0B144', border: '3px solid #000', borderRadius: '25px', padding: '10px 25px', fontWeight: 'bold', fontSize: '18px' },
        logoBox: { 
            backgroundColor: '#F5E6B8', 
            border: '3px solid #000', 
            borderTop: 'none', 
            borderRight: 'none', 
            borderRadius: '0 0 0 20px', 
            padding: '10px 25px', 
            display: 'flex', 
            alignItems: 'center', 
            alignSelf: 'flex-start' },
        mainScrollArea: { flex: 1, padding: '30px', overflowY: 'auto' },
        contentArea: { 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
        },
        tabCard: { backgroundColor: '#E56B1F', border: '3px solid #000', borderRadius: '25px', padding: '25px', marginBottom: '20px', minHeight: '150px', color: '#000', boxShadow: '6px 6px 0px #000' },
        input: { padding: '12px', borderRadius: '10px', border: '3px solid #000', fontFamily: 'inherit', fontSize: '16px' },
        saveButton: { backgroundColor: '#F0B144', border: '3px solid #000', borderRadius: '15px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '4px 4px 0px #000' }
    };

    useEffect(() => {
        cargarPerfil();
        cargarInicio();
        if (activeSection === 'MENSAJES') cargarContactos();
    }, [activeSection]);

    const cargarPerfil = async () => {
        try {
            const res = await axios.get(`${API_BASE}/usuario/${correoUsuario}`);
            setPerfilDatos(res.data);
            setNombreEdit(res.data.nombre || '');
            setApellidoEdit(res.data.apellido || '');
            setCedulaEdit(res.data.cedula || '');
            setEspecialidadEdit(res.data.especialidad || '');
            setCentroEdit(res.data.centro_veterinario || '');
            setNuevoCorreo(res.data.correo || '');
            
            if (activeSection === 'COMENTARIOS') {
                 const resCom = await axios.get(`${API_BASE}/veterinarios/${res.data.id}/comentarios`);
                 setComentariosPublicos(resCom.data);
            }
        } catch (e) { console.error(e); }
    };

    const cargarContactos = async () => {
        try {
            const res = await axios.get(`${API_BASE}/contactos/${correoUsuario}`);
            setContactos(res.data);
        } catch (e) { console.error(e); }
    };

    const abrirChat = async (contactoCorreo) => {
        setChatSeleccionado(contactoCorreo);
        try {
            const res = await axios.get(`${API_BASE}/mensajes/${correoUsuario}/${contactoCorreo}`);
            setMensajesChat(res.data);
        } catch (e) { console.error(e); }
    };

    const enviarMensaje = async () => {
        if (!nuevoMsj.trim()) return;
        try {
            await axios.post(`${API_BASE}/mensajes`, {
                emisor: correoUsuario,
                receptor: chatSeleccionado,
                contenido: nuevoMsj
            });
            setNuevoMsj('');
            abrirChat(chatSeleccionado);
        } catch (e) { console.error(e); }
    };

    const cargarInicio = async () => {
        try {
            const res = await axios.get(`${API_BASE}/inicio`);
            setInicioData(res.data);
        } catch (e) { console.error(e); }
    };

    const cerrarSesion = () => { localStorage.clear(); navigate('/login'); };

    const manejarCambioFoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const actualizarPerfil = async (e) => {
        e.preventDefault();
        setPerfilMensaje('Actualizando...');
        try {
            const params = new URLSearchParams();
            if (nombreEdit) params.append('nombre', nombreEdit);
            if (apellidoEdit) params.append('apellido', apellidoEdit);
            if (cedulaEdit) params.append('cedula', cedulaEdit);
            if (especialidadEdit) params.append('especialidad', especialidadEdit);
            if (centroEdit) params.append('centro_veterinario', centroEdit);
            if (nuevoCorreo) params.append('new_correo', nuevoCorreo);
            if (nuevaPassword) params.append('new_password', nuevaPassword);

            await axios.put(`${API_BASE}/usuario/${correoUsuario}?${params.toString()}`);
            
            if (nuevoCorreo && nuevoCorreo !== correoUsuario) {
                localStorage.setItem('correo', nuevoCorreo);
                setCorreoUsuario(nuevoCorreo);
            }
            
            setPerfilMensaje('✅ Perfil actualizado con éxito.');
            cargarPerfil();
        } catch (error) {
            console.error(error);
            setPerfilMensaje('❌ Error al actualizar el perfil.');
        }
    };

    const buscarDuenoPorNombre = async (e) => {
        e.preventDefault();
        setBusquedaMensaje('Buscando...');
        try {
            const res = await axios.get(`${API_BASE}/duenos`, { params: { nombre: busquedaNombre } });
            setDuenosEncontrados(res.data);
            setBusquedaMensaje(res.data.length === 0 ? '❌ No se encontraron resultados.' : '');
        } catch (e) { setBusquedaMensaje('❌ Error en el servidor.'); }
    };

    const seleccionarMascota = async (mascota) => {
        setMascotaSeleccionada(mascota);
        try {
            const resHist = await axios.get(`${API_BASE}/mascotas/${mascota.id}/historial`);
            setHistorialMascota(prev => ({ ...prev, [mascota.id]: resHist.data }));
            const resAsis = await axios.get(`${API_BASE}/mascotas/${mascota.id}/asistente`);
            setInfoAsistente(prev => ({ ...prev, [mascota.id]: resAsis.data }));
            const resAlert = await axios.get(`${API_BASE}/mascotas/${mascota.id}/alertas`);
            setAlertasMascota(prev => ({ ...prev, [mascota.id]: resAlert.data }));
            const resKardex = await axios.get(`${API_BASE}/mascotas/${mascota.id}/kardex`);
            setKardexMascota(prev => ({ ...prev, [mascota.id]: resKardex.data }));
            setActiveSection('PACIENTES');
        } catch (e) { console.error(e); }
    };

    const analizarSalud = (datos) => {
        if (!datos || typeof datos.temperatura === 'undefined') return { mensaje: 'SIN DATOS', color: '#6c757d' };
        const temp = Number(datos.temperatura);
        if (temp > 39.5) return { mensaje: '🚨 CRÍTICO', color: '#dc3545' };
        if (temp > 39.2 || temp < 37.5) return { mensaje: '⚠️ ALERTA', color: '#ffc107' };
        return { mensaje: '✅ ESTABLE', color: '#28a745' };
    };

    const renderInicio = () => (
        <div style={{ ...styles.tabCard, textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <img src={logoImg} alt="Logo Pata Data" style={{ width: '120px', height: '120px', borderRadius: '25px', border: '4px solid #000' }} />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '36px', textTransform: 'uppercase', margin: 0 }}>Bienvenido a Pata-Data</h1>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Dr. {perfilDatos.nombre} {perfilDatos.apellido}</h2>
                </div>
            </div>
            <p>Panel de Gestión Veterinaria Pata-Data</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#F5E6B8', padding: '15px', borderRadius: '15px', border: '3px solid #000', width: '60%' }}>
                    <h3>Centro Veterinario:</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{perfilDatos.centro_veterinario || 'Consultorio Independiente'}</p>
                </div>
            </div>
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '15px', border: '2px solid #000' }}>
                <h3 style={{ textTransform: 'uppercase' }}>¿Qué es Pata-Data?</h3>
                <p>Pata-Data es una plataforma integral de monitoreo biométrico diseñada para revolucionar el cuidado de la salud animal. Mediante el uso de collares inteligentes IoT y motores de inteligencia artificial, permitimos a los médicos veterinarios y dueños de mascotas supervisar signos vitales en tiempo real, facilitando diagnósticos preventivos y una atención clínica de alta precisión.</p>
                <p style={{ marginTop: '10px' }}>Como profesional, en este panel podrás buscar perfiles de dueños, acceder al historial detallado de tus pacientes y auditar métricas críticas generadas por nuestro asistente de análisis IA.</p>
            </div>
        </div>
    );

    const renderBusqueda = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>Buscar Perfil de Dueño</h3>
                <form onSubmit={buscarDuenoPorNombre} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Ingresa nombre o correo..." value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                    <button type="submit" style={styles.saveButton}>BUSCAR</button>
                </form>
                {busquedaMensaje && <p style={{ marginTop: '10px' }}>{busquedaMensaje}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {duenosEncontrados.map(dueno => (
                    <div key={dueno.id} style={{ ...styles.tabCard, backgroundColor: '#8FA3B5' }}>
                        <h4>{dueno.nombre} {dueno.apellido}</h4>
                        <p style={{ fontSize: '13px' }}>{dueno.correo}</p>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {dueno.mascotas.map(m => (
                                <button key={m.id} onClick={() => seleccionarMascota(m)} style={{ ...styles.saveButton, padding: '5px 10px', fontSize: '12px' }}>
                                    {m.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPacientes = () => {
        if (!mascotaSeleccionada) return <div style={styles.tabCard}><h3>Selecciona una mascota en "Buscar Perfil" para ver sus detalles.</h3></div>;
        const historial = historialMascota[mascotaSeleccionada.id] || [];
        const analisis = analizarSalud(historial[historial.length - 1]);
        const asistente = infoAsistente[mascotaSeleccionada.id] || {};
        const notasKardex = kardexMascota[mascotaSeleccionada.id] || [];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.tabCard}>
                    <h3 style={{ textTransform: 'uppercase' }}>Ficha Clínica: {mascotaSeleccionada.nombre.toUpperCase()}</h3>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ background: analisis.color, color: '#fff', padding: '8px 15px', borderRadius: '15px', fontWeight: 'bold' }}>{analisis.mensaje}</div>
                        <div style={{ background: '#F5E6B8', padding: '8px 15px', borderRadius: '15px', border: '2px solid #000' }}>{mascotaSeleccionada.especie} - {mascotaSeleccionada.raza}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={styles.tabCard}>
                        <h4>Monitoreo de Temperatura (°C)</h4>
                        <div style={{ height: '200px', background: '#fff', padding: '10px', borderRadius: '15px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historial}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha_hora" tick={{ fontSize: 10 }} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="temperatura" stroke="#ff4d4d" dot={false} strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={styles.tabCard}>
                        <h4>Ritmo Cardiaco (bpm)</h4>
                        <div style={{ height: '200px', background: '#fff', padding: '10px', borderRadius: '15px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historial}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha_hora" tick={{ fontSize: 10 }} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="pulsaciones" stroke="#007bff" dot={false} strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={styles.tabCard}>
                        <h4>Diagnóstico Kadsy (IA)</h4>
                        {asistente.interpretacion ? (
                            <div style={{ ...getAssistantMessageStyle(asistente.nivel_gravedad), padding: '15px', borderRadius: '15px' }}>
                                <p><strong>Nota:</strong> {asistente.interpretacion}</p>
                                <small>💡 {asistente.consejo}</small>
                            </div>
                        ) : <p>Cargando análisis inteligente...</p>}
                    </div>
                    <div style={styles.tabCard}>
                        <h4>Notas del Expediente (Kardex)</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#F5E6B8', padding: '10px', borderRadius: '15px', border: '3px solid #000' }}>
                            {notasKardex.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #000' }}>
                                            <th style={{ textAlign: 'left', padding: '5px' }}>Tipo</th>
                                            <th style={{ textAlign: 'left', padding: '5px' }}>Descripción</th>
                                            <th style={{ textAlign: 'left', padding: '5px' }}>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notasKardex.map((nota, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                                                <td style={{ padding: '5px', fontWeight: 'bold' }}>{nota.tipo.toUpperCase()}</td>
                                                <td style={{ padding: '5px' }}>{nota.descripcion}</td>
                                                <td style={{ padding: '5px', fontSize: '11px' }}>{new Date(nota.fecha).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p>No hay registros en el Kardex.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPerfil = () => (
        <div style={styles.tabCard}>
            <h3 style={{ textTransform: 'uppercase' }}>Mi Perfil Profesional</h3>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Sección de Foto */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        width: '150px', height: '150px', borderRadius: '50%', border: '4px solid #000', 
                        overflow: 'hidden', backgroundColor: '#F5E6B8', display: 'flex', justifyContent: 'center', alignItems: 'center' 
                    }}>
                        {fotoPreview ? <img src={fotoPreview} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '50px' }}>👨‍⚕️</span>}
                    </div>
                    <label style={{ ...styles.saveButton, cursor: 'pointer', fontSize: '12px', padding: '8px' }}>
                        SUBIR FOTO
                        <input type="file" accept="image/*" onChange={manejarCambioFoto} style={{ display: 'none' }} />
                    </label>
                </div>

                {/* Formulario Editable */}
                <form onSubmit={actualizarPerfil} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', minWidth: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Nombre:</label>
                        <input type="text" value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Apellido:</label>
                        <input type="text" value={apellidoEdit} onChange={(e) => setApellidoEdit(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Cédula:</label>
                        <input type="text" value={cedulaEdit} onChange={(e) => setCedulaEdit(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Especialidad:</label>
                        <input type="text" value={especialidadEdit} onChange={(e) => setEspecialidadEdit(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Centro Veterinario:</label>
                        <input type="text" value={centroEdit} onChange={(e) => setCentroEdit(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Correo:</label>
                        <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: 'span 2' }}>
                        <label>Cambiar Contraseña (opcional):</label>
                        <input type="password" placeholder="Nueva contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} style={styles.input} />
                    </div>
                    <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '10px' }}>
                        <button type="submit" style={styles.saveButton}>GUARDAR CAMBIOS</button>
                    </div>
                    {perfilMensaje && <p style={{ gridColumn: 'span 2', marginTop: '10px', fontWeight: 'bold' }}>{perfilMensaje}</p>}
                </form>
            </div>
        </div>
    );

    const renderComentarios = () => (
        <div style={styles.tabCard}>
            <h3 style={{ textTransform: 'uppercase' }}>Reseñas de la Comunidad</h3>
            <p>Estos comentarios son visibles para todos los usuarios:</p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comentariosPublicos.length > 0 ? comentariosPublicos.map((c, i) => (
                    <div key={i} style={{ background: '#F5E6B8', padding: '15px', borderRadius: '15px', border: '3px solid #000' }}>
                        <strong>👤 {c.usuario}</strong>
                        <p>"{c.comentario}"</p>
                        <small>{new Date(c.fecha).toLocaleDateString()}</small>
                    </div>
                )) : <p>Aún no has recibido comentarios públicos.</p>}
            </div>
        </div>
    );

    const renderPlaceholder = (titulo) => (
        <div style={styles.tabCard}>
            <h3 style={{ textTransform: 'uppercase' }}>{titulo}</h3>
            <p>Esta sección se encuentra en mantenimiento. Pronto podrás gestionar {titulo.toLowerCase()}.</p>
        </div>
    );

    const renderMensajes = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
            <div style={styles.tabCard}>
                <h3 style={{ textTransform: 'uppercase' }}>Bandeja de Entrada</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {contactos.length > 0 ? contactos.map((c, i) => (
                        <button key={i} onClick={() => abrirChat(c)} style={styles.menuButton(chatSeleccionado === c)}>
                            {c}
                        </button>
                    )) : <p>No tienes conversaciones activas.</p>}
                </div>
            </div>
            {chatSeleccionado && (
                <div style={{ ...styles.tabCard, backgroundColor: '#8FA3B5', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ textTransform: 'uppercase' }}>Chat: {chatSeleccionado}</h3>
                    <div style={{ flex: 1, background: '#F5E6B8', borderRadius: '15px', padding: '15px', border: '3px solid #000', marginBottom: '10px', overflowY: 'auto', minHeight: '300px' }}>
                        {mensajesChat.map((m, i) => (
                            <div key={i} style={{ textAlign: m.emisor_correo === correoUsuario ? 'right' : 'left', marginBottom: '10px' }}>
                                <span style={{ background: m.emisor_correo === correoUsuario ? '#E56B1F' : '#fff', padding: '8px 12px', borderRadius: '10px', border: '2px solid #000', display: 'inline-block' }}>
                                    {m.contenido}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" value={nuevoMsj} onChange={(e) => setNuevoMsj(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} style={{ ...styles.input, flex: 1 }} placeholder="Escribe tu respuesta..." />
                        <button onClick={enviarMensaje} style={styles.saveButton}>ENVIAR</button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={styles.appContainer}>
            <aside style={styles.sidebar}>
                <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', borderBottom: '3px solid #000', paddingBottom: '10px' }}></div>
                <button style={styles.menuButton(activeSection === 'INICIO')} onClick={() => setActiveSection('INICIO')}>INICIO</button>
                <button style={styles.menuButton(activeSection === 'BUSCAR PERFIL')} onClick={() => setActiveSection('BUSCAR PERFIL')}>BUSCAR PERFIL</button>
                <button style={styles.menuButton(activeSection === 'PACIENTES')} onClick={() => setActiveSection('PACIENTES')}>PACIENTES</button>
                <button style={styles.menuButton(activeSection === 'MI PERFIL')} onClick={() => setActiveSection('MI PERFIL')}>MI PERFIL</button>
                <button style={styles.menuButton(activeSection === 'COMENTARIOS')} onClick={() => setActiveSection('COMENTARIOS')}>COMENTARIOS</button>
                <button style={styles.menuButton(activeSection === 'MENSAJES')} onClick={() => setActiveSection('MENSAJES')}>MENSAJES</button>
                <button style={styles.menuButton(activeSection === 'VETERINARIAS ASOCIADAS')} onClick={() => setActiveSection('VETERINARIAS ASOCIADAS')}>VETERINARIAS ASOCIADAS</button>
                
                <button onClick={cerrarSesion} style={{ ...styles.menuButton(false), marginTop: 'auto', backgroundColor: '#dc3545', color: 'white' }}>SALIR</button>
            </aside>

            <div style={styles.contentArea}>
                <header style={styles.header}>
                    <div style={styles.headerButton}>
                        {mascotaSeleccionada ? `ATENDIENDO A: ${mascotaSeleccionada.nombre.toUpperCase()}` : 'MODO CONSULTA'}
                    </div>
                    <div style={styles.logoBox}>
                        <img src={logoImg} alt="Logo" style={{ height: '60px', borderRadius: '5px' }} />
                    </div>
                </header>
                <main style={styles.mainScrollArea}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        {activeSection === 'INICIO' && renderInicio()}
                        {activeSection === 'BUSCAR PERFIL' && renderBusqueda()}
                        {activeSection === 'PACIENTES' && renderPacientes()}
                        {activeSection === 'MI PERFIL' && renderPerfil()}
                        {activeSection === 'COMENTARIOS' && renderComentarios()}
                        {activeSection === 'MENSAJES' && renderMensajes()}
                        {activeSection === 'VETERINARIAS ASOCIADAS' && renderPlaceholder('Veterinarias Asociadas')}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default VetDashboard;