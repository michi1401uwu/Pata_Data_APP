#  Pata-Data: Sistema de Monitoreo Biométrico para Mascotas

Pata-Data es una plataforma Full-Stack diseñada para monitorear los signos vitales de mascotas mediante simulación IoT. Permite a los dueños registrar a sus mascotas y a los veterinarios consultar historiales clínicos para diagnósticos preventivos.

##  Tecnologías Utilizadas
* **Frontend:** React.js, Vite, Axios, Recharts (para gráficas médicas).
* **Backend:** FastAPI (Python), SQLAlchemy, JWT (Autenticación).
* **Base de Datos:** MySQL.

## Instalación y Configuración

### 1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/tu-usuario/Pata_Data_APP.git
\`\`\`

### 2. Levantar el Backend (FastAPI)
Navega a la carpeta del backend y activa tu entorno virtual:
\`\`\`bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### 3. Levantar el Frontend (React)
Abre una nueva terminal, navega a la carpeta del frontend:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

##  Endpoints Principales (API REST)

**Módulo de Usuarios & Auth**
* \`POST /api/registro/usuario\` - Registra un nuevo dueño.
* \`POST /api/login\` - Autenticación y generación de JWT.
* \`PUT /api/usuario/{correo}\` - Actualiza contraseña o correo.
* \`DELETE /api/usuario/{correo}\` - Borrado en cascada del usuario y sus mascotas.

**Módulo de Mascotas (CRUD)**
* \`POST /api/mascotas\` - Registra una nueva mascota.
* \`GET /api/mis-mascotas/{correo}\` - Obtiene las mascotas de un dueño.
* \`PUT /api/mascotas/{id}\` - Edita datos de la mascota.
* \`DELETE /api/mascotas/{id}\` - Elimina una mascota.

**Módulo de Monitoreo IoT & Veterinario**
* \`POST /api/simular-collar/{id}\` - Inyecta datos biométricos aleatorios.
* \`GET /api/mascotas/{id}/historial\` - Obtiene el histórico de signos vitales para graficar.
* \`GET /api/duenos?nombre={query}\` - Buscador de dueños para uso veterinario.

---
**Desarrollado por:*katherinne michelle torres sierra*