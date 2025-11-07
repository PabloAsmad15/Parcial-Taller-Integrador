"""Backtracking recommendation algorithm (extracted)."""
def recomendar_backtracking_por_ramas(malla_completa, malla_por_ciclo, cursos_aprobados):
    cursos_aprobados_set = set(cursos_aprobados)
    ultimo_ciclo_completo = 0
    for ciclo in range(1, 11):
        codigos_del_ciclo = {c['codigo'] for c in malla_por_ciclo.get(ciclo, [])}
        if not codigos_del_ciclo or not codigos_del_ciclo.issubset(cursos_aprobados_set):
            break
        ultimo_ciclo_completo = ciclo

    ciclo_de_matricula = ultimo_ciclo_completo + 1
    max_creditos = {1:20, 2:21, 3:22, 4:20, 5:21, 6:21, 7:21, 8:20, 9:22, 10:17}.get(ciclo_de_matricula, 21)

    cursos_elegibles = []
    for ciclo in range(1, ciclo_de_matricula + 2):
        for curso in malla_por_ciclo.get(ciclo, []):
            if curso['codigo'] not in cursos_aprobados_set and all(p in cursos_aprobados_set for p in curso['prerrequisitos']):
                cursos_elegibles.append(curso)

    cursos_elegibles.sort(key=lambda x: (x['ciclo'], -x['creditos']))

    recomendacion, creditos_actuales = [], 0
    for curso in cursos_elegibles:
        if creditos_actuales + curso['creditos'] <= max_creditos:
            recomendacion.append(curso['codigo'])
            creditos_actuales += curso['creditos']

    return recomendacion, creditos_actuales, max_creditos
