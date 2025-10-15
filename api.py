from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os

# Create FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://parcial-taller-integrador.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model for input data
class UserInput(BaseModel):
    malla_origen: int
    cursos_aprobados: list

# Root endpoint for health check
@app.get("/")
async def read_root():
    return {"status": "ok", "message": "API is running"}

# Main recommendation endpoint
@app.post("/api/recommend")
async def recommend_courses(user_input: UserInput):
    try:
        # Load data from CSV files
        api_dir = os.path.join(os.path.dirname(__file__), 'api')
        malla_path = os.path.join(api_dir, 'Malla 2025.csv')
        conval_path = os.path.join(api_dir, 'Convalicones malla 2025 2015-2019-2022.csv')
        
        # Basic validation
        if not os.path.exists(malla_path) or not os.path.exists(conval_path):
            return {"error": "Required data files not found"}
            
        if user_input.malla_origen not in [2015, 2019, 2022, 2025]:
            return {"error": "Invalid malla_origen. Must be 2015, 2019, 2022, or 2025"}
            
        # Here you would implement your recommendation logic
        # For now, return a mock response
        return {
            "recommendation": [
                {
                    "codigo": "EXAMPLE-101",
                    "nombre": "Example Course",
                    "creditos": 4,
                    "ciclo": 1
                }
            ],
            "credits": 4,
            "max_credits": 20
        }
        
    except Exception as e:
        return {"error": str(e)}