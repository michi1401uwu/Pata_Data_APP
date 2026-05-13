from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List
import random
from fastapi import status
import models
from database import SessionLocal, engine

# --- 1. CONFIGURACIÓN DE SEGURIDAD (TOKEN JWT) ---
SECRET_KEY = "tu_llave_secreta_super_segura_pata_data"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 2. INICIALIZACIÓN DE LA APP Y CORS ---
app = FastAPI(title="Pata-Data API")

# Esto permite que tu Frontend (React) hable con tu Backend (Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crea las tablas en MySQL automáticamente
models.Base.metadata.create_all(bind=engine)

# --- 3. DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password):
    # Aseguramos que sea string para evitar errores de tipo o bytes
    return pwd_context.hash(str(password))

# --- 4. RUTAS (ENDPOINTS) ---

@app.get("/")
def read_root():
    return {"mensaje": "Backend de Pata-Data funcionando perfectamente"}

@app.get("/api/inicio")
def inicio(db: Session = Depends(get_db)):
    cantidad_mascotas = db.query(models.Mascota).count()
    modulos = [
        "Autenticación y autorización",
        "CRUD de mascotas",
        "Simulación de datos biométricos",
        "Análisis de salud y gráficos",
        "Perfil de usuario y veterinario",
    ]
    return {
        "mensaje": "Bienvenido a Pata-Data, tu sistema de monitoreo biométrico para mascotas",
        "fechaHora": datetime.utcnow().isoformat() + "Z",
        "modulos": modulos,
        "cantidadMascotas": cantidad_mascotas,
    }

