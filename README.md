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
