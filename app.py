from flask import Flask, render_template, request, redirect, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

import os
from flask import Flask, render_template, request, redirect, session

app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY")

if not app.secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set")

from datetime import datetime, timedelta

@app.template_filter("ist_time")
def ist_time(value):
    dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    dt = dt + timedelta(hours=5, minutes=30)
    return dt.strftime("%Y-%m-%d %I:%M %p")


# ---------------- DATABASE ----------------

def get_db():
    connection = sqlite3.connect("database.db")
    connection.row_factory = sqlite3.Row
    return connection


def create_tables():

    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            sensor TEXT NOT NULL,
            event TEXT NOT NULL,
            level TEXT NOT NULL,
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    db.commit()
    db.close()


# ---------------- LOGIN ----------------

@app.route("/")
def login():

    if "username" in session:
        return redirect("/dashboard")

    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_user():

    username = request.form["username"]
    password = request.form["password"]

    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    db.close()

    if user and check_password_hash(user["password"], password):

        session["username"] = username

        return redirect("/dashboard")

    return "Invalid username or password"


# ---------------- REGISTER ----------------

@app.route("/register")
def register():

    return render_template("register.html")


@app.route("/register", methods=["POST"])
def register_user():

    username = request.form["username"]
    email = request.form["email"]
    password = request.form["password"]

    hashed_password = generate_password_hash(password)

    db = get_db()

    try:

        db.execute(
            """
            INSERT INTO users
            (username, email, password)
            VALUES (?, ?, ?)
            """,
            (username, email, hashed_password)
        )

        db.commit()

    except sqlite3.IntegrityError:

        db.close()

        return "Username or email already exists"

    db.close()

    return redirect("/")


# ---------------- DASHBOARD ----------------

@app.route("/dashboard")
def dashboard():

    if "username" not in session:
        return redirect("/")

    db = get_db()

    events = db.execute(
        """
        SELECT * FROM events
        WHERE username = ?
        ORDER BY time DESC
        LIMIT 5
        """,
        (session["username"],)
    ).fetchall()

    alert_count = db.execute(
        """
        SELECT COUNT(*) FROM events
        WHERE username = ?
        AND level = 'HIGH'
        """,
        (session["username"],)
    ).fetchone()[0]

    db.close()

    return render_template(
        "dashboard.html",
        username=session["username"],
        events=events,
        alert_count=alert_count
    )


# ---------------- SAVE EVENT ----------------

@app.route("/event", methods=["POST"])
def save_event():

    if "username" not in session:
        return {"error": "Not logged in"}, 401

    data = request.json

    sensor = data["sensor"]
    event = data["event"]
    level = data["level"]

    db = get_db()

    db.execute(
        """
        INSERT INTO events
        (username, sensor, event, level)
        VALUES (?, ?, ?, ?)
        """,
        (
            session["username"],
            sensor,
            event,
            level
        )
    )

    db.commit()
    db.close()

    return {"success": True}


# ---------------- HISTORY ----------------

@app.route("/history")
def history():

    if "username" not in session:
        return redirect("/")

    db = get_db()

    events = db.execute(
        """
        SELECT * FROM events
        WHERE username = ?
        ORDER BY time DESC
        """,
        (session["username"],)
    ).fetchall()
    alert_count = db.execute(
    """
    SELECT COUNT(*) FROM events
    WHERE username = ?
    AND level = 'HIGH'
    """,
    (session["username"],)
).fetchone()[0]

    db.close()

    return render_template(
    "dashboard.html",
    username=session["username"],
    events=events,
    alert_count=alert_count
)


# ---------------- LOGOUT ----------------

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/")


# ---------------- START ----------------

create_tables()

if __name__ == "__main__":
    app.run(debug=True)