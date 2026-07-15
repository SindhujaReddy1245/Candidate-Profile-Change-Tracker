from fastapi import FastAPI, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil, os
import database
import models
import utils


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
models.Base.metadata.create_all(bind=database.engine)

def ensure_database_columns():
    if not database.DATABASE_URL.startswith("postgresql"):
        return

    ddl_statements = [
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_url TEXT",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(40) DEFAULT 'local'",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL",
    ]
    with database.engine.begin() as connection:
        for statement in ddl_statements:
            connection.exec_driver_sql(statement)


def ensure_database_sequences():
    if not database.DATABASE_URL.startswith("postgresql"):
        return

    tables = ["users", "candidates", "resumes", "changes", "login_audit"]
    with database.engine.begin() as connection:
        for table in tables:
            connection.exec_driver_sql(
                """
                SELECT setval(
                    pg_get_serial_sequence(%(table_name)s, 'id'),
                    COALESCE((SELECT MAX(id) FROM public.""" + table + """), 0) + 1,
                    false
                )
                """,
                {"table_name": f"public.{table}"},
            )

ensure_database_columns()
ensure_database_sequences()

def ensure_demo_data():
    db: Session = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "demo").first()
        if not user:
            db.add(models.User(username="demo", password_hash=utils.hash_password("demo"), full_name="Demo Recruiter"))
            db.commit()
        candidate = db.query(models.Candidate).filter(models.Candidate.id == 1).first()
        if not candidate:
            db.add(models.Candidate(id=1, full_name="Demo Candidate", email="candidate@example.com", phone="+1 555 0100"))
            db.commit()
    finally:
        db.close()

ensure_demo_data()

@app.get("/")
def health_check():
    return {"message": "Candidate Profile Change Tracker API is running"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    db: Session = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user or not utils.verify_password(password, user.password_hash):
            db.add(models.LoginAudit(user_id=user.id if user else None, username=username, success=False))
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid username or password")
        db.add(models.LoginAudit(user_id=user.id, username=username, success=True))
        db.commit()
        return {"message": "Login successful", "user": {"id": user.id, "username": user.username, "role": user.role}}
    finally:
        db.close()

@app.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(""),
):
    username = username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    db: Session = database.SessionLocal()
    try:
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            raise HTTPException(status_code=409, detail="Username already exists. Please login instead.")

        user = models.User(
            username=username,
            password_hash=utils.hash_password(password),
            full_name=full_name.strip() or username,
            role="recruiter",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "Account created successfully",
            "user": {"id": user.id, "username": user.username, "role": user.role, "full_name": user.full_name},
        }
    finally:
        db.close()

@app.post("/upload_resume")
def upload_resume(
    candidate_id: int = Form(...),
    version: int = Form(...),
    uploaded_by: int = Form(...),
    file: UploadFile = None,
):
    if file is None:
        raise HTTPException(status_code=400, detail="Resume file is required")

    db: Session = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == uploaded_by).first()
        if not user:
            raise HTTPException(status_code=404, detail="Upload user not found")

        candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
        if not candidate:
            candidate = models.Candidate(id=candidate_id, full_name=f"Candidate {candidate_id}")
            db.add(candidate)
            db.commit()

        previous_resume = (
            db.query(models.Resume)
            .filter(models.Resume.candidate_id == candidate_id)
            .filter(models.Resume.uploaded_by == uploaded_by)
            .order_by(models.Resume.version.desc(), models.Resume.id.desc())
            .first()
        )
        safe_filename = os.path.basename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        extracted = utils.extract_resume_data(file_path)
        changes = utils.compare_resumes(previous_resume.extracted_data or {}, extracted) if previous_resume else []
        next_version = (previous_resume.version + 1) if previous_resume else version
        resume = models.Resume(
            candidate_id=candidate_id,
            version=next_version,
            file_path=file_path,
            file_url=file_path,
            storage_provider="local",
            extracted_data=extracted,
            uploaded_by=uploaded_by,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        for change in changes:
            db.add(models.Change(
                resume_id=resume.id,
                change_type=change["change_type"],
                old_value=change["old_value"],
                new_value=change["new_value"],
                classification=change["classification"],
            ))
        db.commit()

        return {
            "message": "Resume uploaded",
            "resume": extracted,
            "changes": changes,
            "id": resume.id,
            "version": resume.version,
            "compared_with_id": previous_resume.id if previous_resume else None,
            "has_previous": previous_resume is not None,
        }
    finally:
        db.close()

@app.get("/resumes/{candidate_id}")
def get_resumes(candidate_id: int):
    db: Session = database.SessionLocal()
    try:
        resumes = db.query(models.Resume).filter(models.Resume.candidate_id == candidate_id).all()
        return resumes
    finally:
        db.close()

@app.get("/users/{user_id}/resumes")
def get_user_resumes(user_id: int):
    db: Session = database.SessionLocal()
    try:
        resumes = (
            db.query(models.Resume)
            .filter(models.Resume.uploaded_by == user_id)
            .order_by(models.Resume.uploaded_at.desc(), models.Resume.id.desc())
            .all()
        )
        return [
            {
                "id": resume.id,
                "candidate_id": resume.candidate_id,
                "version": resume.version,
                "file_path": resume.file_path,
                "file_url": resume.file_url,
                "storage_provider": resume.storage_provider,
                "extracted_data": resume.extracted_data,
                "uploaded_at": resume.uploaded_at,
                "uploaded_by": resume.uploaded_by,
            }
            for resume in resumes
        ]
    finally:
        db.close()

@app.get("/users/{user_id}/dashboard")
def get_user_dashboard(user_id: int):
    db: Session = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        resumes = (
            db.query(models.Resume)
            .filter(models.Resume.uploaded_by == user_id)
            .order_by(models.Resume.uploaded_at.desc(), models.Resume.id.desc())
            .all()
        )
        latest_resume = resumes[0] if resumes else None
        latest_changes = []
        if latest_resume:
            latest_changes = (
                db.query(models.Change)
                .filter(models.Change.resume_id == latest_resume.id)
                .order_by(models.Change.id.asc())
                .all()
            )

        return {
            "user": {"id": user.id, "username": user.username, "role": user.role, "full_name": user.full_name},
            "total_resumes": len(resumes),
            "latest_result": {
                "id": latest_resume.id,
                "fileName": os.path.basename(latest_resume.file_path),
                "version": latest_resume.version,
                "resume": latest_resume.extracted_data or {},
                "changes": [
                    {
                        "id": change.id,
                        "change_type": change.change_type,
                        "old_value": change.old_value,
                        "new_value": change.new_value,
                        "classification": change.classification,
                    }
                    for change in latest_changes
                ],
                "has_previous": latest_resume.version > 1,
            } if latest_resume else None,
        }
    finally:
        db.close()

@app.delete("/resumes/{resume_id}")
def delete_resume(resume_id: int):
    db: Session = database.SessionLocal()
    try:
        resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
        if resume:
            db.delete(resume)
            db.commit()
            return {"message": "Resume deleted"}
        raise HTTPException(status_code=404, detail="Resume not found")
    finally:
        db.close()
