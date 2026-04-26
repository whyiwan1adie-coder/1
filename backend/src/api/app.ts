import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
// Вот эта строка ниже может подчеркиваться, если путь неверный
import db from '../../db/sql/db-initialized';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Сервер ShadowTalk запущен и работает!');
});

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});