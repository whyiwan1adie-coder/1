import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./db/database.sqlite', (err) => {
    if (err) console.error('Ошибка подключения к БД:', err.message);
    else console.log('Подключено к базе данных SQLite.');
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            avatar TEXT
        )
    `, (err) => {
        if (err) console.error('Ошибка создания таблицы:', err.message);
        else console.log('Таблица пользователей готова.');
    });
});

export default db;