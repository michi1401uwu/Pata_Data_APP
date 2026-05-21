from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import random

import models
import schemas
import security
import ai_logic
from database import SessionLocal, engine

app = FastAPI(title="Pata-Data API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
async def registro_usuario(user_data: schemas.UsuarioRegistro, db: Session = Depends(get_db)):
    # 1. Verificamos si ya existe para evitar errores de duplicado
    existe = db.query(models.Usuario).filter(models.Usuario.correo == user_data.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya existe")

    try:
        nuevo_usuario = models.Usuario(
            nombre=user_data.nombre, 
            apellido=user_data.apellido, 
            correo=user_data.correo, 
            password_hash=security.get_password_hash(user_data.password), 
            es_veterinario=False
        )
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        return {"mensaje": "Usuario registrado con éxito", "id": nuevo_usuario.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# B) REGISTRO DE VETERINARIO
@app.post("/api/registro/veterinario")
async def registro_veterinario(vet_data: schemas.VeterinarioRegistro, db: Session = Depends(get_db)):
    if db.query(models.Veterinario).filter(models.Veterinario.correo == vet_data.correo).first():
        raise HTTPException(status_code=400, detail="Correo ya registrado")

    nuevo_vet = models.Veterinario(
        nombre=vet_data.nombre, 
        apellido=vet_data.apellido, 
        cedula=vet_data.cedula, 
        especialidad=vet_data.especialidad, 
        correo=vet_data.correo, 
        centro_veterinario=vet_data.centro_veterinario, 
        password_hash=security.get_password_hash(vet_data.password)
    )
    db.add(nuevo_vet)
    db.commit()
    return {"mensaje": "Veterinario registrado con éxito"}

# C) LOGIN (EL QUE TE DABA ERROR 401)
@app.post("/api/login")
async def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.correo == login_data.username).first()
    tipo = "dueño"
    
    if not user:
        user = db.query(models.Veterinario).filter(models.Veterinario.correo == login_data.username).first()
        tipo = "veterinario"

    if not user or not security.verificar_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = security.crear_token_acceso({"sub": user.correo, "tipo": tipo})
    return {"access_token": token, "token_type": "bearer", "rol": tipo}

@app.get("/api/protegido")
def ruta_protegida(user: dict = Depends(security.get_current_user)):
    return {"mensaje": "Acceso concedido", "usuario": user.get("sub"), "rol": user.get("tipo")}

# D) OBTENER DATOS DEL COLLAR (EL "INYECTOR")
@app.get("/api/mascotas/{mascota_id}/signos-vitales")
def obtener_signos(mascota_id: int, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.DatoCollar).filter(models.DatoCollar.mascota_id == mascota_id).order_by(models.DatoCollar.fecha_hora.desc()).limit(limit).all()

# E) REGISTRAR UNA NUEVA MASCOTA
@app.post("/api/mascotas")
async def registrar_mascota(mascota_in: schemas.MascotaCreate, db: Session = Depends(get_db)):
    dueno = db.query(models.Usuario).filter(models.Usuario.correo == mascota_in.correo_dueno).first()
    if not dueno:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")
    
    nueva_mascota = models.Mascota(
        nombre=mascota_in.nombre,
        especie=mascota_in.especie,
        raza=mascota_in.raza,
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
        latitud=21.9333 + random.uniform(-0.005, 0.005), # Simulación de movimiento
        longitud=-99.9667 + random.uniform(-0.005, 0.005),
        estado_actividad="Activo" # Agregado porque lo tienes en tu modelo
    )
    
    db.add(nuevo_dato)
    db.commit()
    return {"mensaje": " Datos simulados guardados con éxito"}

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

# H.0) ASISTENTE DE INTERPRETACIÓN DE DATOS
@app.get("/api/mascotas/{mascota_id}/asistente")
def asistente_interpretacion(mascota_id: int, db: Session = Depends(get_db)):
    resultado = ai_logic.procesar_interpretacion_clinica(mascota_id, db)
    if not resultado:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    return resultado

@app.post("/api/chat")
async def chat_asistente(chat_in: schemas.ChatRequest, db: Session = Depends(get_db)):
    respuesta = await ai_logic.chat_con_kadsy(chat_in.mascota_id, chat_in.mensaje, db)
    return {"respuesta": respuesta}

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

# H.3) OBTENER HISTORIAL DE ALERTAS PARA UNA MASCOTA
@app.get("/api/mascotas/{mascota_id}/alertas")
def obtener_alertas_mascota(mascota_id: int, db: Session = Depends(get_db)):
    alertas = db.query(models.Alerta)\
        .filter(models.Alerta.mascota_id == mascota_id)\
        .order_by(models.Alerta.fecha_hora.desc())\
        .all()
    return alertas

# H.2) BUSCAR DUEÑOS POR NOMBRE (VETERINARIO)
@app.get("/api/duenos")
def buscar_duenos(nombre: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Usuario)
    if nombre:
        filtro = f"%{nombre}%"
        query = query.filter(
            models.Usuario.nombre.ilike(filtro) |
            models.Usuario.apellido.ilike(filtro) |
            models.Usuario.correo.ilike(filtro)
        )

    dueños = query.all()
    return [
        {
            "id": dueno.id,
            "nombre": dueno.nombre,
            "apellido": dueno.apellido,
            "correo": dueno.correo,
            "mascotas": [
                {"id": mascota.id, "nombre": mascota.nombre, "especie": mascota.especie, "raza": mascota.raza}
                for mascota in dueno.mascotas
            ]
        }
        for dueno in dueños
    ]
    
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
            usuario.password_hash = security.get_password_hash(new_password)

        db.commit()
        return {"mensaje": "Perfil actualizado con éxito"}

    veterinario = db.query(models.Veterinario).filter(models.Veterinario.correo == correo).first()
    if veterinario:
        if new_correo and new_correo != correo:
            if db.query(models.Usuario).filter(models.Usuario.correo == new_correo).first() or db.query(models.Veterinario).filter(models.Veterinario.correo == new_correo).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya está en uso")
            veterinario.correo = new_correo

        if new_password:
            veterinario.password_hash = security.get_password_hash(new_password)

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
