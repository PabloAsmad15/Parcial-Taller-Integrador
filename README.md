# Sistema de Recomendación de Cursos

Sistema de recomendación de cursos para la carrera de Ingeniería de Sistemas de Información, que ayuda a los estudiantes a planificar su matrícula considerando las mallas curriculares 2015, 2019, 2022 y 2025.

## Características

- Soporte para múltiples mallas curriculares (2015, 2019, 2022, 2025)
- Sistema de convalidaciones automático
- Interfaz de usuario intuitiva y responsive
- Validación de prerrequisitos
- Cálculo automático de créditos
- Recomendaciones optimizadas por ciclo

## Estructura del Proyecto

```
.
├── api/
│   ├── index.py                     # Backend FastAPI
│   ├── Malla 2015.csv              # Datos malla 2015
│   ├── Malla 2019.csv              # Datos malla 2019
│   ├── Malla 2022.csv              # Datos malla 2022
│   ├── Malla 2025.csv              # Datos malla 2025
│   └── Convalicones malla 2025 2015-2019-2022.csv  # Tabla de convalidaciones
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js                  # Componente principal
│       ├── App.css                 # Estilos
│       └── ...
├── requirements.txt                 # Dependencias Python
└── vercel.json                     # Configuración de despliegue
```

## Requisitos

- Python 3.8 o superior
- Node.js 14.0 o superior
- npm 6.0 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/PabloAsmad15/Parcial-Taller-Integrador.git
cd Parcial-Taller-Integrador
```

2. Instalar dependencias del backend:
```bash
pip install -r requirements.txt
```

3. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

## Ejecución en desarrollo

1. Iniciar el backend:
```bash
cd api
uvicorn index:app --reload
```

2. Iniciar el frontend (en otra terminal):
```bash
cd frontend
npm start
```

## Uso

1. Seleccionar la malla curricular de origen
2. Marcar los cursos ya aprobados
3. El sistema mostrará automáticamente las recomendaciones para el siguiente ciclo

## Tecnologías Utilizadas

- Backend:
  - FastAPI
  - Pandas
  - Python-Constraint
  - Pydantic

- Frontend:
  - React
  - Axios
  - CSS3
  - HTML5

## Autor

Pablo Asmad