const express = require("express");
const { program } = require("commander");
const fs = require("fs");
const multer = require("multer");

// Налаштування для зберігання файлів у пам'яті
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Обробка командних рядків
program
  .requiredOption("-h, --host <host>")
  .requiredOption("-p, --port <port>")
  .requiredOption("-c, --cache <cache>")
  .parse(process.argv);

// Вивести аргументи командного рядка для відлагодження
console.log("Arguments received:", process.argv);

const options = program.opts();

// Перевірка наявності обов'язкових параметрів
if (!options.host || !options.port || !options.cache) {
  console.error("Error: all parameters (--host, --port, --cache) must be provided.");
  process.exit(1);
}

let notes = {};

// Завантаження кешу, якщо він існує
if (fs.existsSync(options.cache)) {
  try {
    const data = fs.readFileSync(options.cache, "utf8");
    const cacheNotes = JSON.parse(data);

    notes = cacheNotes.reduce((acc, { name, text }) => {
      acc[name] = { name, text };
      return acc;
    }, {});

    console.log(`Cache file loaded from ${options.cache}`);
  } catch (error) {
    console.error("Error reading cache file:", error);
    process.exit(1);
  }
} else {
  fs.writeFileSync(options.cache, JSON.stringify([]));
  console.log(`Cache file created at ${options.cache}`);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Функція для збереження кешу
const saveCache = () => {
  fs.writeFileSync(options.cache, JSON.stringify(Object.values(notes), null, 2));
  console.log(`Cache saved to ${options.cache}`);
};

// GET /notes/:name - Отримати нотатку за її ім'ям
app.get("/notes/:name", (req, res) => {
  const noteName = req.params.name;
  
  if (notes[noteName]) {
    res.status(200).send(notes[noteName].text);
  } else {
    res.status(404).send("Note not found");
  }
});

// GET /notes - Отримати список всіх нотаток
app.get("/notes", (req, res) => {
  const noteList = Object.keys(notes).map((name) => ({
    name: name,
    text: notes[name].text,
  }));

  res.status(200).json(noteList);
});

// PUT /notes/:name - Оновити нотатку
app.put("/notes/:name", (req, res) => {
  const noteName = req.params.name;
  const newText = req.body.text;

  if (notes[noteName]) {
    notes[noteName].text = newText;
    saveCache();
    res.status(200).send("Note updated");
  } else {
    res.status(404).send("Note not found");
  }
});

// DELETE /notes/:name - Видалити нотатку
app.delete("/notes/:name", (req, res) => {
  const noteName = req.params.name;

  if (notes[noteName]) {
    delete notes[noteName];
    saveCache();
    res.status(200).send("Note deleted");
  } else {
    res.status(404).send("Note not found");
  }
});

// POST /write - Створити нову нотатку
app.post("/write", upload.none(), (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;

  if (notes[noteName]) {
    return res.status(400).send("Note with this name already exists");
  }

  notes[noteName] = {
    name: noteName,
    text: noteText,
  };

  saveCache();
  res.status(201).send("Note created");
});

// GET /UploadForm.html - Відповідь на запит до форми
app.get("/UploadForm.html", (req, res) => {
  res.status(200).send("Please use the POST /write endpoint to create a note.");
});

// Запуск сервера
app.listen(options.port, options.host, () => {
  console.log(`Server started on ${options.host}:${options.port}`);
});
