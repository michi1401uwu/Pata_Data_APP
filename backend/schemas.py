from pydantic import BaseModel, EmailStr
from typing import Optional

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