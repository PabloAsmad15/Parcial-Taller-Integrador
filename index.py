from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    malla_origen: int
    cursos_aprobados: List[str]

@app.get("/")
async def root():
    return {"message": "API is working"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/recommend")
async def recommend_courses(user_input: UserInput):
    try:
        # Basic input validation
        if user_input.malla_origen not in [2015, 2019, 2022, 2025]:
            raise HTTPException(status_code=400, detail="Invalid malla_origen")
            
        # Return test data for now
        return {
            "recommendation": [
                {
                    "codigo": "TEST-101",
                    "nombre": "Curso de Prueba",
                    "creditos": 4,
                    "ciclo": 1
                }
            ],
            "credits": 4,
            "max_credits": 20
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)}
    )