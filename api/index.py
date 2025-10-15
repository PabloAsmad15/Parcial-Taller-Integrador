import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Removed constraint import temporarily to debug core functionality
import time

# ========================================================================
# UMBRAL DE DECISIÓN
# Si el número de cursos posibles para recomendar es MAYOR a este valor,
# el sistema usará el algoritmo RÁPIDO para evitar demoras.
# Si es menor o igual, usará el ÓPTIMO (Constraint Programming).
# ========================================================================
UMBRAL_DE_COMPLEJIDAD = 22

# --- INICIA LA APLICACIÓN API ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --------------------------------------------------------------------------
# PARTE 1: MODELOS DE DATOS Y LÓGICA DE CARGA
# --------------------------------------------------------------------------
class UserInput(BaseModel):
    malla_origen: int
    cursos_aprobados: list

def cargar_datos_completos(ruta_malla):
    """Carga una malla y la devuelve en dos formatos: diccionario completo y por ciclo."""
    try:
        if not os.path.exists(ruta_malla):
            print(f"❌ No se encuentra el archivo: {ruta_malla}")
            return None, None
            
        print(f"📖 Leyendo archivo: {ruta_malla}")
        df = pd.read_csv(ruta_malla, sep=';', dtype=str, encoding='utf-8-sig')
        print(f"   Columnas encontradas: {df.columns.tolist()}")
        
        if 'Código' not in df.columns:
            print("❌ Columna 'Código' no encontrada")
            return None, None
            
        malla_completa = {}
        malla_por_ciclo = {i: [] for i in range(1, 11)}
        
        for idx, fila in df.iterrows():
            try:
                codigo_raw = fila.get('Código')
                if pd.isna(codigo_raw): continue
                
                codigo = str(codigo_raw).strip().replace(" ", "")
                if not codigo: continue
                
                ciclo_entero = {'I':1, 'II':2, 'III':3, 'IV':4, 'V':5, 'VI':6, 'VII':7, 'VIII':8, 'IX':9, 'X':10}.get(
                    str(fila.get('Ciclo', '')).strip().upper(), 0
                )
                
                prerreqs_raw = fila.get('Prerrequisitos')
                prerrequisitos = [p.strip().replace(" ", "") for p in str(prerreqs_raw).split(',') 
                                if pd.notna(prerreqs_raw) and str(prerreqs_raw).upper() != 'NINGUNO']
                                
                info_curso = {
                    'codigo': codigo,
                    'nombre': str(fila.get('Nombre de la asignatura', '')).strip(),
                    'ciclo': ciclo_entero,
                    'creditos': int(float(fila.get('Creditos', 0))),
                    'prerrequisitos': prerrequisitos
                }
                
                malla_completa[codigo] = info_curso
                if ciclo_entero > 0:
                    malla_por_ciclo[ciclo_entero].append(info_curso)
                    
            except Exception as e:
                print(f"⚠️ Error procesando fila {idx}: {str(e)}")
                continue
                
        print(f"✅ Malla cargada: {len(malla_completa)} cursos en total")
        return malla_completa, malla_por_ciclo
        
    except Exception as e:
        print(f"❌ Error al cargar '{ruta_malla}': {str(e)}")
        return None, None

def cargar_mapa_convalidaciones(ruta_csv):
    """Carga y normaliza el mapa de convalidaciones desde el CSV."""
    try:
        print(f"📖 Leyendo archivo de convalidaciones: {ruta_csv}")
        df = pd.read_csv(ruta_csv, sep=';', dtype=str, encoding='utf-8-sig')
        print(f"   Columnas encontradas: {df.columns.tolist()}")
        
        mapa = {}
        for _, fila in df.iterrows():
            try:
                malla_origen = int(str(fila['Malla_Origen']).strip())
                codigo_origen = str(fila['Codigo_Origen']).strip().replace(" ", "")
                codigo_destino = str(fila['Codigo_Destino_2025']).strip().replace(" ", "")
                
                if malla_origen not in mapa:
                    mapa[malla_origen] = {}
                    
                if codigo_origen and codigo_destino:
                    mapa[malla_origen][codigo_origen] = codigo_destino
                    
            except Exception as e:
                print(f"⚠️ Error procesando fila de convalidación: {str(e)}")
                continue
        print(f"✅ Mapa de convalidaciones cargado y normalizado desde '{ruta_csv}'.")
        return mapa
    except Exception as e:
        print(f"❌ Error al cargar convalidaciones: {e}")
        return None

