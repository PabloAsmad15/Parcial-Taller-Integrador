"""Constraint programming (simple implementation/stub).

This module implements a small CP-like solver: given available courses and a max credit
limit, it searches for a combination that maximizes number of courses (or credits).
If OR-Tools were available we could use it; here we implement a small branch-and-bound
search to keep dependencies minimal.
"""
def recomendar_constraint_basic(malla_completa, malla_por_ciclo, cursos_aprobados):
    # Build candidate courses (prereqs satisfied)
    cursos_aprobados_set = set(cursos_aprobados)
    candidates = []
    for ciclo, cursos in malla_por_ciclo.items():
        for c in cursos:
            if c['codigo'] not in cursos_aprobados_set and all(p in cursos_aprobados_set for p in c['prerrequisitos']):
                candidates.append(c)

    # Determine an approximate max credits like backtracking uses
    ultimo_ciclo = 0
    for ciclo in range(1, 11):
        codigos = {c['codigo'] for c in malla_por_ciclo.get(ciclo, [])}
        if not codigos or not codigos.issubset(cursos_aprobados_set):
            break
        ultimo_ciclo = ciclo
    ciclo_matricula = ultimo_ciclo + 1
    max_creditos = {1:20,2:21,3:22,4:20,5:21,6:21,7:21,8:20,9:22,10:17}.get(ciclo_matricula,21)

    # Simple branch and bound to maximize total credits (or number of courses)
    candidates.sort(key=lambda x: -x['creditos'])
    best = {'set': [], 'credits': 0}

    def dfs(i, chosen, credits):
        # prune
        if credits > max_creditos:
            return
        # update best by credits then count
        nonlocal best
        if credits > best['credits'] or (credits == best['credits'] and len(chosen) > len(best['set'])):
            best = {'set': chosen.copy(), 'credits': credits}
        if i >= len(candidates):
            return
        # choose
        dfs(i+1, chosen, credits)
        chosen.append(candidates[i]['codigo'])
        dfs(i+1, chosen, credits + candidates[i]['creditos'])
        chosen.pop()

    dfs(0, [], 0)
    return best['set'], best['credits'], max_creditos
