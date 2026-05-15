# AssetInspect - Flask + PostgreSQL Setup Guide

## 📁 Project Structure
```
assetinspect/
├── app.py              ← Flask backend API
├── requirements.txt    ← Python dependencies
└── templates/
    └── index.html      ← Frontend UI
```

## 🗄️ Step 1: PostgreSQL Setup

Your DB already has the `inspections` table. Just verify the columns exist:

```sql
-- Run in pgAdmin (assinspect_db):
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS photo_base64 TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
```

## ⚙️ Step 2: Configure DB Password

Edit `app.py` line 13:
```python
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "assinspect_db",   # ← Your DB name
    "user": "postgres",
    "password": "YOUR_ACTUAL_PASSWORD"  # ← Change this!
}
```

## 🐍 Step 3: Install & Run Flask

```bash
# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

Flask will start at: http://localhost:5000

## 🌐 Step 4: Open the App

Open browser → http://localhost:5000

## 🔌 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET    | /api/inspections | Get all inspections |
| POST   | /api/inspections | Save new inspection |
| GET    | /api/inspections/<id> | Get single inspection |
| DELETE | /api/inspections/<id> | Delete inspection |

## 📝 POST Payload Example

```json
{
  "inspection_date": "2026-05-14",
  "inspection_time": "11:41:00",
  "project_name": "Bridge A",
  "person_name": "Admin User",
  "asset_name": "Pillar-01",
  "remark": "Minor crack observed",
  "progress": 50,
  "latitude": 10.8505,
  "longitude": 76.2711
}
```

## 🚨 Troubleshooting

- **CORS error**: Flask-CORS is already included
- **DB connect fail**: Check password in DB_CONFIG
- **GPS not working**: Must use HTTPS or localhost
- **Photo not saving**: photo_base64 column needed (see Step 1)
"# bala-" 