def traducir_cursos_aprobados(cursos_origen, malla_origen, mapa_conval):
    """Traduce cursos a la malla 2025."""
    if not isinstance(malla_origen, int) or malla_origen not in [2015, 2019, 2022, 2025]:
        print(f"❌ Malla origen inválida: {malla_origen}")
        return []
        
    if malla_origen == 2025:
        print("✅ Malla 2025 - no requiere traducción")
        return cursos_origen
        
    mapa_especifico = mapa_conval.get(malla_origen, {})
    if not mapa_especifico:
        print(f"❌ No hay mapa de convalidación para malla {malla_origen}")
        return []
        
    cursos_2025 = set()
    no_encontrados = []
    for curso in cursos_origen:
        curso_limpio = curso.strip().replace(" ", "")
        if curso_limpio in mapa_especifico:
            cursos_2025.add(mapa_especifico[curso_limpio])
        else:
            no_encontrados.append(curso_limpio)
            
    if no_encontrados:
        print(f"⚠️ Cursos sin convalidación en malla {malla_origen}: {no_encontrados}")
        
    return list(cursos_2025)

# --------------------------------------------------------------------------
# PARTE 2: ALGORITMOS DE RECOMENDACIÓN (SEPARADOS Y ROBUSTOS)
# --------------------------------------------------------------------------

def recomendar_backtracking_por_ramas(malla_completa, malla_por_ciclo, cursos_aprobados):
    """Algoritmo RÁPIDO Y CONFIABLE: Backtracking por Ramas."""
    cursos_aprobados_set = set(cursos_aprobados)
    ultimo_ciclo_completo = 0
    for ciclo in range(1, 11):
        codigos_del_ciclo = {c['codigo'] for c in malla_por_ciclo.get(ciclo, [])}
        if not codigos_del_ciclo or not codigos_del_ciclo.issubset(cursos_aprobados_set): break
        ultimo_ciclo_completo = ciclo
    
    ciclo_de_matricula = ultimo_ciclo_completo + 1
    max_creditos = {1:20, 2:21, 3:22, 4:20, 5:21, 6:21, 7:21, 8:20, 9:22, 10:17}.get(ciclo_de_matricula, 21)
    cursos_pendientes = {c['codigo'] for c in malla_por_ciclo.get(ciclo_de_matricula, []) if c['codigo'] not in cursos_aprobados_set}
    
    recomendacion, creditos_actuales = [], 0
    for cod in sorted(list(cursos_pendientes)):
        if creditos_actuales + malla_completa[cod]['creditos'] <= max_creditos:
            recomendacion.append(cod)
            creditos_actuales += malla_completa[cod]['creditos']
    
    siguiente_rama = ciclo_de_matricula + 1
    for curso in malla_por_ciclo.get(siguiente_rama, []):
        if (creditos_actuales + curso['creditos'] <= max_creditos) and all(p in cursos_aprobados_set for p in curso['prerrequisitos']):
            recomendacion.append(curso['codigo'])
            creditos_actuales += curso['creditos']
            
    return recomendacion, creditos_actuales, max_creditos

# Removed constraint programming algorithm temporarily

# --------------------------------------------------------------------------
# PARTE 3: CARGA GLOBAL DE DATOS Y ENDPOINT DE LA API
# --------------------------------------------------------------------------
print("Iniciando servidor y cargando datos...")
# Usar paths absolutos
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MALLA_2025_PATH = os.path.join(BASE_DIR, 'Malla 2025.csv')
CONVAL_PATH = os.path.join(BASE_DIR, 'Convalicones malla 2025 2015-2019-2022.csv')

