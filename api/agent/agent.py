"""Simple agent that decides which algorithm to use.

This agent only contains a lightweight heuristic to choose between the two
black-box algorithms (backtracking vs constraint programming). It does NOT
call any external LLM or persist runs. The decision threshold can be
configured via the environment variable AGENT_CP_THRESHOLD.
"""
import os

from typing import Dict, Any


def summarize_recommendation(malla_completa: dict, recommended_codes: list, credits: int, max_credits: int, algorithm: str, rationale: str, eligible_count: int) -> str:
    """Genera un resumen en español, comprensible para el usuario, explicando:
    - el algoritmo elegido
    - la razón/heurística de la elección
    - qué cursos se recomendaron (con nombre y créditos)
    - créditos recomendados vs máximo

    Esta función NO usa LLMs; construye un texto localmente.
    """
    if not recommended_codes:
        return "No se encontraron cursos recomendados con los datos proporcionados. Revise los cursos aprobados o los prerrequisitos."

    lines = []
    lines.append(f"Se eligió el método: {('Programación por restricciones' if algorithm=='constraint_programming' else 'Backtracking heurístico')}.")
    lines.append(f"Razonamiento técnico: {rationale} (candidatos elegibles: {eligible_count}).")

    lines.append("Cursos recomendados:")
    total = 0
    for codigo in recommended_codes:
        info = malla_completa.get(codigo)
        if info:
            nombre = info.get('nombre', '')
            creditos = info.get('creditos', 0)
            lines.append(f" - {codigo}: {nombre} — {creditos} créditos")
            total += creditos
        else:
            lines.append(f" - {codigo}: (información no disponible)")

    lines.append(f"Total de créditos recomendados: {credits} / {max_credits} (límite estimado de matrícula).")
    if credits > max_credits:
        lines.append("Nota: la suma de créditos excede el máximo estimado; revise la selección.")
    else:
        lines.append("Esta selección respeta el límite de créditos estimado para el próximo ciclo.")

    lines.append("Si desea, puede ajustar sus cursos aprobados en el formulario para obtener una nueva recomendación más precisa.")
    return "\n".join(lines)


def decide_algorithm(malla_por_ciclo, cursos_aprobados, threshold: int = None) -> Dict[str, Any]:
    """Decide which algorithm to use based on eligible candidate count.

    Returns a dict with keys:
      - algorithm: 'constraint_programming' or 'backtracking'
      - rationale: short text explaining the decision
      - eligible_count: number of eligible candidates considered
    """
    if threshold is None:
        try:
            threshold = int(os.getenv('AGENT_CP_THRESHOLD', '22'))
        except Exception:
            threshold = 22

    cursos_aprobados_set = set(cursos_aprobados)
    eligible = []
    for ciclo in range(1, 11):
        for c in malla_por_ciclo.get(ciclo, []):
            if c['codigo'] not in cursos_aprobados_set and all(p in cursos_aprobados_set for p in c['prerrequisitos']):
                eligible.append(c)

    eligible_count = len(eligible)
    use_cp = eligible_count <= threshold
    algorithm = 'constraint_programming' if use_cp else 'backtracking'
    rationale = f"eligible_candidates={eligible_count} threshold={threshold} -> {algorithm}"

    return {
        'algorithm': algorithm,
        'rationale': rationale,
        'eligible_count': eligible_count
    }
