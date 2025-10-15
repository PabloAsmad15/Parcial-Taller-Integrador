import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

// Para que el formulario funcione rápido, ponemos aquí los datos de los cursos.
// Asegúrate de que los códigos coincidan con tus archivos CSV.
const cursosPorMalla = {
  "2015": {
    "1": [
      { "codigo": "ICSI-400", "nombre": "FUNDAMENTOS DE PROGRAMACION I" },
      { "codigo": "ICSI-401", "nombre": "INTRODUCCION A LA ING. DE SISTEMAS Y TECNOLOGIA DE INFORMACION" },
      { "codigo": "ICSI-450", "nombre": "FISICA GENERAL" },
      { "codigo": "CIEN-397", "nombre": "MATEMATICA I" },
      { "codigo": "HUMA-900", "nombre": "METODOLOGIA DEL APRENDIZAJE UNIVERSITARIO" },
      { "codigo": "HUMA-899", "nombre": "LENGUAJE I" },
      { "codigo": "ICSI-451", "nombre": "ACTIVIDAD FORMATIVA I: Desarrollo Personal" }
    ],
    "2": [
      { "codigo": "ICSI-402", "nombre": "FUNDAMENTOS DE PROGRAMACION II" },
      { "codigo": "CIEN-597", "nombre": "ALGEBRA LINEAL Y GEOMETRIA DESCRIPTIVA" },
      { "codigo": "CIEN-539", "nombre": "FISICA I" },
      { "codigo": "CIEN-599", "nombre": "MATEMATICA II" },
      { "codigo": "HUMA-1020", "nombre": "PSICOLOGIA GENERAL" },
      { "codigo": "HUMA-901", "nombre": "LENGUAJE II" },
      { "codigo": "HUMA-641", "nombre": "ACTIVIDAD FORMATIVA II: Apreciación Musical" }
    ],
    "3": [
      { "codigo": "ICSI-403", "nombre": "PROGRAMACION ORIENTADA A OBJETOS" },
      { "codigo": "ICSI-404", "nombre": "FUNDAMENTOS DE SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-405", "nombre": "FISICA APLICADA A LA COMPUTACION" },
      { "codigo": "CIEN-600", "nombre": "MATEMATICA III" },
      { "codigo": "HUMA-903", "nombre": "FILOSOFIA DE LA CIENCIA" },
      { "codigo": "HUMA-679", "nombre": "ACTIVIDAD FORMATIVA III: Apreciación Artística" }
    ],
    "4": [
      { "codigo": "ICSI-406", "nombre": "ESTRUCTURAS DE DATOS E INFORMACION" },
      { "codigo": "ICSI-407", "nombre": "MATEMATICA DISCRETA PARA LA COMPUTACION" },
      { "codigo": "ICSI-408", "nombre": "ARQUITECTURA DE COMPUTADORAS" },
      { "codigo": "HUMA-904", "nombre": "REALIDAD NACIONAL Y REGIONAL" },
      { "codigo": "ICSI-409", "nombre": "ORGANIZACIÓN Y GESTION DE EMPRESAS" },
      { "codigo": "HUMA-701", "nombre": "ACTIVIDAD FORMATIVA IV: Sem. Antenor Orrego" }
    ],
    "5": [
      { "codigo": "ICSI-410", "nombre": "BASE DE DATOS" },
      { "codigo": "ICSI-411", "nombre": "AUTOMATAS Y COMPILADORES" },
      { "codigo": "CIEN-598", "nombre": "ESTADISTICA Y PROBABILIDADES" },
      { "codigo": "ICSI-412", "nombre": "INTERACCION HOMBRE MAQUINA" },
      { "codigo": "INSO-135", "nombre": "INGENIERIA DE SOFTWARE I" },
      { "codigo": "HUMA-905", "nombre": "METODOLOGIA DE LA INVESTIGACION CIENTIFICA" }
    ],
    "6": [
      { "codigo": "ICSI-413", "nombre": "DESARROLLO DE APLICACIONES" },
      { "codigo": "ICSI-414", "nombre": "SISTEMAS DE GESTION DE BASE DE DATOS" },
      { "codigo": "ICSI-415", "nombre": "MODELADO DE PROCESOS DE NEGOCIOS I" },
      { "codigo": "ICSI-416", "nombre": "SISTEMAS OPERATIVOS" },
      { "codigo": "INSO-136", "nombre": "INGENIERIA DE SOFTWARE II" },
      { "codigo": "ICSI-417", "nombre": "SISTEMAS DE CONTABILIDAD Y PRESUPUESTOS" }
    ],
    "7": [
      { "codigo": "ICSI-418", "nombre": "SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-419", "nombre": "MODELADO DE PROCESOS DE NEGOCIOS II" },
      { "codigo": "ICSI-420", "nombre": "ARQUITECTURA DE REDES DE COMPUTADORAS" },
      { "codigo": "ICSI-421", "nombre": "PLANEAMIENTO ESTRATEGICO DE TIC" },
      { "codigo": "ICSI-422", "nombre": "INVESTIGACION DE OPERACIONES" },
      { "codigo": "ICSI-423", "nombre": "MEDIO AMBIENTE Y DESARROLLO SOSTENIBLE" }
    ],
    "8": [
      { "codigo": "ICSI-424", "nombre": "ADMINISTRACION DE PROYECTOS DE SIST. DE INFORMACION" },
      { "codigo": "ICSI-425", "nombre": "SISTEMAS DE SOPORTE DE DECISIONES" },
      { "codigo": "ICSI-426", "nombre": "ADMINISTRACION DE REDES Y SEGURIDAD DE LA INFORMACION" },
      { "codigo": "ICSI-427", "nombre": "GERENCIA DE TI" },
      { "codigo": "ICSI-428", "nombre": "PROYECTO DE INVESTIGACION" },
      { "codigo": "ICSI-429", "nombre": "INTELIGENCIA DE PROCESOS DE NEGOCIOS" },
      { "codigo": "INSO-137", "nombre": "INGENIERIA DE SOFTWARE III" },
      { "codigo": "ICSI-430", "nombre": "PROGRAMACION DE APLICACIONES WEB" }
    ],
    "9": [
      { "codigo": "ICSI-431", "nombre": "AUDITORIA DE SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-432", "nombre": "SISTEMAS DE INFORMACION ESTRATEGICA" },
      { "codigo": "ICSI-433", "nombre": "ADMINISTRACION Y ARQUITECTURA DE MAINFRAMES" },
      { "codigo": "HUMA-906", "nombre": "ETICA Y DEONTOLOGIA" },
      { "codigo": "ICSI-434", "nombre": "TESIS I" },
      { "codigo": "ICSI-435", "nombre": "SISTEMAS INTELIGENTES" },
      { "codigo": "ICSI-436", "nombre": "DESARROLLO DE APLICACIONES PARA DISPOSITIVOS MOVILES" },
      { "codigo": "ICSI-437", "nombre": "AUTOMATIZACION DE PROCESOS INDUSTRIALES" },
      { "codigo": "ICSI-438", "nombre": "PRACTICAS PRE-PROFESIONALES" },
      { "codigo": "ICSI-439", "nombre": "PROGRAMACION DE MAINFRAMES" }
    ],
    "10": [
      { "codigo": "ICSI-440", "nombre": "TESIS II" },
      { "codigo": "ICSI-441", "nombre": "EMPRENDIMIENTO Y MODELAMIENTO DE NEGOCIOS" },
      { "codigo": "ICSI-442", "nombre": "COMPUTACION VISUAL Y ACCESIBILIDAD AUMENTADA" },
      { "codigo": "ICSI-443", "nombre": "INTEGRACION DE APLICACIONES EMPRESARIALES" },
      { "codigo": "ICSI-444", "nombre": "DESARROLLO DE APLICACIONES PARA VIDEOJUEGOS" }
    ]
  },
  "2019": {
    "1": [
      { "codigo": "ICSI-506", "nombre": "ALGORITMIA Y PROGRAMACIÓN" },
      { "codigo": "ICSI-507", "nombre": "INTRODUCCION A LA ING. DE SISTEMAS DE INFORMACIÓN Y TECNOLOGIA DE INFORMACION" },
      { "codigo": "CIEN-532", "nombre": "FÍSICA GENERAL" },
      { "codigo": "CIEN-397", "nombre": "MATEMATICA I" },
      { "codigo": "HUMA-900", "nombre": "METODOLOGIA DEL APRENDIZAJE UNIVERSITARIO" },
      { "codigo": "HUMA-899", "nombre": "LENGUAJE I" },
      { "codigo": "HUMA-1012", "nombre": "ACTIVIDAD FORMATIVA I: Inducción a la Vida Universitaria y Desarrollo Personal" }
    ],
    "2": [
      { "codigo": "ICSI-402", "nombre": "FUNDAMENTOS DE PROGRAMACION II" },
      { "codigo": "CIEN-597", "nombre": "ALGEBRA LINEAL Y GEOMETRIA DESCRIPTIVA" },
      { "codigo": "CIEN-539", "nombre": "FISICA I" },
      { "codigo": "CIEN-599", "nombre": "MATEMATICA II" },
      { "codigo": "HUMA-1020", "nombre": "PSICOLOGIA GENERAL" },
      { "codigo": "HUMA-901", "nombre": "LENGUAJE II" },
      { "codigo": "HUMA-641", "nombre": "ACTIVIDAD FORMATIVA II: Apreciación Musical" }
    ],
    "3": [
      { "codigo": "ICSI-403", "nombre": "PROGRAMACION ORIENTADA A OBJETOS" },
      { "codigo": "ICSI-404", "nombre": "FUNDAMENTOS DE SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-405", "nombre": "FISICA APLICADA A LA COMPUTACION" },
      { "codigo": "CIEN-600", "nombre": "MATEMATICA III" },
      { "codigo": "HUMA-903", "nombre": "FILOSOFIA DE LA CIENCIA" },
      { "codigo": "HUMA-679", "nombre": "ACTIVIDAD FORMATIVA III: Apreciación Artística" }
    ],
    "4": [
      { "codigo": "ICSI-406", "nombre": "ESTRUCTURAS DE DATOS E INFORMACION" },
      { "codigo": "ICSI-407", "nombre": "MATEMATICA DISCRETA PARA LA COMPUTACION" },
      { "codigo": "ICSI-408", "nombre": "ARQUITECTURA DE COMPUTADORAS" },
      { "codigo": "HUMA-904", "nombre": "REALIDAD NACIONAL Y REGIONAL" },
      { "codigo": "ICSI-409", "nombre": "ORGANIZACIÓN Y GESTION DE EMPRESAS" },
      { "codigo": "HUMA-701", "nombre": "ACTIVIDAD FORMATIVA IV: Sem. Antenor Orrego" }
    ],
    "5": [
      { "codigo": "ICSI-410", "nombre": "BASE DE DATOS" },
      { "codigo": "ICSI-411", "nombre": "AUTOMATAS Y COMPILADORES" },
      { "codigo": "CIEN-598", "nombre": "ESTADISTICA Y PROBABILIDADES" },
      { "codigo": "ICSI-412", "nombre": "INTERACCION HOMBRE MAQUINA" },
      { "codigo": "INSO-135", "nombre": "INGENIERIA DE SOFTWARE I" },
      { "codigo": "HUMA-905", "nombre": "METODOLOGIA DE LA INVESTIGACION CIENTIFICA" }
    ],
    "6": [
      { "codigo": "ICSI-413", "nombre": "DESARROLLO DE APLICACIONES" },
      { "codigo": "ICSI-414", "nombre": "SISTEMAS DE GESTION DE BASE DE DATOS" },
      { "codigo": "ICSI-415", "nombre": "MODELADO DE PROCESOS DE NEGOCIOS I" },
      { "codigo": "ICSI-416", "nombre": "SISTEMAS OPERATIVOS" },
      { "codigo": "INSO-136", "nombre": "INGENIERIA DE SOFTWARE II" },
      { "codigo": "ICSI-417", "nombre": "SISTEMAS DE CONTABILIDAD Y PRESUPUESTOS" }
    ],
    "7": [
      { "codigo": "ICSI-418", "nombre": "SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-419", "nombre": "MODELADO DE PROCESOS DE NEGOCIOS II" },
      { "codigo": "ICSI-420", "nombre": "ARQUITECTURA DE REDES DE COMPUTADORAS" },
      { "codigo": "ICSI-421", "nombre": "PLANEAMIENTO ESTRATEGICO DE TIC" },
      { "codigo": "ICSI-422", "nombre": "INVESTIGACION DE OPERACIONES" },
      { "codigo": "ICSI-423", "nombre": "MEDIO AMBIENTE Y DESARROLLO SOSTENIBLE" }
    ],
    "8": [
      { "codigo": "ICSI-424", "nombre": "ADMINISTRACION DE PROYECTOS DE SIST. DE INFORMACION" },
      { "codigo": "ICSI-425", "nombre": "SISTEMAS DE SOPORTE DE DECISIONES" },
      { "codigo": "ICSI-426", "nombre": "ADMINISTRACION DE REDES Y SEGURIDAD DE LA INFORMACION" },
      { "codigo": "ICSI-427", "nombre": "GERENCIA DE TI" },
      { "codigo": "ICSI-428", "nombre": "PROYECTO DE INVESTIGACION" },
      { "codigo": "ICSI-429", "nombre": "INTELIGENCIA DE PROCESOS DE NEGOCIOS" },
      { "codigo": "INSO-137", "nombre": "INGENIERIA DE SOFTWARE III" },
      { "codigo": "ICSI-430", "nombre": "PROGRAMACION DE APLICACIONES WEB" }
    ],
    "9": [
      { "codigo": "ICSI-431", "nombre": "AUDITORIA DE SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-432", "nombre": "SISTEMAS DE INFORMACION ESTRATEGICA" },
      { "codigo": "ICSI-433", "nombre": "ADMINISTRACION Y ARQUITECTURA DE MAINFRAMES" },
      { "codigo": "HUMA-906", "nombre": "ETICA Y DEONTOLOGIA" },
      { "codigo": "ICSI-434", "nombre": "TESIS I" },
      { "codigo": "ICSI-435", "nombre": "SISTEMAS INTELIGENTES" },
      { "codigo": "ICSI-436", "nombre": "DESARROLLO DE APLICACIONES PARA DISPOSITIVOS MOVILES" },
      { "codigo": "ICSI-437", "nombre": "AUTOMATIZACION DE PROCESOS INDUSTRIALES" },
      { "codigo": "ICSI-438", "nombre": "PRACTICAS PRE-PROFESIONALES" },
      { "codigo": "ICSI-439", "nombre": "PROGRAMACION DE MAINFRAMES" }
    ],
    "10": [
      { "codigo": "ICSI-440", "nombre": "TESIS II" },
      { "codigo": "ICSI-441", "nombre": "EMPRENDIMIENTO Y MODELAMIENTO DE NEGOCIOS" },
      { "codigo": "ICSI-442", "nombre": "COMPUTACION VISUAL Y ACCESIBILIDAD AUMENTADA" },
      { "codigo": "ICSI-443", "nombre": "INTEGRACION DE APLICACIONES EMPRESARIALES" },
      { "codigo": "ICSI-444", "nombre": "DESARROLLO DE APLICACIONES PARA VIDEOJUEGOS" }
    ]
  },
  "2022": {
    "1": [
      { "codigo": "ICSI-506", "nombre": "ALGORITMIA Y PROGRAMACIÓN" },
      { "codigo": "ICSI-507", "nombre": "INTRODUCCION A LA INGENIERÍA DE SISTEMAS Y TECNOLOGIA DE INFORMACION" },
      { "codigo": "CIEN-532", "nombre": "FÍSICA GENERAL" },
      { "codigo": "CIEN-397", "nombre": "MATEMATICA I" },
      { "codigo": "HUMA-900", "nombre": "METODOLOGIA DEL APRENDIZAJE UNIVERSITARIO" },
      { "codigo": "HUMA-899", "nombre": "LENGUAJE I" },
      { "codigo": "HUMA-1012", "nombre": "ACTIVIDAD FORMATIVA I: Inducción a la vida universitaria y desarrollo personal" }
    ],
    "2": [
      { "codigo": "ICSI-509", "nombre": "PROGRAMACIÓN ORIENTADO A OBJETOS" },
      { "codigo": "CIEN-597", "nombre": "ALGEBRA LINEAL Y GEOMETRÍA DESCRIPTIVA" },
      { "codigo": "CIEN-539", "nombre": "FISICA I" },
      { "codigo": "CIEN-599", "nombre": "MATEMATICA II" },
      { "codigo": "HUMA-1021", "nombre": "PSICOLOGIA Y DESARROLLO HUMANO" },
      { "codigo": "HUMA-901", "nombre": "LENGUAJE II" },
      { "codigo": "HUMA-641", "nombre": "ACTIVIDAD FORMATIVA II: Apreciación musical" }
    ],
    "3": [
      { "codigo": "ICSI-510", "nombre": "PATRONES DE DISEÑO DE SOFTWARE" },
      { "codigo": "HUMA-1025", "nombre": "ETICA Y VALORES" },
      { "codigo": "CIEN-648", "nombre": "FISICA II" },
      { "codigo": "CIEN-649", "nombre": "MATEMÁTICA DISCRETA" },
      { "codigo": "HUMA-903", "nombre": "FILOSOFIA DE LA CIENCIA" },
      { "codigo": "ICSI-511", "nombre": "ESTRUCTURA DE DATOS Y ALGORITMOS" },
      { "codigo": "HUMA-679", "nombre": "ACTIVIDAD FORMATIVA III: Apreciación de las Artes Plásticas" }
    ],
    "4": [
      { "codigo": "HUMA-1024", "nombre": "REALIDAD NACIONAL Y REGIONAL" },
      { "codigo": "ICSI-512", "nombre": "PARADIGMAS DE PROGRAMACIÓN" },
      { "codigo": "ICSI-513", "nombre": "INGENIERÍA DE REQUISITOS" },
      { "codigo": "ICSI-514", "nombre": "ARQUITECTURA DE COMPUTADORAS" },
      { "codigo": "CIEN-651", "nombre": "ESTADÍSTICA DESCRIPTIVA" },
      { "codigo": "ICSI-515", "nombre": "BASE DE DATOS" },
      { "codigo": "HUMA-1027", "nombre": "ACTIVIDAD FORMATIVA IV: Vigencia y trascendencia del pensamiento de Antenor Orrego" }
    ],
    "5": [
      { "codigo": "ICSI-516", "nombre": "GESTIÓN DE PROCESOS DE NEGOCIOS" },
      { "codigo": "ICSI-517", "nombre": "INTERACCION HOMBRE MAQUINA" },
      { "codigo": "ICSI-518", "nombre": "INGENIERIA DE SOFTWARE I" },
      { "codigo": "ICSI-519", "nombre": "SISTEMAS OPERATIVOS" },
      { "codigo": "CIEN-655", "nombre": "ESTADÍSTICA INFERENCIAL" },
      { "codigo": "HUMA-1038", "nombre": "CIUDADANIA Y DERECHOS HUMANOS" }
    ],
    "6": [
      { "codigo": "ICSI-521", "nombre": "SISTEMAS DE GESTION DE BASE DE DATOS" },
      { "codigo": "ICSI-538", "nombre": "ORGANIZACIÓN Y GESTIÓN DE EMPRESAS" },
      { "codigo": "ICSI-522", "nombre": "SISTEMAS DE INFORMACIÓN TRANSACCIONALES" },
      { "codigo": "ICSI-523", "nombre": "INGENIERIA DE SOFTWARE II" },
      { "codigo": "ICSI-524", "nombre": "ARQUITECTURA Y ADMINISTRACION DE REDES" },
      { "codigo": "ICSI-539", "nombre": "MÉTODOS CUANTITATIVOS PARA LOS NEGOCIOS" }
    ],
    "7": [
      { "codigo": "ICSI-526", "nombre": "GESTIÓN DE SERVICIOS DE TI" },
      { "codigo": "ICSI-527", "nombre": "INGENIERÍA DE DATOS" },
      { "codigo": "ICSI-528", "nombre": "ARQUITECTURA DE SOFTWARE" },
      { "codigo": "ICSI-529", "nombre": "FORMULACIÓN Y EVALUACIÓN DE PROYECTOS INFORMÁTICOS" },
      { "codigo": "ICSI-530", "nombre": "COMPUTACIÓN EN LA NUBE" },
      { "codigo": "HUMA-1043", "nombre": "METODOLOGÍA DE LA INVESTIGACIÓN CIENTÍFICA" }
    ],
    "8": [
      { "codigo": "ICSI-531", "nombre": "GESTIÓN DE PROYECTOS DE SISTEMAS DE INFORMACIÓN" },
      { "codigo": "ICSI-532", "nombre": "SISTEMAS DE SOPORTE DE DECISIONES" },
      { "codigo": "CIEN-662", "nombre": "MEDIO AMBIENTE Y DESARROLLO SOSTENIBLE" },
      { "codigo": "ICSI-540", "nombre": "INTEGRACION DE APLICACIONES EMPRESARIALES" },
      { "codigo": "ICSI-541", "nombre": "CALIDAD DEL SOFTWARE" },
      { "codigo": "ICSI-677", "nombre": "INTERNET DE LAS COSAS" }
    ],
    "9": [
      { "codigo": "ICSI-543", "nombre": "TRABAJO DE INVESTIGACIÓN" },
      { "codigo": "ICSI-544", "nombre": "INNOVACIÓN Y EMPRENDIMIENTO" },
      { "codigo": "ICSI-546", "nombre": "DEONTOLOGIA PROFESIONAL" },
      { "codigo": "ICSI-545", "nombre": "ARQUITECTURA EMPRESARIAL" },
      { "codigo": "ICSI-547", "nombre": "AUDITORIA DE SISTEMAS DE INFORMACION" },
      { "codigo": "ICSI-548", "nombre": "NEGOCIOS ELECTRÓNICOS" },
      { "codigo": "ICSI-549", "nombre": "COMPUTACION VISUAL Y ACCESIBILIDAD AUMENTADA" },
      { "codigo": "ICSI-550", "nombre": "DESARROLLO DE APLICACIONES PARA DISPOSITIVOS MOVILES" },
      { "codigo": "ICSI-551", "nombre": "SISTEMAS INTELIGENTES" },
      { "codigo": "ICSI-552", "nombre": "TESIS I" }
    ],
    "10": [
      { "codigo": "ICSI-553", "nombre": "GOBIERNO DE TI" },
      { "codigo": "ICSI-554", "nombre": "SISTEMAS GESTUALES Y CONVERSACIONALES" },
      { "codigo": "ICSI-555", "nombre": "CIBERSEGURIDAD" },
      { "codigo": "ICSI-556", "nombre": "BLOCKCHAIN" },
      { "codigo": "ICSI-557", "nombre": "INTELIGENCIA DE PROCESOS DE NEGOCIOS" },
      { "codigo": "ICSI-558", "nombre": "PRACTICAS PRE-PROFESIONALES" },
      { "codigo": "ICSI-559", "nombre": "TESIS II" },
      { "codigo": "ICSI-560", "nombre": "TALLER INTEGRADOR DE SISTEMAS Y TECNOLOGÍAS DE INFORMACIÓN" }
    ]
  },
  "2025": {
    "1": [
      { "codigo": "ICSI-506", "nombre": "ALGORITMIA Y PROGRAMACIÓN" },
      { "codigo": "HUMA-900", "nombre": "METODOLOGIA DEL APRENDIZAJE UNIVERSITARIO" },
      { "codigo": "HUMA-1179", "nombre": "COMUNICACIÓN I" },
      { "codigo": "ISIA-100", "nombre": "INTRODUCCIÓN A LA INGENIERÍA DE SISTEMAS EINTELIGENCIA ARTIFICIAL" },
      { "codigo": "CIEN-752", "nombre": "ALGEBRA MATRICIAL Y GEOMETRÍA ANALÍTICA" },
      { "codigo": "CIEN-753", "nombre": "CÁLCULO I" }
    ],
    "2": [
      { "codigo": "ICSI-509", "nombre": "PROGRAMACIÓN ORIENTADO A OBJETOS" },
      { "codigo": "HUMA-1181", "nombre": "FILOSOFIA Y PENSAMIENTO CRÍTICO" },
      { "codigo": "HUMA-1180", "nombre": "COMUNICACIÓN II" },
      { "codigo": "ADMI-779", "nombre": "ORGANIZACIÓN Y GESTIÓN DE EMPRESAS" },
      { "codigo": "CIEN-768", "nombre": "FÍSICA I" },
      { "codigo": "CIEN-754", "nombre": "CÁLCULO II" }
    ],
    "3": [
      { "codigo": "ISIA-101", "nombre": "ESTADÍSTICA PARA INGENIEROS" },
      { "codigo": "ICSI-671", "nombre": "ESTRUCTURA DE DATOS Y ALGORITMOS" },
      { "codigo": "HUMA-1182", "nombre": "REALIDAD NACIONAL Y GLOBAL" },
      { "codigo": "ICSI-672", "nombre": "GESTIÓN DE PROCESOS NEGOCIOS" },
      { "codigo": "CIEN-769", "nombre": "FÍSICA II" },
      { "codigo": "CIEN-755", "nombre": "CÁLCULO III" }
    ],
    "4": [
      { "codigo": "ISIA-102", "nombre": "REDES Y SISTEMAS OPERATIVOS" },
      { "codigo": "ISIA-103", "nombre": "SISTEMAS EMPRESARIALES" },
      { "codigo": "ICSI-673", "nombre": "BASE DE DATOS" },
      { "codigo": "ICSI-674", "nombre": "INGENIERÍA DE REQUISITOS" },
      { "codigo": "HUMA-1183", "nombre": "VIGENCIA Y TRASCENDENCIA DEL PENSAMIENTO DE ANTENOR ORREGO" },
      { "codigo": "HUMA-1184", "nombre": "ÉTICA, CIUDADANIA, DISCAPACIDAD E INCLUSIÓN" }
    ],
    "5": [
      { "codigo": "ISIA-104", "nombre": "COMPUTO DISTRIBUIDO Y PARALELO" },
      { "codigo": "CIEN-746", "nombre": "MEDIO AMBIENTE Y DESARROLLO SOSTENIBLE" },
      { "codigo": "ICSI-521", "nombre": "SISTEMA DE GESTIÓN DE BASE DE DATOS" },
      { "codigo": "ISIA-105", "nombre": "INGENIERÍA DEL SOFTWARE" },
      { "codigo": "ICSI-675", "nombre": "PATRONES DE DISEÑO DE SOFTWARE" },
      { "codigo": "ISIA-106", "nombre": "APRENDIZAJE ESTADISTICO" }
    ],
    "6": [
      { "codigo": "ISIA-107", "nombre": "INFRAESTRUCTURA COMO CÓDIGO" },
      { "codigo": "ISIA-108", "nombre": "INTELIGENCIA ARTIFICIAL PRINCIPIOS Y TÉCNICAS" },
      { "codigo": "HUMA-1185", "nombre": "METODOLOGÍA DE INVESTIGACIÓN CIENTÍFICA" },
      { "codigo": "ISIA-109", "nombre": "AGILE DEVELOPMENT" },
      { "codigo": "CIEN-747", "nombre": "TALLER DE CREATIVIDAD INNOVACIÓN Y EMPRENDIMIENTO" },
      { "codigo": "ICSI-676", "nombre": "MÉTODOS CUANTITATIVOS PARA LOS NEGOCIOS" }
    ],
    "7": [
      { "codigo": "ICSI-677", "nombre": "INTERNET DE LAS COSAS" },
      { "codigo": "ISIA-110", "nombre": "MACHINE LEARNING" },
      { "codigo": "ISIA-111", "nombre": "PERCEPCION COMPUTACIONAL" },
      { "codigo": "ISIA-113", "nombre": "CUSTOMER DEVELOPMENT" },
      { "codigo": "ISIA-114", "nombre": "AUTOMATIZACIÓN INTELIGENTE DE PROCESOS" },
      { "codigo": "ISIA-112", "nombre": "ARQUITECTURA DE SISTEMAS" }
    ],
    "8": [
      { "codigo": "ISIA-115", "nombre": "DEEP LEARNING" },
      { "codigo": "ICSI-546", "nombre": "DEONTOLOGIA PROFESIONAL" },
      { "codigo": "ISIA-116", "nombre": "BIG DATA Y ANALÍTICA DE DATOS" },
      { "codigo": "ICSI-678", "nombre": "GESTIÓN DE PROYECTOS DE SISTEMAS DE INFORMACIÓN" },
      { "codigo": "ISIA-117", "nombre": "PROYECTO DE INVESTIGACIÓN" },
      { "codigo": "ISIA-118", "nombre": "GOBIERNO DE DATOS" }
    ],
    "9": [
      { "codigo": "ISIA-119", "nombre": "MODELOS GENERATIVOS DE IA" },
      { "codigo": "ISIA-120", "nombre": "PROCESAMIENTO DE LENGUAJE NATURAL" },
      { "codigo": "ISIA-121", "nombre": "UX/UI" },
      { "codigo": "ICSI-679", "nombre": "SISTEMAS INFORMACIÓN INTEGRADOS" },
      { "codigo": "ISIA-123", "nombre": "TALLER INTEGRADOR I" },
      { "codigo": "ISIA-122", "nombre": "TESIS I" }
    ],
    "10": [
      { "codigo": "ISIA-125", "nombre": "TESIS II" },
      { "codigo": "ISIA-124", "nombre": "PRACTICAS PRE-PROFESIONALES" },
      { "codigo": "ISIA-126", "nombre": "TALLER INTEGRADOR II" },
      { "codigo": "ISIA-127", "nombre": "APLICACIONES MÓVILES PARA NEGOCIOS" },
      { "codigo": "ISIA-128", "nombre": "AUDITORIA DE SISTEMAS DE INFORMACIÓN" },
      { "codigo": "ISIA-129", "nombre": "AUDITORIA DE SISTEMAS INTELIGENTES" },
      { "codigo": "ISIA-130", "nombre": "NEGOCIOS CENTRADOS EN LA IA" },
      { "codigo": "ISIA-131", "nombre": "BLOCKCHAIN APLICADO A SISTEMAS EMPRESARIALES" },
      { "codigo": "ISIA-132", "nombre": "TRANSFORMACIÓN DIGITAL" },
      { "codigo": "ISIA-133", "nombre": "CIBERSEGURIDAD" }
    ]
  }
};

