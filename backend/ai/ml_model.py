import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'risk_model.joblib')

def generate_training_data(n_samples=500):
    """
    Génère des données synthétiques calibrées sur nos 9 features réelles.
    Labels : 0=vert (sain), 1=orange (modéré), 2=rouge (critique)
    """
    np.random.seed(42)
    X, y = [], []

    # ── Classe 0 : Projets sains (vert) ──────────────────────────
    n = n_samples // 3
    for _ in range(n):
        X.append([
            np.random.randint(0, 2),        # nb_risks_open
            np.random.uniform(0, 3),        # avg_criticality_open
            np.random.uniform(0, 0.1),      # ratio_risks_inacceptable
            np.random.uniform(0, 0.1),      # ratio_actions_late
            np.random.uniform(0, 0.1),      # ratio_actions_stuck
            np.random.uniform(0.7, 1.0),    # satisfaction_index
            np.random.uniform(0.5, 1.0),    # at_step_normalized
            np.random.choice([0, 1]),       # at_status_terminee
            np.random.uniform(0, 1.0),      # project_age_normalized
        ])
        y.append(0)

    # ── Classe 1 : Projets modérés (orange) ──────────────────────
    for _ in range(n):
        X.append([
            np.random.randint(1, 4),
            np.random.uniform(3, 7),
            np.random.uniform(0.1, 0.4),
            np.random.uniform(0.1, 0.4),
            np.random.uniform(0.1, 0.4),
            np.random.uniform(0.4, 0.7),
            np.random.uniform(0.25, 0.75),
            0,
            np.random.uniform(0.1, 0.8),
        ])
        y.append(1)

    # ── Classe 2 : Projets critiques (rouge) ─────────────────────
    for _ in range(n):
        X.append([
            np.random.randint(3, 8),
            np.random.uniform(7, 16),
            np.random.uniform(0.4, 1.0),
            np.random.uniform(0.4, 1.0),
            np.random.uniform(0.4, 1.0),
            np.random.uniform(0.0, 0.4),
            np.random.uniform(0, 0.5),
            0,
            np.random.uniform(0.3, 1.0),
        ])
        y.append(2)

    return np.array(X), np.array(y)


def train_model():
    """Entraîne le Random Forest et sauvegarde le modèle."""
    print("Génération des données d'entraînement...")
    X, y = generate_training_data(n_samples=600)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Entraînement du modèle Random Forest...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    print("Évaluation du modèle :")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred,
          target_names=['Vert (sain)', 'Orange (modéré)', 'Rouge (critique)']))

    joblib.dump(model, MODEL_PATH)
    print(f"Modèle sauvegardé dans : {MODEL_PATH}")
    return model


def load_model():
    """Charge le modèle depuis le fichier .joblib."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Modèle non trouvé. Lance d'abord : python manage.py train_model"
        )
    return joblib.load(MODEL_PATH)


FEATURE_NAMES = [
    'nb_risks_open',
    'avg_criticality_open',
    'ratio_risks_inacceptable',
    'ratio_actions_late',
    'ratio_actions_stuck',
    'satisfaction_index',
    'at_step_normalized',
    'at_status_terminee',
    'project_age_normalized',
]

LEVEL_MAP = {0: 'vert', 1: 'orange', 2: 'rouge'}

RECOMMENDATIONS = {
    'vert': {
        'text': 'Projet sain. Maintenir le suivi en place et continuer les bonnes pratiques.',
        'iso_clause': 'ISO 9001 §10.3 — Amélioration continue'
    },
    'orange': {
        'text': 'Risques modérés détectés. Renforcer le suivi des actions en cours et réévaluer les risques ouverts.',
        'iso_clause': 'ISO 9001 §6.1 — Actions face aux risques'
    },
    'rouge': {
        'text': 'Projet en situation critique. Escalader immédiatement au responsable qualité et déclencher un plan de contingence.',
        'iso_clause': 'ISO 9001 §8.7 — Maîtrise des éléments de sortie non conformes'
    },
}