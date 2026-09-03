const express = require("express");
const multer = require("multer");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
    console.warn("ВНИМАНИЕ: ADMIN_PASSWORD не задан!");
}

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        cb(
            null,
            Date.now() +
            "-" +
            crypto.randomBytes(8).toString("hex") +
            ext
        );
    }
});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const db = new Database("database.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT NOT NULL,
        photo TEXT NOT NULL
    )
`).run();

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/uploads",
    express.static(uploadDir)
);


// =========================
// ПРОВЕРКА АДМИНА
// =========================

function checkAuth(req, res, next) {
    const login = req.headers["x-admin-login"];
    const password = req.headers["x-admin-password"];

    if (
        ADMIN_PASSWORD &&
        login === ADMIN_LOGIN &&
        password === ADMIN_PASSWORD
    ) {
        next();
        return;
    }

    res.status(401).json({
        error: "Неверный логин или пароль"
    });
}


// =========================
// ВХОД АДМИНИСТРАТОРА
// =========================

app.post("/api/login", (req, res) => {
    const { login, password } = req.body;

    if (
        ADMIN_PASSWORD &&
        login === ADMIN_LOGIN &&
        password === ADMIN_PASSWORD
    ) {
        return res.json({
            success: true
        });
    }

    res.status(401).json({
        error: "Неверный логин или пароль"
    });
});


// =========================
// ПОЛУЧИТЬ СПИСОК
// =========================

app.get("/api/people", (req, res) => {
    const people = db
        .prepare(
            "SELECT * FROM people ORDER BY id DESC"
        )
        .all();

    res.json(people);
});


// =========================
// ДОБАВИТЬ
// =========================

app.post(
    "/api/people",
    checkAuth,
    upload.single("photo"),
    (req, res) => {

        const name = req.body.name;
        const bio = req.body.bio;

        if (!name || !bio) {
            return res.status(400).json({
                error: "Заполните имя и биографию"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: "Добавьте фотографию"
            });
        }

        const photo =
            "/uploads/" +
            req.file.filename;

        const result = db
            .prepare(`
                INSERT INTO people
                (name, bio, photo)
                VALUES (?, ?, ?)
            `)
            .run(
                name,
                bio,
                photo
            );

        res.json({
            success: true,
            id: result.lastInsertRowid
        });
    }
);


// =========================
// УДАЛИТЬ
// =========================

app.delete(
    "/api/people/:id",
    checkAuth,
    (req, res) => {

        const id =
            Number(req.params.id);

        const person = db
            .prepare(
                "SELECT * FROM people WHERE id = ?"
            )
            .get(id);

        if (!person) {
            return res.status(404).json({
                error: "Человек не найден"
            });
        }

        const filename =
            path.basename(person.photo);

        const photoPath =
            path.join(
                uploadDir,
                filename
            );

        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }

        db.prepare(
            "DELETE FROM people WHERE id = ?"
        ).run(id);

        res.json({
            success: true
        });
    }
);


// =========================
// ЗАПУСК
// =========================

app.listen(PORT, () => {
    console.log(
        `Сайт работает: http://localhost:${PORT}`
    );
});