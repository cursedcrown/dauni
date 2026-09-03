const express = require("express");
const multer = require("multer");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;


// ====================
// Папка для фото
// ====================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// ====================
// Загрузка файлов
// ====================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname);

        const fileName =
            Date.now() + ext;

        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage
});


// ====================
// База данных
// ====================

const db = new Database("database.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    photo TEXT NOT NULL
)
`).run();


// ====================
// Настройки
// ====================

app.use(express.json());

app.use(express.static("public"));

app.use(
    "/uploads",
    express.static(uploadDir)
);


// ====================
// Получить всех людей
// ====================

app.get("/api/people", (req, res) => {

    const people =
        db.prepare(
            "SELECT * FROM people ORDER BY id DESC"
        ).all();

    res.json(people);
});


// ====================
// Добавить человека
// ====================

app.post(
    "/api/people",
    upload.single("photo"),

    (req, res) => {

        const name =
            req.body.name;

        const bio =
            req.body.bio;

        if (!req.file) {

            return res.status(400).json({
                error: "Нет фото"
            });

        }

        const photo =
            "/uploads/" +
            req.file.filename;

        const result =
            db.prepare(`
                INSERT INTO people
                (name, bio, photo)
                VALUES (?, ?, ?)
            `).run(
                name,
                bio,
                photo
            );

        res.json({
            id: result.lastInsertRowid
        });
    }
);


// ====================
// Удаление
// ====================

app.delete(
    "/api/people/:id",

    (req, res) => {

        const id =
            req.params.id;

        const person =
            db.prepare(
                "SELECT * FROM people WHERE id=?"
            ).get(id);

        if (!person) {

            return res.status(404).json({
                error: "Не найден"
            });
        }

        const filePath =
            path.join(
                uploadDir,
                path.basename(person.photo)
            );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        db.prepare(
            "DELETE FROM people WHERE id=?"
        ).run(id);

        res.json({
            success: true
        });
    }
);


// ====================
// Запуск
// ====================

app.listen(PORT, () => {

    console.log(
        `Сайт работает: http://localhost:${PORT}`
    );

});