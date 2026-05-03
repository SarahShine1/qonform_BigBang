# Qonform — SI ISO 9001 🏆

> Système d'information de préparation à la certification ISO 9001:2015 — ESI Alger
---

## 📁 Structure du projet

```
QONFORM/
├── backend/                        # API Django REST Framework
│   ├── apps/
│   │   ├── accounts/               # Authentification & utilisateurs
│   │   ├── audit/                  # Module audit interne
│   │   ├── diagnostic/             # Diagnostic ISO 9001
│   │   ├── documents/              # Gestion documentaire
│   │   ├── pilotage/               # Tableau de bord & pilotage
│   │   └── processus/              # Cartographie des processus
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py             # Settings communs
│   │   │   ├── dev.py              # Settings développement
│   │   │   └── prod.py             # Settings production
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── core/                       # Utilitaires partagés
│   ├── .env                        # Variables d'env (NON versionné)
│   ├── .env.example                # Template variables d'env
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                       # Application React + Vite
│   ├── src/
│   │   ├── api/                    # Appels API (axios)
│   │   ├── assets/                 # Images, icônes
│   │   ├── components/             # Composants réutilisables
│   │   ├── constants/              # Constantes globales
│   │   ├── context/                # React Context (auth, theme...)
│   │   ├── hooks/                  # Custom hooks
│   │   ├── pages/                  # Pages de l'application
│   │   ├── utils/                  # Fonctions utilitaires
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── .env                        # Variables d'env front (NON versionné)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
│
├── README.md
└── CONTRIBUTING.md
```

---

## ⚙️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Django 5.1 + Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| Base de données | PostgreSQL (Supabase) |
| API Docs | drf-spectacular (Swagger / ReDoc) |

---

## 🔗 Endpoints principaux

| Endpoint | Description |
|----------|-------------|
| `GET /` | Statut de l'API |
| `GET /admin/` | Interface d'administration Django |
| `POST /api/v1/auth/token/` | Obtenir un JWT |
| `POST /api/v1/auth/token/refresh/` | Rafraîchir le JWT |
| `GET /api/schema/swagger-ui/` | Documentation Swagger |

---

## 🚀 Installation rapide

> Voir **[CONTRIBUTING.md](./CONTRIBUTING.md)** pour les instructions complètes d'installation et les règles de collaboration.

---

## 👥 Équipe

Projet réalisé dans le cadre du module **PRJP** — ESI Alger, année 2025-2026.

---

## 📄 Licence

Usage académique uniquement — ESI Alger.