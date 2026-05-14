# Pata-Data: Sistema de Monitoreo Biométrico para Mascotas

## Integrantes
* **Desarrollador:** [Torres Sirra Katherinne Michelle  y  Salvador Lopez Picazo] - Ingeniería en Sistemas Computacionales.

## Descripción de los 5 Módulos
1. **Gestión de Usuarios (Auth):** Sistema de registro y autenticación segura basada en tokens JWT para dueños y personal veterinario.
2. **Expediente de Mascotas (CRUD):** Plataforma para crear, consultar, modificar y eliminar perfiles de mascotas, vinculados de forma relacional a su dueño.
3. **Monitoreo IoT:** Endpoint inyector que simula la recepción de datos biométricos (temperatura y pulsaciones) emitidos por el collar inteligente.
4. **Análisis Clínico:** Motor de evaluación que determina el estado de la mascota mediante un semáforo de salud (Estable, Alerta, Crítico) y grafica su historial.
5. **Panel Veterinario:** Herramienta de búsqueda global por nombre, correo o apellido que permite a los médicos localizar pacientes rápidamente y auditar sus métricas.

## Comandos de Instalación

### 1. Levantar el Backend (FastAPI / Python)
\`\`\`bash
cd backend
# Activar entorno virtual
..\.venv\Scripts\activate
# Instalar dependencias
pip install -r requirements.txt
# Iniciar servidor
python -m uvicorn main:app --reload
\`\`\`

### 2. Levantar el Frontend (React / Vite)
\`\`\`bash
cd frontend
# Instalar dependencias de Node
npm install
# Iniciar servidor de desarrollo
npm run dev
\`\`\`

## Lista Completa de Endpoints (API REST)

**Autenticación y Usuarios**
* `POST /api/registro` - Registra un nuevo usuario encriptando su contraseña.
* `POST /api/login` - Valida credenciales y devuelve un Access Token (JWT).
* `GET /api/protegido` - Valida la autenticidad de un token en sesión.

**Mascotas**
* `POST /api/mascotas` - Crea un nuevo registro de mascota.
* `GET /api/mis-mascotas/{correo}` - Devuelve la lista de mascotas de un dueño.
* `GET /api/mascotas/{id}` - Obtiene los detalles de una mascota específica.
* `PUT /api/mascotas/{id}` - Actualiza nombre, especie o raza.
* `DELETE /api/mascotas/{id}` - Borra el expediente de la mascota.

**Veterinario y Monitoreo**
* `GET /api/inicio` - Retorna las estadísticas globales para el Dashboard.
* `GET /api/duenos?nombre={query}` - Buscador de dueños y sus mascotas.
* `POST /api/simular-collar/{id}` - Inyecta un paquete de datos biométricos aleatorios.
* `GET /api/mascotas/{id}/historial` - Devuelve el arreglo de signos vitales para graficar.