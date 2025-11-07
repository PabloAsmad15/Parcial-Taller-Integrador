import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CourseForm.css';

// Datos de cursos por malla (importados de tu objeto cursosPorMalla)
import { cursosPorMalla } from '../data/cursosPorMalla';

const CourseForm = () => {
  const { user, token } = useAuth();
  const [mallaSeleccionada, setMallaSeleccionada] = useState('');
  const [cursosAprobados, setCursosAprobados] = useState([]);
  const [recomendacion, setRecomendacion] = useState(null);
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ciclosColapsados, setCiclosColapsados] = useState({});

  // Inicializar ciclos colapsados cuando se selecciona una malla
  useEffect(() => {
    if (mallaSeleccionada && cursosPorMalla[mallaSeleccionada]) {
      const ciclos = Object.keys(cursosPorMalla[mallaSeleccionada]);
      const initialState = ciclos.reduce((acc, ciclo) => {
        acc[ciclo] = true;
        return acc;
      }, {});
      setCiclosColapsados(initialState);
    }
  }, [mallaSeleccionada]);

  const toggleCiclo = (ciclo) => {
    setCiclosColapsados(prev => ({
      ...prev,
      [ciclo]: !prev[ciclo]
    }));
  };

  const getCicloStatus = (cursos) => {
    if (!cursos || cursos.length === 0) return '';
    const total = cursos.length;
    const aprobados = cursos.filter(curso => cursosAprobados.includes(curso.codigo)).length;
    return aprobados === 0 ? 'incomplete' : aprobados === total ? 'complete' : 'incomplete';
  };

  const handleMallaChange = (event) => {
    const newMalla = event.target.value;
    setMallaSeleccionada(newMalla);
    setCursosAprobados([]);
    setRecomendacion(null);
    setError('');
  };

  const handleCursoChange = (codigo) => {
    setCursosAprobados(prev => {
      const exists = prev.includes(codigo);
      return exists ? prev.filter(c => c !== codigo) : [...prev, codigo];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setError('');
    setRecomendacion(null);
    try {
      const apiUrl = 'http://localhost:8000/api/recommend';
      const response = await axios.post(apiUrl, 
        {
          malla_origen: parseInt(mallaSeleccionada, 10),
          cursos_aprobados: cursosAprobados,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response?.data?.recommendation) {
        setRecomendacion(response.data);
      } else if (response?.data?.error) {
        setError(response.data.error);
      } else {
        setError('La respuesta del servidor no tiene el formato esperado.');
      }
    } catch (err) {
      console.error("Error al obtener la recomendación:", err);
      setError(err.response?.data?.error || 'Error al obtener la recomendación');
    } finally {
      setCargando(false);
    }
  };

  const handleCicloCompleto = (cursos, isChecked) => {
    setCursosAprobados(prev => {
      const nuevosAprobados = new Set(prev);
      cursos.forEach(curso => {
        if (isChecked && curso.codigo) {
          nuevosAprobados.add(curso.codigo);
        } else if (!isChecked && curso.codigo) {
          nuevosAprobados.delete(curso.codigo);
        }
      });
      return Array.from(nuevosAprobados).sort();
    });
  };

  const isCicloCompleto = (cursos) => {
    return cursos.every(curso => cursosAprobados.includes(curso.codigo));
  };

  const renderCourseSelector = () => {
    if (!mallaSeleccionada) return null;

    const mallaData = cursosPorMalla[mallaSeleccionada] || {};
    const currentMallaCourses = new Set();
    Object.values(mallaData).forEach(ciclo => {
      ciclo.forEach(curso => currentMallaCourses.add(curso.codigo));
    });

    if (cursosAprobados.some(codigo => !currentMallaCourses.has(codigo))) {
      setCursosAprobados(prev => prev.filter(codigo => currentMallaCourses.has(codigo)));
    }

    return (
      <div className="course-grid">
        <h3>📚 Marca los cursos que ya aprobaste - Malla {mallaSeleccionada}</h3>
        {Object.entries(mallaData).map(([ciclo, cursos]) => {
          const cicloStatus = getCicloStatus(cursos);
          const isCollapsed = ciclosColapsados[ciclo];
          const totalCursos = cursos.length;
          const aprobados = cursos.filter(curso => cursosAprobados.includes(curso.codigo)).length;
          
          return (
            <div key={ciclo} className={`semester-box ${cicloStatus} ${isCollapsed ? 'collapsed' : ''}`}>
              <h4 onClick={() => toggleCiclo(ciclo)}>
                <div className="cycle-header">
                  <label className="cycle-checkbox">
                    <input
                      type="checkbox"
                      checked={isCicloCompleto(cursos)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCicloCompleto(cursos, e.target.checked);
                      }}
                    />
                    Ciclo {ciclo}
                  </label>
                  <span className="cycle-status">
                    {aprobados}/{totalCursos} cursos aprobados
                  </span>
                </div>
                <span className="toggle-icon">▼</span>
              </h4>
              <div className="courses-container">
                {cursos.map((curso) => {
                  const isApproved = cursosAprobados.includes(curso.codigo);
                  return (
                    <label 
                      key={curso.codigo} 
                      className={`course-label ${isApproved ? 'approved' : 'pending'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isApproved}
                        onChange={() => handleCursoChange(curso.codigo)}
                      />
                      <span className="course-info">
                        <strong>{curso.codigo}</strong>
                        <br />
                        {curso.nombre}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="course-form">
      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-group">
          <label htmlFor="malla-select">1. Selecciona tu Malla de Ingreso:</label>
          <select 
            id="malla-select" 
            value={mallaSeleccionada} 
            onChange={handleMallaChange} 
            required
          >
            <option value="" disabled>-- Elige una opción --</option>
            <option value="2015">Malla 2015</option>
            <option value="2019">Malla 2019</option>
            <option value="2022">Malla 2022</option>
            <option value="2025">Malla 2025</option>
          </select>
        </div>

        {renderCourseSelector()}
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={cargando || !mallaSeleccionada}
        >
          {cargando ? 'Calculando...' : 'Obtener Recomendación'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {recomendacion && (
        <div className="results-container">
          <h2>🚀 Cursos Recomendados para tu Próximo Ciclo</h2>
          <div className="recommendation-list">
            {recomendacion?.recommendation?.length > 0 ? (
              recomendacion.recommendation.map((curso) => (
                <div key={curso.codigo} className="course-card">
                  <span className="course-code">Ciclo {curso.ciclo} - {curso.codigo}</span>
                  <p className="course-name">{curso.nombre}</p>
                  <span className="course-credits">{curso.creditos} créditos</span>
                </div>
              ))
            ) : (
              <p>No se encontraron cursos para recomendar con los criterios actuales.</p>
            )}
          </div>
          {recomendacion?.credits !== undefined && (
            <p className="credits-summary">
              <strong>Total de créditos recomendados: {recomendacion.credits} / {recomendacion.max_credits}</strong>
            </p>
          )}
        </div>
      )}

      
    </div>
  );
};

export default CourseForm;