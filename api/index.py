import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth
from database import engine, get_db
from datetime import timedelta
from typing import List
from agent.agent import decide_algorithm
from algorithms.backtracking import recomendar_backtracking_por_ramas
from algorithms.constraint_programming import recomendar_constraint_basic
from pydantic import BaseModel

models.Base.metadata.create_all(bind=engine)
# Ensure database has the 'algorithm' column in recommendations (for older DBs)
try:
    with engine.connect() as conn:
        res = conn.execute("PRAGMA table_info('recommendations')")
        cols = [r[1] for r in res.fetchall()]
        if 'algorithm' not in cols:
            print("🔧 Agregando columna 'algorithm' a la tabla recommendations...")
            conn.execute("ALTER TABLE recommendations ADD COLUMN algorithm VARCHAR DEFAULT 'unknown'")
            print("✅ Columna 'algorithm' agregada.")
except Exception as e:
    print(f"⚠️ No se pudo asegurar columna 'algorithm' en DB: {e}")
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
app = FastAPI(title="Recomendador de Cursos API")

# Configuración de CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas las origins en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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
    equivalencias_encontradas = []
    
    for curso in cursos_origen:
        curso_limpio = curso.strip().replace(" ", "")
        if curso_limpio in mapa_especifico:
            curso_2025 = mapa_especifico[curso_limpio]
            cursos_2025.add(curso_2025)
            equivalencias_encontradas.append(f"{curso_limpio} -> {curso_2025}")
        else:
            no_encontrados.append(curso_limpio)
            
    if equivalencias_encontradas:
        print(f"✅ Equivalencias encontradas para malla {malla_origen}:")
        for eq in equivalencias_encontradas:
            print(f"   {eq}")
            
    if no_encontrados:
        print(f"⚠️ Cursos sin convalidación en malla {malla_origen}: {no_encontrados}")
        
    return list(cursos_2025)

# Algoritmos moved to api/algorithms/ (backtracking, constraint_programming)

# --------------------------------------------------------------------------
# PARTE 3: CARGA GLOBAL DE DATOS Y ENDPOINT DE LA API
# --------------------------------------------------------------------------
print("Iniciando servidor y cargando datos...")
# Configuración de rutas para archivos CSV
import os

def get_csv_path(filename):
    # Primero intenta en el directorio actual
    if os.path.exists(filename):
        return filename
    
    # Luego intenta en el directorio api/
    api_path = os.path.join('api', filename)
    if os.path.exists(api_path):
        return api_path
        
    # Finalmente, intenta con la ruta absoluta
    abs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
    if os.path.exists(abs_path):
        return abs_path
        
    print(f"⚠️ No se pudo encontrar el archivo: {filename}")
    print(f"Directorio actual: {os.getcwd()}")
    print(f"Contenido del directorio: {os.listdir('.')}")
    return filename

MALLA_2025_PATH = get_csv_path('Malla 2025.csv')
CONVAL_PATH = get_csv_path('Convalicones malla 2025 2015-2019-2022.csv')

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

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "API is running"}

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"email": user.email, "dni": user.dni} for user in users]

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Validar correo UPAO
        auth.validate_upao_email(user.email)
        
        # Verificar si el usuario ya existe
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado. Por favor, intenta iniciar sesión."
            )
        
        # Verificar si el DNI ya existe
        db_user = db.query(models.User).filter(models.User.dni == user.dni).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El DNI ya está registrado. Por favor, intenta iniciar sesión."
            )
        
        # Crear usuario usando el DNI directamente como contraseña
        db_user = models.User(
            email=user.email,
            dni=user.dni,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
        
    except Exception as e:
        db.rollback()  # Revertir cualquier cambio en caso de error
        print(f"Error en registro: {str(e)}")  # Log del error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/change-password", response_model=schemas.User)
async def change_password(
    password_change: schemas.UserChangePassword,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar la contraseña actual
    if not auth.verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar la contraseña
    current_user.hashed_password = auth.get_password_hash(password_change.new_password)
    current_user.has_changed_password = True
    db.commit()
    return current_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"Intento de login con username: {form_data.username}")  # Debug
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "email": user.email,
        "dni": user.dni
    }


