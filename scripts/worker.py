import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

JOBS_ROOT = Path("data/jobs")
HEARTBEAT_SECONDS = 10
PROGRESS_TIMEOUT_SECONDS = 900  # 15 minutes without progress -> fail


def load_jobs():
    jobs = []
    if not JOBS_ROOT.exists():
        return jobs
    for user_dir in JOBS_ROOT.iterdir():
        if not user_dir.is_dir():
            continue
        for job_file in user_dir.glob("*.json"):
            try:
                with job_file.open("r", encoding="utf-8") as f:
                    job = json.load(f)
                job["__path"] = job_file
                jobs.append(job)
            except Exception:
                continue
    return jobs


def save_job(job):
    job_path = job.get("__path")
    if not job_path:
        return
    data = {k: v for k, v in job.items() if k != "__path"}
    with Path(job_path).open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def run_model(job):
    """
    Executes the model runner script.
    Expected script location: scripts/model_runner.py
    You can override with env var MODEL_RUNNER.
    """
    input_dir = job["inputDir"]
    output_dir = job["outputDir"]

    runner = os.environ.get("MODEL_RUNNER", "scripts/model_runner.py")
    output_root = Path(job["outputDir"])
    output_root.mkdir(parents=True, exist_ok=True)
    progress_file = output_root / "progress.txt"
    log_file = output_root / "worker.log"

    if job.get("mode") == "folder":
        clinical_src = Path(job.get("inputDir", "")) / "clinical_data"
        clinical_dest = output_root / "clinical_data"
        if clinical_src.exists():
            try:
                shutil.copytree(clinical_src, clinical_dest, dirs_exist_ok=True)
            except Exception:
                pass
    cmd = [
        sys.executable,
        runner,
        "--input",
        input_dir,
        "--output",
        output_dir,
        "--project",
        job.get("project", ""),
        "--user",
        job.get("userId", ""),
        "--progress-file",
        str(progress_file),
    ]

    weights = job.get("weightsPath") or os.environ.get("MODEL_WEIGHTS")
    if weights:
        cmd.extend(["--weights", weights])

    backbone = job.get("backbone") or os.environ.get("MODEL_BACKBONE")
    if backbone:
        cmd.extend(["--backbone", backbone])

    classes = job.get("classes") or os.environ.get("MODEL_CLASSES")
    if classes:
        cmd.extend(["--classes", classes])

    if job.get("mode") == "folder":
        cmd.extend(["--batch-size", "4"])
    targets_path = job.get("targetsPath")
    if targets_path:
        cmd.extend(["--targets", targets_path])
    with log_file.open("a", encoding="utf-8") as log:
        log.write(f"[{datetime.now(timezone.utc).isoformat()}] start: {' '.join(cmd)}\n")
        log.flush()
        process = subprocess.Popen(cmd, stdout=log, stderr=log, text=True)
    last_progress = None
    last_progress_at = time.time()
    last_heartbeat = 0.0
    while True:
        ret = process.poll()
        now = time.time()
        if progress_file.exists():
            try:
                value = progress_file.read_text(encoding="utf-8").strip()
                if value.isdigit():
                    progress = int(value)
                    if progress != last_progress:
                        job["progress"] = progress
                        job["lastProgressAt"] = datetime.now(timezone.utc).isoformat()
                        save_job(job)
                        last_progress = progress
                        last_progress_at = now
            except Exception:
                pass
        if now - last_heartbeat >= HEARTBEAT_SECONDS:
            job["lastHeartbeat"] = datetime.now(timezone.utc).isoformat()
            save_job(job)
            last_heartbeat = now
        if now - last_progress_at >= PROGRESS_TIMEOUT_SECONDS:
            process.kill()
            raise RuntimeError("progress timeout")
        if ret is not None:
            break
        time.sleep(1)

    process.communicate()
    if process.returncode != 0:
        raise RuntimeError("model runner failed - see log")


def main():
    last_log = 0.0
    while True:
        jobs = [
            j
            for j in load_jobs()
            if j.get("status") == "queued"
            and not (Path(j.get("outputDir", "")) / "cancel.flag").exists()
        ]
        now = time.time()
        if now - last_log >= 5:
            print(f"[worker] heartbeat: queued={len(jobs)}")
            last_log = now
        if jobs:
            job = sorted(jobs, key=lambda j: j.get("createdAt", ""))[0]
            print(f"[worker] start job={job.get('id')} project={job.get('project')}")
            job["status"] = "running"
            job["progress"] = 0
            job["lastHeartbeat"] = datetime.now(timezone.utc).isoformat()
            job["lastProgressAt"] = datetime.now(timezone.utc).isoformat()
            job["logPath"] = str(Path(job["outputDir"]) / "worker.log")
            save_job(job)
            try:
                run_model(job)
                job["status"] = "done"
                job["progress"] = 100
                print(f"[worker] done job={job.get('id')}")
            except Exception as e:
                job["status"] = "failed"
                job["error"] = str(e)
                print(f"[worker] failed job={job.get('id')} error={e}")
            save_job(job)
        time.sleep(2)


if __name__ == "__main__":
    print('ing')
    main()
