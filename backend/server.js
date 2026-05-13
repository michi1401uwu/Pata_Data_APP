require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/api/inicio', async (req, res) => {
    try {
        const db = require('./config/db');

        db.query('SELECT COUNT(*) AS total FROM mascotas', (err, results) => {
        if (err) {
            console.error('Error al contar mascotas:', err);
            return res.status(500).json({ mensaje: 'Error al obtener datos de inicio' });
        }

        const cantidadMascotas = results[0]?.total || 0;
        const fechaHora = new Date().toISOString();
        const modulos = [
            'Autenticación y autorización',
            'CRUD de mascotas',
            'Simulación de datos biométricos',
            'Análisis de salud y gráficos',
            'Perfil de usuario y veterinario',
        ];

        res.json({
            mensaje: 'Bienvenido a Pata-Data, tu sistema de monitoreo biométrico para mascotas',
            fechaHora,
            modulos,
            cantidadMascotas,
        });
        });
    } catch (error) {
        console.error('Error en /api/inicio:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor de auth de Pata-Data funcionando.' });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