@app.get("/me")
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    """Endpoint simple para validar token y obtener info mínima del usuario."""
    return {"email": current_user.email, "dni": current_user.dni}


# --------------------------------------------------------------------------
# RECUPERACIÓN / RESETEO DE CONTRASEÑA (flujo básico)
# --------------------------------------------------------------------------
class RecoverRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    dni: str
    new_password: str


@app.post("/recover")
def recover_check(payload: RecoverRequest, db: Session = Depends(get_db)):
    """Verifica si el correo existe en la base de datos.

    Nota: en una implementación completa se enviaría un email con un token.
    Aquí devolvemos un flag para que el frontend pueda continuar el flujo.
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        return {"exists": False, "message": "El correo no está registrado"}
    return {"exists": True, "message": "Correo verificado. Proceda a cambiar la contraseña."}


@app.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resetea la contraseña si coincide el email y el DNI (prueba rápida sin email).

    Esta ruta es intencionalmente simple: en producción usarías tokens enviados por email.
    """
    user = db.query(models.User).filter(models.User.email == payload.email, models.User.dni == payload.dni).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email o DNI no coinciden")

    try:
        user.hashed_password = auth.get_password_hash(payload.new_password)
        user.has_changed_password = True
        db.commit()
        return {"ok": True, "message": "Contraseña actualizada correctamente"}
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error reseteando contraseña: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar la contraseña")