print(f"📂 Verificando archivos:")
print(f"   Malla 2025: {os.path.exists(MALLA_2025_PATH)}")
print(f"   Convalidaciones: {os.path.exists(CONVAL_PATH)}")

print(f"📂 Cargando malla desde: {MALLA_2025_PATH}")
MALLA_COMPLETA_2025, MALLA_POR_CICLO_2025 = cargar_datos_completos(MALLA_2025_PATH)
print(f"📂 Cargando convalidaciones desde: {CONVAL_PATH}")
MAPA_CONVAL = cargar_mapa_convalidaciones(CONVAL_PATH)

print("\nEstado de inicialización:")
if MALLA_COMPLETA_2025 is not None:
    print(f"✅ Malla 2025 cargada con {len(MALLA_COMPLETA_2025)} cursos")
else:
    print("❌ Error: No se pudo cargar la malla 2025")
    
if MAPA_CONVAL is not None:
    print(f"✅ Mapa de convalidaciones cargado para mallas: {sorted(list(MAPA_CONVAL.keys()))}")
    for malla in sorted(MAPA_CONVAL.keys()):
        print(f"   - Malla {malla}: {len(MAPA_CONVAL[malla])} convalidaciones")
else:
    print("❌ Error: No se pudo cargar el mapa de convalidaciones")
    
if MALLA_COMPLETA_2025 is not None and MAPA_CONVAL is not None:
    print("✅ Servidor listo para recibir peticiones.")
else:
    print("❌ Error cargando datos iniciales")

@app.post("/api/recommend")
def recommend_courses(user_input: UserInput):
    print(f"\n📥 Recibido request con malla {user_input.malla_origen} y cursos: {user_input.cursos_aprobados}")
    
    # Validar que los datos estén cargados
    if MALLA_COMPLETA_2025 is None:
        print("❌ Error: Malla 2025 no cargada")
        return {"error": "Error interno: No se pudo cargar la malla 2025"}
        
    if MAPA_CONVAL is None:
        print("❌ Error: Mapa de convalidaciones no cargado")
        return {"error": "Error interno: No se pudo cargar el mapa de convalidaciones"}
        
    # Validar malla de origen
    if user_input.malla_origen not in [2015, 2019, 2022, 2025]:
        print(f"❌ Error: Malla origen inválida {user_input.malla_origen}")
        return {"error": f"Malla {user_input.malla_origen} no soportada. Use 2015, 2019, 2022 o 2025."}

    print(f"🔍 Buscando convalidaciones para malla {user_input.malla_origen}")
    cursos_aprobados_2025 = traducir_cursos_aprobados(user_input.cursos_aprobados, user_input.malla_origen, MAPA_CONVAL)
    print(f"✅ Cursos traducidos a malla 2025: {cursos_aprobados_2025}")
    
    # --- LÓGICA DE DECISIÓN AUTOMÁTICA ---
    cursos_pendientes = {c: i for c, i in MALLA_COMPLETA_2025.items() if c not in cursos_aprobados_2025}
    print(f"📚 Total cursos pendientes: {len(cursos_pendientes)}")
    
    cursos_candidatos_potenciales = [c for c, i in cursos_pendientes.items() if all(p in cursos_aprobados_2025 for p in i['prerrequisitos'])]
    print(f"🎯 Candidatos que cumplen prerrequisitos: {cursos_candidatos_potenciales}")
    
    # Temporarily always use the backtracking algorithm while we debug
    print(f"Using backtracking algorithm with {len(cursos_candidatos_potenciales)} candidates")
    codigos, creditos, max_c = recomendar_backtracking_por_ramas(MALLA_COMPLETA_2025, MALLA_POR_CICLO_2025, cursos_aprobados_2025)

    # Formatear la respuesta para el frontend
    recomendacion_final = []
    if codigos:
        for codigo in codigos:
            if codigo in MALLA_COMPLETA_2025:
                info = MALLA_COMPLETA_2025[codigo]
                recomendacion_final.append({"codigo": codigo, "nombre": info['nombre'], "creditos": info['creditos'], "ciclo": info['ciclo']})
    
    return {"recommendation": recomendacion_final, "credits": creditos, "max_credits": max_c}