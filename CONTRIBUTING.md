# 🤝 Guide de Collaboration — Qonform

Ce fichier contient les règles de travail en équipe sur GitHub et les étapes complètes pour installer le projet en local (backend + frontend).

---

## 📥 1. Cloner le projet

### Prérequis

Assure-toi d'avoir installé :
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- VS Code (recommandé)

### Cloner le repo

```bash
git clone https://github.com/SarahShine1/qonform_BigBang.git
cd qonform
```

---

## ⚙️ 2. Installation du Backend (Django)

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Créer l'environnement virtuel
python -m venv venv

# 3. Activer le venv
# Windows :
venv\Scripts\activate


# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Configurer les variables d'environnement
copy .env.example .env       # Windows
```

Ouvre `.env` et remplis les valeurs (demande les credentials à l'équipe) :


```bash
# 6. Appliquer les migrations
python manage.py migrate

# 7. (Optionnel) Créer un superutilisateur
python manage.py createsuperuser

# 8. Lancer le serveur backend
python manage.py runserver
```

✅ API disponible sur `http://127.0.0.1:8000/`  
✅ Admin Django sur `http://127.0.0.1:8000/admin/`

---

## 🎨 3. Installation du Frontend (React + Vite)

Ouvre un **nouveau terminal** (garde le backend qui tourne) :

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances Node
npm install

# 3. Configurer les variables d'environnement
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
```

Contenu du `.env` frontend :

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

```bash
# 4. Lancer le serveur frontend
npm run dev
```

✅ App disponible sur `http://localhost:5173/`

---

## 🌿 4. Convention des branches

Chaque membre travaille sur **sa propre branche**. Jamais directement sur `main`.

| Branche | Usage |
|---------|-------|
| `main` | Code stable, prêt pour la démo |
| `dev` | Branche d'intégration commune |
| `feature/nom-feature` | Nouvelle fonctionnalité |
| `fix/nom-bug` | Correction de bug |

### Créer sa branche de travail

```bash
git checkout dev
git pull origin dev
git checkout -b feature/ma-feature
```

### Exemples de noms de branches

```
feature/accounts-auth
feature/processus-crud
feature/pilotage-dashboard
fix/documents-upload
```

---

## 💬 5. Convention des commits

Format obligatoire :

```
type(scope): description courte en anglais
```

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `docs` | Documentation uniquement |
| `style` | Formatage, pas de logique |
| `test` | Ajout ou modification de tests |
| `chore` | Config, dépendances, tâches diverses |

### Exemples

```bash
git commit -m "feat(accounts): add JWT login endpoint"
git commit -m "feat(processus): add process list page"
git commit -m "fix(documents): correct file upload validation"
git commit -m "chore(frontend): add axios interceptor for auth"
```

---

## 🔁 6. Workflow Pull Request

```bash
# 1. Push ta branche
git push origin feature/ma-feature
```

2. Ouvrir une **Pull Request** sur GitHub → branche cible : `dev`
3. Remplir la description : ce que tu as fait, comment tester
4. Attendre la **review d'au moins un membre** avant de merger
5. **Ne jamais merger ta propre PR** sans validation

---

## ⛔ 7. Règles absolues

```
❌ Ne jamais pusher directement sur main
❌ Ne jamais commiter le fichier .env (backend ou frontend)
❌ Ne jamais commiter venv/ ou node_modules/
❌ Ne pas modifier le code d'un autre membre sans le prévenir
✅ Toujours pull avant de commencer à travailler
✅ Toujours créer une branche depuis dev à jour
✅ Toujours tester en local avant de pusher
```

---

## 📦 8. Répartition des modules

| Module | App Backend | Pages Frontend | Responsable |
|--------|-------------|----------------|-------------|
| Authentification | `accounts` | `pages/auth/` | |
| Processus | `processus` | `pages/processus/` | |
| Audit | `audit` | `pages/audit/` | |
| Documents | `documents` | `pages/documents/` | |
| Pilotage | `pilotage` | `pages/pilotage/` | |
| Diagnostic | `diagnostic` | `pages/diagnostic/` | |

> Remplis le tableau avec les noms de l'équipe.

---

## ❓ 9. En cas de problème

- Ouvrir une **Issue** sur GitHub avec le label approprié (`bug`, `question`, `enhancement`)
- Contacter le responsable du module concerné
- Ne pas hésiter à demander une review de code