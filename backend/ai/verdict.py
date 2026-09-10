"""
Moteur de verdict IA : transforme les 9 features en alertes ISO précises.
Chaque feature problématique → une AIAlert avec titre, détail, clause ISO.
"""

# Seuils par feature. Pour chaque feature : warning et critical.
# inverted=True → la valeur basse est mauvaise (ex: satisfaction)
FEATURE_RULES = [
    {
        'feature':  'ratio_actions_late',
        'warning':  0.20,
        'critical': 0.50,
        'iso':      'ISO 9001 §6.1.2 — Planification des actions face aux risques',
        'title':    lambda v: f"{int(v*100)}% des actions sont en retard",
        'detail':   lambda v: (
            f"{int(v*100)}% des actions du plan de traitement dépassent leur date planifiée. "
            "Des actions non exécutées dans les délais constituent une non-conformité "
            "ISO 9001 §6.1.2 et seront signalées lors d'un audit. "
            "Action recommandée : identifier les blocages et réaffecter les responsabilités."
        ),
    },
    {
        'feature':  'ratio_risks_inacceptable',
        'warning':  0.10,
        'critical': 0.30,
        'iso':      'ISO 9001 §6.1 — Risques et opportunités',
        'title':    lambda v: f"{int(v*100)}% des risques ouverts au niveau Inacceptable",
        'detail':   lambda v: (
            f"{int(v*100)}% des risques ouverts ont atteint le niveau Inacceptable. "
            "Ces risques nécessitent un plan de traitement documenté et validé immédiatement. "
            "Sans traitement, la certification ISO 9001 est compromise (§6.1 exige des actions planifiées)."
        ),
    },
    {
        'feature':  'ratio_actions_stuck',
        'warning':  0.25,
        'critical': 0.50,
        'iso':      'ISO 9001 §10.2 — Non-conformité et action corrective',
        'title':    lambda v: f"{int(v*100)}% des actions bloquées à 0% d'avancement",
        'detail':   lambda v: (
            f"{int(v*100)}% des actions correctives/préventives n'ont aucune progression (0%). "
            "Vérifier l'assignation des responsables et lever les obstacles. "
            "ISO 9001 §10.2 requiert que les actions correctives soient mises en œuvre et évaluées."
        ),
    },
    {
        'feature':  'avg_criticality_open',
        'warning':  6.0,
        'critical': 10.0,
        'iso':      'ISO 9001 §6.1 — Évaluation et traitement des risques',
        'title':    lambda v: f"Criticité moyenne élevée : {v:.1f}/16",
        'detail':   lambda v: (
            f"La criticité moyenne des risques ouverts est de {v:.1f}/16. "
            "Une criticité élevée sans plan de traitement actif indique un manque de maîtrise "
            "du processus de gestion des risques exigé par ISO 9001 §6.1."
        ),
    },
    {
        'feature':   'satisfaction_index',
        'warning':   0.60,
        'critical':  0.40,
        'inverted':  True,   # bas = mauvais
        'iso':       'ISO 9001 §9.1.2 — Satisfaction du client',
        'title':     lambda v: f"Satisfaction client faible : {int(v*100)}%",
        'detail':    lambda v: (
            f"L'indice de satisfaction client est de {int(v*100)}%, en dessous du seuil ISO. "
            "ISO 9001 §9.1.2 exige que l'organisation surveille la perception client. "
            "Action : analyser les retours de l'évaluation AT et déclencher des actions correctives."
        ),
    },
    {
        'feature':  'nb_risks_open',
        'warning':  4,
        'critical': 7,
        'iso':      'ISO 9001 §6.1 — Gestion des risques projet',
        'title':    lambda v: f"{int(v)} risques ouverts non traités",
        'detail':   lambda v: (
            f"Le projet a {int(v)} risques ouverts. Un nombre élevé de risques non clôturés "
            "indique un backlog de traitement. Planifier des sessions de revue des risques "
            "conformément à ISO 9001 §6.1."
        ),
    },
]


def generate_alerts(features: dict, ai_result) -> list[dict]:
    """
    Parcourt les règles, compare avec les features réelles,
    retourne une liste de dicts prêts à créer des AIAlert.
    """
    alerts = []
    for rule in FEATURE_RULES:
        value = features.get(rule['feature'])
        if value is None:
            continue

        inverted = rule.get('inverted', False)
        severity = None

        if inverted:
            if value < rule['critical']:
                severity = 'critical'
            elif value < rule['warning']:
                severity = 'warning'
        else:
            if value >= rule['critical']:
                severity = 'critical'
            elif value >= rule['warning']:
                severity = 'warning'

        if severity:
            alerts.append({
                'project':            ai_result.project,
                'ai_result':          ai_result,
                'severity':           severity,
                'feature_triggered':  rule['feature'],
                'title':              rule['title'](value),
                'detail':             rule['detail'](value),
                'iso_clause':         rule['iso'],
            })

    return alerts


def build_verdict(risk_level: str, alerts: list[dict]) -> str:
    """Génère le texte de verdict complet affiché sur le dashboard."""
    if not alerts:
        return (
            "✅ Aucune anomalie détectée. Le projet respecte les seuils de conformité. "
            "(ISO 9001 §10.3 — Amélioration continue)"
        )

    critiques  = [a for a in alerts if a['severity'] == 'critical']
    warnings   = [a for a in alerts if a['severity'] == 'warning']

    lines = []
    if risk_level == 'rouge':
        lines.append(f"🚨 SITUATION CRITIQUE — {len(critiques)} point(s) bloquant(s) détecté(s).")
    elif risk_level == 'orange':
        lines.append(f"⚠️ VIGILANCE REQUISE — {len(warnings)} avertissement(s) actif(s).")

    for a in critiques:
        lines.append(f"  🔴 {a['title']}  [{a['iso_clause']}]")
    for a in warnings:
        lines.append(f"  🟡 {a['title']}  [{a['iso_clause']}]")

    lines.append("→ Consulter le détail de chaque alerte pour les actions recommandées.")
    return "\n".join(lines)