function App() {
  // Estados para manejar el formulario y los resultados
  const [mallaSeleccionada, setMallaSeleccionada] = useState('');
  const [cursosAprobados, setCursosAprobados] = useState([]);
  const [recomendacion, setRecomendacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ciclosColapsados, setCiclosColapsados] = useState({});

  // Inicializar todos los ciclos como colapsados cuando se selecciona una malla
  React.useEffect(() => {
    if (mallaSeleccionada && cursosPorMalla[mallaSeleccionada]) {
      const ciclos = Object.keys(cursosPorMalla[mallaSeleccionada]);
      const initialState = ciclos.reduce((acc, ciclo) => {
        acc[ciclo] = true; // true significa colapsado
        return acc;
      }, {});
      setCiclosColapsados(initialState);
    }
  }, [mallaSeleccionada]);
  
  // Función para alternar el estado de colapso de un ciclo
  const toggleCiclo = (ciclo) => {
    setCiclosColapsados(prev => ({
      ...prev,
      [ciclo]: !prev[ciclo]
    }));
  };

  // Verifica si un ciclo está completo o incompleto
  const getCicloStatus = (cursos) => {
    if (!cursos || cursos.length === 0) return '';
    const total = cursos.length;
    const aprobados = cursos.filter(curso => cursosAprobados.includes(curso.codigo)).length;
    
    if (aprobados === 0) return 'incomplete';
    if (aprobados === total) return 'complete';
    return 'incomplete';
  };

  // Maneja el cambio de la malla seleccionada
  const handleMallaChange = (event) => {
    const newMalla = event.target.value;
    setMallaSeleccionada(newMalla);
    // Limpia todos los cursos aprobados al cambiar de malla
    setCursosAprobados([]); 
    setRecomendacion(null);
    setError('');
  };

  // Maneja el click en un checkbox de un curso
  const handleCursoChange = (codigo) => {
    setCursosAprobados(prev => {
      const exists = prev.includes(codigo);
      // Si el curso ya está marcado, lo quitamos
      if (exists) return prev.filter(c => c !== codigo);
      // Si no está marcado, lo agregamos asegurándonos de que no haya duplicados
      return Array.from(new Set([...prev, codigo]));
    });
  };

  // Envía los datos al backend cuando se presiona el botón
  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setError('');
    setRecomendacion(null);

    try {
      // Define API URL based on environment
      const apiUrl = process.env.NODE_ENV === 'production'
        ? '/api/recommend'  // In production, use relative path
        : 'http://localhost:8000/api/recommend'; // In development, use local server
      
      const response = await axios.post(apiUrl, {
        malla_origen: parseInt(mallaSeleccionada, 10),
        cursos_aprobados: cursosAprobados,
      });
      
      // Validate response structure
      if (response?.data?.recommendation) {
        setRecomendacion(response.data);
      } else if (response?.data?.error) {
        setError(response.data.error);
      } else {
        setError('La respuesta del servidor no tiene el formato esperado.');
      }
    } catch (err) {
      console.error("Error al obtener la recomendación:", err);
      const errorMsg = err.response?.data?.error || 
                      'No se pudo obtener la recomendación. Revisa que el backend esté funcionando.';
      setError(errorMsg);
    } finally {
      setCargando(false);
    }
  };

  // Maneja el cambio en el checkbox de ciclo completo
  const handleCicloCompleto = (cursos, isChecked) => {
    setCursosAprobados(prev => {
      // Creamos un nuevo Set para mantener únicos los códigos
      const nuevosAprobados = new Set(prev);
      
      // Solo trabajamos con los cursos de la malla seleccionada
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

  // Verifica si todos los cursos de un ciclo están aprobados
  const isCicloCompleto = (cursos) => {
    return cursos.every(curso => cursosAprobados.includes(curso.codigo));
  };

  // Renderiza los checkboxes de los cursos
  const renderCourseSelector = () => {
    if (!mallaSeleccionada) return null;

    // Asegurarse de mostrar solo los cursos de la malla seleccionada
    const mallaData = cursosPorMalla[mallaSeleccionada] || {};
    
    // Filtrar los cursos aprobados para mostrar solo los de la malla actual
    const currentMallaCourses = new Set();
    Object.values(mallaData).forEach(ciclo => {
      ciclo.forEach(curso => currentMallaCourses.add(curso.codigo));
    });
    
    // Limpiar cualquier curso aprobado que no pertenezca a la malla actual
    if (cursosAprobados.some(codigo => !currentMallaCourses.has(codigo))) {
      setCursosAprobados(prev => prev.filter(codigo => currentMallaCourses.has(codigo)));
    }

    // Título con la malla seleccionada
    const title = `📚 Marca los cursos que ya aprobaste - Malla ${mallaSeleccionada}`;

    return (
      <div className="course-grid">
        <h3>{title}</h3>
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
  
  const [showCourses, setShowCourses] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Recomendador de Avance Curricular</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit} className="recommendation-form">
          <div className="form-group">
            <label htmlFor="malla-select">1. Selecciona tu Malla de Ingreso:</label>
            <select id="malla-select" value={mallaSeleccionada} onChange={handleMallaChange} required>
              <option value="" disabled>-- Elige una opción --</option>
              <option value="2015">Malla 2015</option>
              <option value="2019">Malla 2019</option>
              <option value="2022">Malla 2022</option>
              <option value="2025">Malla 2025</option>
            </select>
          </div>

          {renderCourseSelector()}
          
          <button type="submit" className="submit-btn" disabled={cargando || !mallaSeleccionada}>
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
      </main>
    </div>
  );
}

export default App;