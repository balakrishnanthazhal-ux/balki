from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import hashlib

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "assetinspect",
    "user": "postgres",
    "password": "postgres"
}

def get_db():
    return psycopg2.connect(**DB_CONFIG)

def serialize(record):
    result = dict(record)
    for key, val in result.items():
        if hasattr(val, 'isoformat'):
            result[key] = val.isoformat()
    return result

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'Inspector',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.inspections (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            inspection_date DATE NOT NULL,
            inspection_time TIME WITHOUT TIME ZONE NOT NULL,
            project_name VARCHAR(255) NOT NULL,
            person_name VARCHAR(255) NOT NULL,
            asset_name VARCHAR(255) NOT NULL,
            remark TEXT,
            progress INTEGER DEFAULT 0,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            photo_base64 TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS user_id INTEGER")
    conn.commit()
    cur.close()
    conn.close()

@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM public.users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"error": "Username already exists"}), 409
        cur.execute("INSERT INTO public.users (username, password_hash) VALUES (%s, %s) RETURNING id, username, role",
                    (username, hash_password(password)))
        user = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return jsonify({"message": "Account created successfully!", "user": {"id": user["id"], "username": user["username"], "role": user["role"]}}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, username, role FROM public.users WHERE username = %s AND password_hash = %s",
                    (username, hash_password(password)))
        user = cur.fetchone()
        cur.close(); conn.close()
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401
        return jsonify({"message": "Login successful!", "user": {"id": user["id"], "username": user["username"], "role": user["role"]}}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/inspections", methods=["POST"])
def create_inspection():
    try:
        data = request.get_json()
        required = ["inspection_date", "inspection_time", "project_name", "person_name", "asset_name"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        progress = data.get("progress") or data.get("progress_percent") or 0
        photo = data.get("photo_base64")
        if not photo and data.get("place"):
            photo = data["place"].get("photo")
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO public.inspections
                (user_id, inspection_date, inspection_time, project_name, person_name,
                 asset_name, remark, progress, latitude, longitude, photo_base64)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (user_id, data["inspection_date"], data["inspection_time"], data["project_name"],
              data["person_name"], data["asset_name"], data.get("remark", ""),
              progress, data.get("latitude"), data.get("longitude"), photo))
        new_record = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return jsonify({"message": "Inspection saved successfully!", "data": serialize(new_record)}), 201
    except psycopg2.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inspections", methods=["GET"])
def get_inspections():
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, inspection_date::text, inspection_time::text,
                   project_name, person_name, asset_name,
                   remark, progress, latitude, longitude,
                   photo_base64, created_at::text
            FROM public.inspections
            WHERE user_id = %s
            ORDER BY id DESC
        """, (user_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return jsonify({"inspections": [dict(r) for r in rows]}), 200
    except psycopg2.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route("/api/inspections/<int:inspection_id>", methods=["PUT"])
def update_inspection(inspection_id):
    try:
        data = request.get_json()
        progress = data.get("progress") or data.get("progress_percent") or 0
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            UPDATE public.inspections SET
                project_name = %s, person_name = %s, asset_name = %s,
                remark = %s, progress = %s
            WHERE id = %s RETURNING *
        """, (data.get("project_name"), data.get("person_name"), data.get("asset_name"),
              data.get("remark", ""), progress, inspection_id))
        updated = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        if not updated:
            return jsonify({"error": "Not found"}), 404
        return jsonify({"message": "Updated successfully!", "data": serialize(updated)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inspections/<int:inspection_id>", methods=["DELETE"])
def delete_inspection(inspection_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM public.inspections WHERE id = %s", (inspection_id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    try:
        init_db()
        print("✅ Database table ready")
    except Exception as e:
        print(f"⚠️  DB init warning: {e}")
    app.run(debug=True, host="0.0.0.0", port=5000)