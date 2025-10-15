from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import pandas as pd
import os

# Create FastAPI app
app = FastAPI()

# Configure CORS with more permissive settings for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
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
    try:
        return JSONResponse(
            content={"status": "ok", "message": "API is running"},
            status_code=200
        )
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

# Main recommendation endpoint
@app.post("/api/recommend")
async def recommend_courses(user_input: UserInput):
    try:
        # Validate input first
        if not isinstance(user_input.malla_origen, int):
            return JSONResponse(
                content={"error": "malla_origen must be an integer"},
                status_code=400
            )
            
        if user_input.malla_origen not in [2015, 2019, 2022, 2025]:
            return JSONResponse(
                content={"error": "malla_origen must be one of: 2015, 2019, 2022, 2025"},
                status_code=400
            )

        # For testing, return a mock response
        return JSONResponse(
            content={
                "recommendation": [
                    {
                        "codigo": "TEST-101",
                        "nombre": "Test Course",
                        "creditos": 4,
                        "ciclo": 1
                    }
                ],
                "credits": 4,
                "max_credits": 20
            },
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
        
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