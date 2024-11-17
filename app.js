const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware для обробки запитів JSON та form-data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Отримання шляху до кешу або використання стандартного
const CACHE_DIR = path.resolve(process.argv[5] || './cache');

// Перевірка існування кешу та створення директорії, якщо вона не існує
if (!fs.existsSync(CACHE_DIR)) {
  console.error(`Cache directory "${CACHE_DIR}" does not exist. Creating it...`);
  fs.mkdirSync(CACHE_DIR); // Створення директорії, якщо її не існує
}

// GET /notes/<ім’я нотатки>
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  const noteText = fs.readFileSync(notePath, 'utf-8');
  res.send(noteText);
});

// PUT /notes/<ім’я нотатки>
app.put('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.writeFileSync(notePath, req.body.text || '');
  res.send('Note updated');
});

// DELETE /notes/<ім’я нотатки>
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(CACHE_DIR, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

// GET /notes
app.get('/notes', (req, res) => {
  const files = fs.readdirSync(CACHE_DIR).map((file) => {
    const text = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
    return { name: file, text };
  });
  res.status(200).json(files);
});

// POST /write
app.post('/write', (req, res) => {
  const { note_name, note } = req.body;

  if (!note_name || !note) {
    return res.status(400).send('Invalid input');
  }

  const notePath = path.join(CACHE_DIR, note_name);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, note);
  res.status(201).send('Note created');
});

// GET /UploadForm.html
app.get('/UploadForm.html', (req, res) => {
  const formHTML = `
    <html>
      <body>
        <form action="/write" method="post">
          <label for="note_name">Note Name:</label>
          <input type="text" id="note_name" name="note_name"><br><br>
          <label for="note">Note Text:</label>
          <textarea id="note" name="note"></textarea><br><br>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `;
  res.status(200).send(formHTML);
});

// Запуск сервера
const HOST = process.argv[3] || '127.0.0.1';  // Якщо параметри не передано
const PORT = process.argv[4] || 3000;

app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
