from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioRegistro(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    password: str

class VeterinarioRegistro(UsuarioRegistro):
    cedula: str
    especialidad: str
    centro_veterinario: str

class MascotaCreate(BaseModel):
    nombre: str
    especie: str
    raza: str
    correo_dueno: EmailStr

class ChatRequest(BaseModel):
    mascota_id: int
    mensaje: str

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class KardexCreate(BaseModel):
    mascota_id: int
    tipo: str
    descripcion: str

class KardexResponse(KardexCreate):
    id: int
    fecha: datetime

class ForoPostCreate(BaseModel):
    contenido: str
    correo: EmailStr

class ComentarioVetCreate(BaseModel):
    vet_id: int
    correo_usuario: EmailStr
    comentario: str

class MensajeCreate(BaseModel):
    emisor: str
    receptor: str
    contenido: str