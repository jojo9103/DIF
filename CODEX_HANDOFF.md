# CODEX Handoff (Model Site)

This file summarizes the current system so a new Codex session can understand the project quickly.

## 1) Stack
- Framework: Next.js App Router (`app/`)
- Runtime: Node.js (API routes use `runtime = "nodejs"` where needed)
- UI: React + Tailwind
- Auth: custom session cookie + JSON user store
- Inference pipeline: Python worker + Python model runner

## 2) Main Routes
- Landing: `/`
- Auth: `/auth`
- Upload (Start analysis): `/upload`
- Status: `/status` (jobs status page)
- Result: `/dashboard` (user result viewer)
- Demo: `/demo` (demo projects only)
- Jobs page: `/jobs` (detailed jobs list)

## 3) Data Directories
- Users: `data/users.json`
- Uploaded files: `data/upload/{userId}/{project}`
- Jobs: `data/jobs/{userId}/{jobId}.json`
- Results: `data/results/{userId}/{project}/{sample}/...`
- Demo results: `data/results/demo/...`, `data/results/Test/...`
- Models: `data/models/{backbone}_{num}_best_model_512.pt`

## 4) Auth System
- Client auth provider: `components/auth/auth-context.tsx`
- Auth guard: `components/auth/require-auth.tsx`
- API:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Session:
  - HttpOnly cookie
  - `RequireAuth` now waits for auth loading state before redirect to avoid false login redirects.

## 5) Upload -> Queue -> Worker -> Result Flow
1. User uploads in `/upload`.
2. `POST /api/upload` stores files in `data/upload/...` and creates a job JSON in `data/jobs/...`.
3. `scripts/worker.py` polls queued jobs, marks running, executes `scripts/model_runner.py`.
4. `model_runner.py` writes:
   - per-sample images (`original.png`, overlays, heatmaps)
   - `heatmap_summary.csv`
5. Results are shown in `/dashboard` via `/app/results/[...path]/route.ts`.

## 6) Job Behavior (Important Rules)
- Queue processing is sequential (one job at a time).
- Folder mode jobs run with `--batch-size 4`.
- Worker logs heartbeat/progress into job JSON and logs into:
  - `data/results/{user}/{project}/worker.log`
- Progress timeout handling exists in worker.
- Status page supports:
  - running-only filter
  - cancel/delete
  - failed reason modal
  - log auto-refresh + log download
- Delete behavior:
  - Non-done jobs: delete job + upload/result folders
  - Done jobs: delete job only (keep results)

## 7) Result / Demo Behavior
- `/dashboard`:
  - Shows user-specific projects from `data/results/{userId}`
  - Supports `?project=...` selection
  - Project delete button in tree (enabled)
- `/demo`:
  - Only allowed projects are `demo` and `Test`
  - Project delete disabled

## 8) Status Navigation
- Status is a dedicated page: `/status` (not `#status` hash mode anymore).
- Landing navbar status link points to `/status`.
- Dashboard navbar status link points to `/status`.
- Upload success redirect points to `/status`.

## 9) Key APIs
- Auth:
  - `app/api/auth/*`
- Upload:
  - `app/api/upload/route.ts`
- Jobs:
  - `GET /api/jobs` (list user jobs)
  - `PATCH /api/jobs` (cancel job)
  - `DELETE /api/jobs` (delete jobs; conditional folder cleanup)
  - `GET /api/jobs/log?id=...` (tail log JSON)
  - `GET /api/jobs/log?id=...&download=1` (download log text)
- Models:
  - `GET /api/models` (discover available backbones/model numbers from `data/models`)
- Results file serving:
  - `app/results/[...path]/route.ts`
- Results project delete:
  - `POST /api/results/delete` with `{ project }`

## 10) Model Runner Notes
- Script: `scripts/model_runner.py`
- Supports multiple backbones (resnext50_32x4d and others configured in code).
- Uses `--weights`, `--backbone`, `--classes`, `--batch-size`, `--progress-file`, `--targets`.
- For single image mode:
  - Optional targets saved by upload API (`targets.csv`)
  - `correct` calculated from target vs prediction when target exists.
- Heatmap summary includes:
  - `Image_name`
  - `{Pattern}_target`
  - `{Pattern}_prediction`
  - `{Pattern}_probability`
  - `{Pattern}_correct`

## 11) Frontend Components (Important)
- Main landing:
  - `components/main/navbar.tsx`
  - `components/main/hero.tsx`
- Dashboard:
  - `components/dashboard/navbar.tsx`
  - `components/dashboard/dashboard-content.tsx`
  - `components/dashboard/dashboard-viewer.tsx`
  - `components/dashboard/image-viewer.tsx`
  - `components/dashboard/viewer-tree.tsx`
  - `components/dashboard/status-panel.tsx`
  - `components/dashboard/clinical-table.tsx`

## 12) Shared Logic Added for Maintainability
- Results loader utilities:
  - `lib/results.ts`
- Jobs polling hook:
  - `hooks/use-jobs.ts`

## 13) Known Env / Runtime Notes
- Turbopack TLS issue was addressed in:
  - `next.config.ts` -> `experimental.turbopackUseSystemTlsCerts = true`
- If needed also set:
  - `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`

## 14) Common Troubleshooting
- No inference progress:
  - Ensure worker is running: `python scripts/worker.py`
  - Check `data/jobs/{user}/*.json` status/progress
  - Check `worker.log` in result folder
- Stuck at running:
  - verify model deps in active venv (torch/cv2)
  - verify worker and model runner use same Python executable
- Missing images in result:
  - verify output under `data/results/{user}/{project}/{sample}`
  - verify `/app/results/[...path]/route.ts` path mapping

## 15) Current Product Rules
- Landing "DIF image upload" button goes to `/upload`.
- Landing "Demo" button goes to `/demo`.
- Status page shows job status only.
- Result page shows user results only.

