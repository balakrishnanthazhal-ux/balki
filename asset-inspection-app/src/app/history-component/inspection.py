from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Inspection
from schemas import InspectionCreate, InspectionResponse
from typing import List

router = APIRouter()

# POST — Form save
@router.post("/", response_model=InspectionResponse)
def create_inspection(data: InspectionCreate, db: Session = Depends(get_db)):
    inspection = Inspection(**data.dict())
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection

# GET — All inspections
@router.get("/", response_model=List[InspectionResponse])
def get_inspections(db: Session = Depends(get_db)):
    return db.query(Inspection).order_by(Inspection.created_at.desc()).all()

# GET — Single inspection
@router.get("/{id}", response_model=InspectionResponse)
def get_inspection(id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection

# PUT — Edit inspection
@router.put("/{id}", response_model=InspectionResponse)
def update_inspection(id: int, data: InspectionCreate, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    for key, value in data.dict().items():
        setattr(inspection, key, value)
    db.commit()
    db.refresh(inspection)
    return inspection

# DELETE — Delete inspection
@router.delete("/{id}")
def delete_inspection(id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    db.delete(inspection)
    db.commit()
    return {"success": True, "message": "Deleted successfully"}
