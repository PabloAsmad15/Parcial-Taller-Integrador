from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

    @validator('email')
    def validate_upao_email(cls, v):
        if not v.endswith('@upao.edu.pe'):
            raise ValueError('El correo electrónico debe ser de dominio @upao.edu.pe')
        return v

class UserCreate(UserBase):
    dni: str

    @validator('dni')
    def validate_dni(cls, v):
        if not v.isdigit() or len(v) != 8:
            raise ValueError('El DNI debe contener exactamente 8 dígitos')
        return v

class UserLogin(UserBase):
    password: str

class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationBase(BaseModel):
    malla_origen: int
    cursos_aprobados: List[str]

class RecommendationCreate(RecommendationBase):
    pass

class Recommendation(RecommendationBase):
    id: int
    user_id: int
    cursos_recomendados: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None