# A) REGISTRO DE DUEÑO (USUARIO)
@app.post("/api/registro/usuario")
def registro_usuario(
    nombre: str = Form(...), 
    apellido: str = Form(...), 
    correo: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    # 1. Verificamos si ya existe para evitar errores de duplicado
    existe = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya existe")
    
    try:
        # 2. Creamos el objeto (Asegúrate de que los nombres coincidan con models.py)
        nuevo_usuario = models.Usuario(
            nombre=nombre, 
            apellido=apellido, 
            correo=correo, 
            password_hash=get_password_hash(password), 
            es_veterinario=False
        )
        
        # 3. Guardamos y confirmamos
        db.add(nuevo_usuario)
        db.commit() # Aquí es donde daba el error 500
        db.refresh(nuevo_usuario) # Para confirmar que MySQL le asignó un ID
        
        return {"mensaje": "Usuario registrado con éxito", "id": nuevo_usuario.id}
    
    except Exception as e:
        db.rollback() # Si algo falla, deshace el intento para no dejar basura
        print(f"Error real: {e}") # Mira esto en tu terminal negra de VS Code
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# B) REGISTRO DE VETERINARIO
@app.post("/api/registro/veterinario")
def registro_veterinario(
    nombre: str = Form(...), 
    apellido: str = Form(...), 
    cedula: str = Form(...), 
    especialidad: str = Form(...), 
    correo: str = Form(...), 
    password: str = Form(...), 
    centro_veterinario: str = Form(...), 
    db: Session = Depends(get_db)
):
    if db.query(models.Veterinario).filter(models.Veterinario.correo == correo).first():
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    
    nuevo_vet = models.Veterinario(
        nombre=nombre, 
        apellido=apellido, 
        cedula=cedula, 
        especialidad=especialidad, 
        correo=correo, 
        centro_veterinario=centro_veterinario, 
        password_hash=get_password_hash(password)
    )
    db.add(nuevo_vet)
    db.commit()
    return {"mensaje": "Veterinario registrado con éxito"}

# C) LOGIN (EL QUE TE DABA ERROR 401)
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Buscamos en ambas tablas
    user = db.query(models.Usuario).filter(models.Usuario.correo == form_data.username).first()
    tipo = "dueño"
    
    if not user:
        user = db.query(models.Veterinario).filter(models.Veterinario.correo == form_data.username).first()
        tipo = "veterinario"

    # Si no existe o la contraseña no coincide (hash), lanza el 401
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Si todo bien, genera el "pase de entrada" (Token)
    token = jwt.encode(
        {"sub": user.correo, "tipo": tipo, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, 
        SECRET_KEY, 
        algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer", "rol": tipo}

# D) OBTENER DATOS DEL COLLAR (EL "INYECTOR")
@app.get("/api/mascotas/{mascota_id}/signos-vitales")
def obtener_signos(mascota_id: int, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.DatoCollar).filter(models.DatoCollar.mascota_id == mascota_id).order_by(models.DatoCollar.fecha_hora.desc()).limit(limit).all()

# E) REGISTRAR UNA NUEVA MASCOTA
@app.post("/api/mascotas")
def registrar_mascota(
    nombre: str = Form(...),
    especie: str = Form(...),
    raza: str = Form(...),
    correo_dueno: str = Form(...), # Usamos el correo para saber de quién es
    db: Session = Depends(get_db)
):
    # 1. Buscamos al dueño en la base de datos
    dueno = db.query(models.Usuario).filter(models.Usuario.correo == correo_dueno).first()
    if not dueno:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")
    
    # 2. Creamos a la mascota y la enlazamos con el ID del dueño
    nueva_mascota = models.Mascota(
        nombre=nombre,
        especie=especie,
        raza=raza,
        dueno_id=dueno.id
    )
    db.add(nueva_mascota)
    db.commit()
    db.refresh(nueva_mascota)
    
    return {"mensaje": "Mascota registrada con éxito", "mascota_id": nueva_mascota.id}

# F) OBTENER LAS MASCOTAS DE UN DUEÑO
@app.get("/api/mis-mascotas/{correo_dueno}")
def obtener_mis_mascotas(correo_dueno: str, db: Session = Depends(get_db)):
    # 1. Buscamos al dueño
    dueno = db.query(models.Usuario).filter(models.Usuario.correo == correo_dueno).first()
    
    # 2. Si no existe, devolvemos una lista vacía
    if not dueno:
        return []
    
    # 3. Gracias a la "relationship" que hiciste en models.py, esto trae a todas sus mascotas mágicamente
    return dueno.mascotas

# G) SIMULAR EL COLLAR IOT PATA-DATA
@app.post("/api/simular-collar/{mascota_id}")
def simular_datos_collar(mascota_id: int, db: Session = Depends(get_db)):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")

    # Ajustamos los nombres según tu models.py
    nuevo_dato = models.DatoCollar(
        mascota_id=mascota_id,
        temperatura=round(random.uniform(37.5, 39.5), 1), 
        pulsaciones=random.randint(80, 140), # <-- Cambiado de ritmo_cardiaco a pulsaciones
        latitud=21.9333,
        longitud=-99.9667,
        estado_actividad="Activo" # Agregado porque lo tienes en tu modelo
    )
    
    db.add(nuevo_dato)
    db.commit()
    return {"mensaje": "📡 Datos simulados guardados con éxito"}

# H) OBTENER HISTORIAL PARA ANÁLISIS
@app.get("/api/mascotas/{mascota_id}/historial")
def obtener_historial(mascota_id: int, db: Session = Depends(get_db)):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mascota no encontrada")

    historial = db.query(models.DatoCollar)\
        .filter(models.DatoCollar.mascota_id == mascota_id)\
        .order_by(models.DatoCollar.fecha_hora.asc())\
        .limit(20)\
        .all()
    return historial

# H.1) OBTENER DATOS DE MASCOTA PARA VETERINARIO
@app.get("/api/mascotas/{mascota_id}")
def obtener_mascota(mascota_id: int, db: Session = Depends(get_db)):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mascota no encontrada")

    return {
        "id": mascota.id,
        "nombre": mascota.nombre,
        "especie": mascota.especie,
        "raza": mascota.raza,
        "dueno": {
            "id": mascota.dueno.id,
            "nombre": mascota.dueno.nombre,
            "apellido": mascota.dueno.apellido,
            "correo": mascota.dueno.correo,
        },
    }

    
# I) EDITAR MASCOTA (Update) - HTTP 200 OK
@app.put("/api/mascotas/{mascota_id}", status_code=status.HTTP_200_OK)
def actualizar_mascota(mascota_id: int, nombre: str, especie: str, raza: str, db: Session = Depends(get_db)):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    
    if not mascota:
        # HTTP 404 Not Found según MDN
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="La mascota especificada no existe en la base de datos."
        )
    
    if not nombre or not especie:
        # HTTP 400 Bad Request si faltan datos
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre y la especie son campos obligatorios."
        )

    mascota.nombre = nombre
    mascota.especie = especie
    mascota.raza = raza
    db.commit()
    return {"mensaje": "Mascota actualizada con éxito"}

# J) ELIMINAR MASCOTA (Delete) - HTTP 204 No Content
@app.delete("/api/mascotas/{mascota_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_mascota(mascota_id: int, db: Session = Depends(get_db)):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    
    if not mascota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No se puede eliminar: Mascota no encontrada."
        )
    
    db.delete(mascota)
    db.commit()
    # Al ser 204, el cuerpo de la respuesta suele ir vacío, pero la acción es exitosa.
    return None

# K) OBTENER PERFIL DE USUARIO
@app.get("/api/usuario/{correo}")
def obtener_usuario(correo: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if usuario:
        return {
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": "dueño",
        }

    veterinario = db.query(models.Veterinario).filter(models.Veterinario.correo == correo).first()
    if veterinario:
        return {
            "nombre": veterinario.nombre,
            "apellido": veterinario.apellido,
            "correo": veterinario.correo,
            "rol": "veterinario",
            "cedula": veterinario.cedula,
            "especialidad": veterinario.especialidad,
            "centro_veterinario": veterinario.centro_veterinario,
        }

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

# L) ACTUALIZAR PERFIL DE USUARIO
@app.put("/api/usuario/{correo}", status_code=status.HTTP_200_OK)
def actualizar_usuario(correo: str, new_correo: str = None, new_password: str = None, db: Session = Depends(get_db)):
    if not new_correo and not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere correo o contraseña para actualizar")

    usuario = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if usuario:
        if new_correo and new_correo != correo:
            if db.query(models.Usuario).filter(models.Usuario.correo == new_correo).first() or db.query(models.Veterinario).filter(models.Veterinario.correo == new_correo).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya está en uso")
            usuario.correo = new_correo

        if new_password:
            usuario.password_hash = get_password_hash(new_password)

        db.commit()
        return {"mensaje": "Perfil actualizado con éxito"}

    veterinario = db.query(models.Veterinario).filter(models.Veterinario.correo == correo).first()
    if veterinario:
        if new_correo and new_correo != correo:
            if db.query(models.Usuario).filter(models.Usuario.correo == new_correo).first() or db.query(models.Veterinario).filter(models.Veterinario.correo == new_correo).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya está en uso")
            veterinario.correo = new_correo

        if new_password:
            veterinario.password_hash = get_password_hash(new_password)

        db.commit()
        return {"mensaje": "Perfil actualizado con éxito"}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

# M) ELIMINAR CUENTA DE USUARIO
@app.delete("/api/usuario/{correo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(correo: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if usuario:
        mascotas = db.query(models.Mascota).filter(models.Mascota.dueno_id == usuario.id).all()
        for mascota in mascotas:
            db.query(models.DatoCollar).filter(models.DatoCollar.mascota_id == mascota.id).delete()
        db.query(models.Mascota).filter(models.Mascota.dueno_id == usuario.id).delete()
        db.delete(usuario)
        db.commit()
        return None

    veterinario = db.query(models.Veterinario).filter(models.Veterinario.correo == correo).first()
    if veterinario:
        db.delete(veterinario)
        db.commit()
        return None

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")