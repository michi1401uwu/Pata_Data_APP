from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    correo = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    es_veterinario = Column(Boolean, default=False) # Para saber si es dueño o vet
    
    # Relación: Un usuario tiene muchas mascotas
    mascotas = relationship("Mascota", back_populates="dueno")

class Veterinario(Base):
    __tablename__ = "veterinarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    cedula = Column(String(20), unique=True, nullable=False)
    especialidad = Column(String(50))
    correo = Column(String(100), unique=True, index=True, nullable=False)
    centro_veterinario = Column(String(100))
    cv_url = Column(String(255), nullable=True) 
    password_hash = Column(String(255), nullable=False)

class Mascota(Base):
    __tablename__ = "mascotas"
    
    id = Column(Integer, primary_key=True, index=True)
    dueno_id = Column(Integer, ForeignKey("usuarios.id"))
    nombre = Column(String(50), nullable=False)
    especie = Column(String(20))
    raza = Column(String(50))
    
    # Relaciones
    dueno = relationship("Usuario", back_populates="mascotas")
    datos_biometricos = relationship("DatoCollar", back_populates="mascota")

class DatoCollar(Base):
    __tablename__ = "datos_collar"
    
    id = Column(Integer, primary_key=True, index=True)
    mascota_id = Column(Integer, ForeignKey("mascotas.id"))
    temperatura = Column(Float)
    pulsaciones = Column(Integer)
    latitud = Column(Float)
    longitud = Column(Float)
    estado_actividad = Column(String(50))
    fecha_hora = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    # Relación
    mascota = relationship("Mascota", back_populates="datos_biometricos")

class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    mascota_id = Column(Integer, ForeignKey("mascotas.id"))
    fecha_hora = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    interpretacion = Column(Text, nullable=False)
    consejo = Column(Text, nullable=True)
    nivel_gravedad = Column(String(50), default="informativo") # Ej: informativo, alerta, critico

    # Relación
    mascota = relationship("Mascota")