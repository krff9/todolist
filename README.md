# 10.Б Училищен планер

A small school schedule and todo planner based on the provided 10.Б timetable.

## Run locally

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python backend\app.py
```

Open `frontend/index.html` directly for the static version. Todos are saved in browser local storage. To use the Flask API, set `window.SCHEDULE_API_BASE` in `frontend/index.html` to the backend URL before opening it.

## GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` publishes the `frontend/` directory to GitHub Pages. Enable Pages in the repository settings with **GitHub Actions** as the source.

GitHub Pages cannot run Python, so deploy the Flask API separately (for example on Render, Railway, or a VPS), then set `window.SCHEDULE_API_BASE` to that URL. The app still works without an API using local storage.

## Render backend

This repository includes `render.yaml`. In Render, choose **New > Blueprint**, connect `krff9/todolist`, and apply the blueprint. The commands use paths from the repository root: `pip install -r backend/requirements.txt` and `gunicorn --chdir backend app:app`. After deployment, check `https://YOUR-SERVICE.onrender.com/api/health` and then set `window.SCHEDULE_API_BASE` in `frontend/index.html` to `https://YOUR-SERVICE.onrender.com` before pushing the frontend change to GitHub.

The current backend uses SQLite. Render's local filesystem is not intended for durable production data, so use a managed PostgreSQL database if todos must survive service recreation or redeployments.

The workflow `.github/workflows/deploy-backend-render.yml` validates backend changes and can trigger a Render deploy hook. To let GitHub Actions start deployments explicitly, create a Render deploy hook for the `todolist-api` service and add its URL as the repository secret `RENDER_DEPLOY_HOOK_URL` under **Settings > Secrets and variables > Actions**. Without that secret, Render's native Git auto-deploy remains responsible for deployment.
