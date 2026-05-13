import time
import random
import sys
import os

# Esto es para que Python encuentre nuestra base de datos en la carpeta anterior
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import DatoCollar

def simular_datos_collar(mascota_id):
    db = SessionLocal()
    
    print(f"📡 Iniciando transmisión del collar para la mascota ID: {mascota_id}...")
    print("Presiona Ctrl+C en la terminal para detener el simulador.\n")
    
    try:
        while True:
            # Generar datos simulados realistas para un perro/gato
            temp_simulada = round(random.uniform(37.5, 39.5), 2) # Temperatura entre 37.5 y 39.5
            pulsos_simulados = random.randint(60, 140)           # Latidos por minuto
            
            # Simular estado de actividad basado en las pulsaciones
            if pulsos_simulados < 75:
                estado = "Durmiendo"
            elif pulsos_simulados > 120:
                estado = "Jugando / Corriendo"
            else:
                estado = "Reposo / Caminando"

            # Crear el registro para MySQL
            nuevo_dato = DatoCollar(
                mascota_id=mascota_id,
                temperatura=temp_simulada,
                pulsaciones=pulsos_simulados,
                estado_actividad=estado,
                latitud=21.9333, # Coordenadas base (ej. Rioverde)
                longitud=-99.9833
            )
            
            # Guardar en la base de datos
            db.add(nuevo_dato)
            db.commit()
            
            print(f" Dato guardado -> Temp: {temp_simulada}°C | Pulso: {pulsos_simulados} bpm | Estado: {estado}")
            
            # Esperar 5 segundos antes de enviar el siguiente dato (para pruebas)
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n Transmisión del collar detenida por el usuario.")
    finally:
        db.close()

# Iniciar la simulación para nuestra mascota con ID 1 (Firulais)
if __name__ == "__main__":
    simular_datos_collar(mascota_id=1)