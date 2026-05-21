from google import genai
import models
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Caché para evitar llamadas innecesarias a la IA
asistente_cache = {}

def procesar_interpretacion_clinica(mascota_id: int, db: Session):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    if not mascota:
        return None

    datos = db.query(models.DatoCollar).filter(models.DatoCollar.mascota_id == mascota_id).order_by(models.DatoCollar.fecha_hora.desc()).limit(5).all()
    if not datos:
        return {"interpretacion": "No hay datos suficientes.", "consejo": "Sincroniza el collar.", "nivel_gravedad": "informativo"}
    
    ultimo = datos[0]

    # Obtener antecedentes del Kardex para el análisis
    kardex = db.query(models.Kardex).filter(models.Kardex.mascota_id == mascota_id).all()
    antecedentes = "; ".join([f"{e.tipo}: {e.descripcion}" for e in kardex]) if kardex else "Sin antecedentes registrados."

    # Verificación de Caché
    if mascota_id in asistente_cache:
        if asistente_cache[mascota_id]["ultimo_id"] == ultimo.id:
            pass # Podríamos invalidar si el kardex cambió, por ahora procedemos

    t = ultimo.temperatura
    p = ultimo.pulsaciones
    estado = ultimo.estado_actividad
    diagnosticos = []

    # Lógica de rangos
    es_gato = "gato" in mascota.especie.lower()
    t_max, t_min = 39.2, (38.0 if es_gato else 37.5)
    p_max, p_min = (220 if es_gato else 140), (140 if es_gato else 60)

    if len(datos) > 2:
        pulsos = [d.pulsaciones for d in datos]
        if (max(pulsos) - min(pulsos)) > 50:
            diagnosticos.append(f"Posible arritmia detectada en {mascota.nombre}.")

    if p > p_max:
        diagnosticos.append(f"Taquicardia ({p} bpm).")
    elif p < p_min and estado != "Durmiendo":
        diagnosticos.append(f"Bradicardia ({p} bpm).")

    if t > t_max + 0.5:
        diagnosticos.append(f"Hipertermia severa ({t}°C).")
    elif t < t_min:
        diagnosticos.append(f"Hipotermia ({t}°C).")

    if not diagnosticos:
        nota = f"Estado Estable: {mascota.nombre} está en rangos normales ({t}°C, {p} bpm). Antecedentes: {antecedentes}"
        consejo = "Continúa con el monitoreo preventivo."
        nivel = "informativo"
    else:
        nota = " ".join(diagnosticos)
        consejo = "Se recomienda consulta veterinaria a la brevedad."
        nivel = "critico" if "severa" in nota or "Taquicardia" in nota else "alerta"

    # Guardar alerta en DB si es necesario
    if diagnosticos:
        nueva_alerta = models.Alerta(mascota_id=mascota_id, interpretacion=nota, consejo=consejo, nivel_gravedad=nivel)
        db.add(nueva_alerta)
        db.commit()

    res = {"interpretacion": nota, "consejo": consejo, "nivel_gravedad": nivel}
    asistente_cache[mascota_id] = {"ultimo_id": ultimo.id, "respuesta": res}
    return res

async def chat_con_kadsy(mascota_id: int, mensaje_usuario: str, db: Session):
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    ultimo = db.query(models.DatoCollar).filter(models.DatoCollar.mascota_id == mascota_id).order_by(models.DatoCollar.fecha_hora.desc()).first()
    
    # Enriquecer contexto con el Historial Médico (Kardex)
    kardex = db.query(models.Kardex).filter(models.Kardex.mascota_id == mascota_id).all()
    historial_medico = ". ".join([f"{e.tipo.capitalize()}: {e.descripcion}" for e in kardex]) if kardex else "No hay antecedentes médicos registrados."

    contexto = f"Mascota: {mascota.nombre}, {mascota.especie}, {mascota.raza}. Historial Médico: {historial_medico}. "
    if ultimo:
        contexto += f"Signos: {ultimo.temperatura}°C, {ultimo.pulsaciones} bpm en estado {ultimo.estado_actividad}."

    prompt = (
        f"Eres Kadsy, asistente veterinario virtual de Pata-Data. Contexto clínico completo: {contexto}. "
        f"Analiza la relación entre el historial médico y los signos actuales para dar respuestas precisas y profesionales. Responde breve y humano. Pregunta: {mensaje_usuario}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        return response.text if response.text else "No pude procesar la respuesta."
    except Exception as e:
        return f"Error de conexión con el cerebro de Kadsy: {str(e)}"