@app.post("/api/recommend")
def recommend_courses(
    request: Request,
    recommendation: schemas.RecommendationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Debug: imprimir método y algunos headers para ver si viene OPTIONS / preflight
        try:
            print(f"\n➡️ Request method: {request.method}")
            # Mostrar sólo algunos headers relevantes
            headers_to_show = ['origin', 'host', 'access-control-request-method', 'access-control-request-headers', 'authorization']
            for h in headers_to_show:
                if h in request.headers:
                    print(f"   header {h}: {request.headers.get(h)}")
        except Exception as _:
            print("(no se pudieron leer headers de la request)")

        print(f"\n📥 Recibido request con malla {recommendation.malla_origen} y cursos: {recommendation.cursos_aprobados}")

        # Validar que los datos estén cargados
        if MALLA_COMPLETA_2025 is None:
            print("❌ Error: Malla 2025 no cargada")
            return {"error": "Error interno: No se pudo cargar la malla 2025"}

        if MAPA_CONVAL is None:
            print("❌ Error: Mapa de convalidaciones no cargado")
            return {"error": "Error interno: No se pudo cargar el mapa de convalidaciones"}

        # Validar malla de origen
        if recommendation.malla_origen not in [2015, 2019, 2022, 2025]:
            print(f"❌ Error: Malla origen inválida {recommendation.malla_origen}")
            return {"error": f"Malla {recommendation.malla_origen} no soportada. Use 2015, 2019, 2022 o 2025."}

        print(f"🔍 Buscando convalidaciones para malla {recommendation.malla_origen}")
        cursos_aprobados_2025 = traducir_cursos_aprobados(recommendation.cursos_aprobados, recommendation.malla_origen, MAPA_CONVAL)
        print(f"✅ Cursos traducidos a malla 2025: {cursos_aprobados_2025}")

        # --- LÓGICA DE DECISIÓN AUTOMÁTICA ---
        cursos_pendientes = {c: i for c, i in MALLA_COMPLETA_2025.items() if c not in cursos_aprobados_2025}
        print(f"📚 Total cursos pendientes: {len(cursos_pendientes)}")

        cursos_candidatos_potenciales = [c for c, i in cursos_pendientes.items() if all(p in cursos_aprobados_2025 for p in i['prerrequisitos'])]
        print(f"🎯 Candidatos que cumplen prerrequisitos: {cursos_candidatos_potenciales}")

        # Use the agent to decide which algorithm to run (agent only decides)
        print(f"Invoking agent to decide algorithm for {len(cursos_candidatos_potenciales)} candidates")
        agent_result = decide_algorithm(MALLA_POR_CICLO_2025, cursos_aprobados_2025)
        algorithm = agent_result.get('algorithm')
        rationale = agent_result.get('rationale')
        print(f"Agent decision: {algorithm} - {rationale}")

        # Run the chosen black-box algorithm
        if algorithm == 'constraint_programming':
            codigos, creditos, max_c = recomendar_constraint_basic(MALLA_COMPLETA_2025, MALLA_POR_CICLO_2025, cursos_aprobados_2025)
        else:
            codigos, creditos, max_c = recomendar_backtracking_por_ramas(MALLA_COMPLETA_2025, MALLA_POR_CICLO_2025, cursos_aprobados_2025)

        # Formatear la respuesta para el frontend
        recomendacion_final = []
        if codigos:
            for codigo in codigos:
                if codigo in MALLA_COMPLETA_2025:
                    info = MALLA_COMPLETA_2025[codigo]
                    recomendacion_final.append({"codigo": codigo, "nombre": info['nombre'], "creditos": info['creditos'], "ciclo": info['ciclo']})

        # Guardar recomendación en la base de datos asociada al usuario
        try:
            rec = models.Recommendation(
                user_id=current_user.id,
                malla_origen=recommendation.malla_origen,
                cursos_aprobados=recommendation.cursos_aprobados,
                cursos_recomendados=recomendacion_final,
                algorithm=algorithm
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            saved_id = rec.id
        except Exception as e:
            print(f"⚠️ Error guardando recomendación en DB: {e}")
            db.rollback()
            saved_id = None

        response_payload = {"recommendation": recomendacion_final, "credits": creditos, "max_credits": max_c}
        if saved_id:
            response_payload["saved_id"] = saved_id

        # Also include agent metadata if present
        # Include agent metadata (decision-only) and a user-friendly Spanish summary
        try:
            response_payload['agent'] = {
                'algorithm': algorithm,
                'rationale': rationale,
                'eligible_count': agent_result.get('eligible_count')
            }
            # Generate a Spanish summary/explanation for the frontend
            try:
                from agent.agent import summarize_recommendation
                summary = summarize_recommendation(MALLA_COMPLETA_2025, codigos, creditos, max_c, algorithm, rationale, agent_result.get('eligible_count'))
                response_payload['agent']['summary'] = summary
            except Exception as e:
                print(f"⚠️ No se pudo generar el resumen del agente: {e}")
        except Exception:
            pass

        return response_payload

    except Exception as e:
        print(f"❌ Error en /api/recommend: {e}")
        # Devolver error en formato JSON para que el frontend lo muestre
        return {"error": str(e)}


@app.get("/api/my-recommendations")
def get_my_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Devuelve las recomendaciones guardadas del usuario autenticado."""
    recs = db.query(models.Recommendation).filter(models.Recommendation.user_id == current_user.id).order_by(models.Recommendation.created_at.desc()).all()
    result = []
    for r in recs:
        result.append({
            "id": r.id,
            "malla_origen": r.malla_origen,
            "cursos_aprobados": r.cursos_aprobados,
            "cursos_recomendados": r.cursos_recomendados,
            "algorithm": getattr(r, 'algorithm', None),
            "created_at": r.created_at.isoformat()
        })
    return {"recommendations": result}


@app.post("/api/agent/decide")
def agent_decide(
    payload: schemas.RecommendationCreate,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Devuelve únicamente la decisión del agente (qué algoritmo usar y por qué)."""
    try:
        # Validar malla origen
        if payload.malla_origen not in [2015, 2019, 2022, 2025]:
            raise HTTPException(status_code=400, detail="Malla origen inválida")

        # Traducir cursos aprobados a 2025
        cursos_aprobados_2025 = traducir_cursos_aprobados(payload.cursos_aprobados, payload.malla_origen, MAPA_CONVAL)

        agent_res = decide_algorithm(MALLA_POR_CICLO_2025, cursos_aprobados_2025)
        return {"agent": agent_res}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error en /api/agent/decide: {e}")
        raise HTTPException(status_code=500, detail=str(e))