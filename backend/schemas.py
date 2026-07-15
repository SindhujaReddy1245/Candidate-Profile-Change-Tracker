from pydantic import BaseModel
from typing import List, Optional

class ResumeBase(BaseModel):
    candidate_id: int
    version: int
    file_path: str
    extracted_data: dict

class ResumeCreate(ResumeBase):
    pass

class ResumeOut(ResumeBase):
    id: int
    class Config:
        orm_mode = True

class ChangeOut(BaseModel):
    id: int
    change_type: str
    old_value: str
    new_value: str
    classification: str
    class Config:
        orm_mode = True
