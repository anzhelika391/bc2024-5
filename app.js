const { Command } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Ініціалізуємо Commander.js
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Address of the server')
  .requiredOption('-p, --port <port>', 'Port of the server')
  .requiredOption('-c, --cache <cacheDir>', 'Path to the cache directory');

program.parse(process.argv);

const options = program.opts();

// Перевіряємо, чи існує директорія кешу
if (!fs.existsSync(options.cache)) {
  console.error(`Error: Cache directory "${options.cache}" does not exist.`);
  process.exit(1);
}

// Ініціалізуємо Express.js
const app = express();

// Веб-сервер на базі Express.js
app.get('/', (req, res) => {
  res.send('Hello! This is your server.');
});

// Запускаємо сервер
app.listen(options.port, options.host, () => {
  console.log(`Server is running at http://${options.host}:${options.port}`);
});
