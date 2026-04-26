import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Настройка Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Хранилище онлайн-пользователей
const onlineUsers = new Map<string, string>();

// --- ЛОГИКА СОКЕТОВ (ЧАТ) ---
io.on('connection', (socket) => {
    socket.on('join', async (username: string) => {
        if (!username) return;
        onlineUsers.set(username, socket.id);
        console.log(`[Socket] ${username} в сети`);

        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (user) {
                // Получаем оффлайн сообщения через приведение к any, чтобы избежать конфликтов типов
                const pending = await (prisma as any).message.findMany({
                    where: { receiverId: user.id },
                    orderBy: { createdAt: 'asc' }
                });

                if (pending.length > 0) {
                    socket.emit('offline_messages', pending);
                    await (prisma as any).message.deleteMany({ where: { receiverId: user.id } });
                    console.log(`[Socket] Доставлено ${pending.length} сообщений для ${username}`);
                }
            }
        } catch (err) {
            console.error("Ошибка сокетов:", err);
        }
    });

    socket.on('send_message', async (data: { sender: string, receiver: string, content: string }) => {
        const { sender, receiver, content } = data;
        const targetId = onlineUsers.get(receiver);

        if (targetId) {
            io.to(targetId).emit('new_message', { sender, content, createdAt: new Date() });
        } else {
            try {
                const sUser = await prisma.user.findUnique({ where: { username: sender } });
                const rUser = await prisma.user.findUnique({ where: { username: receiver } });

                if (sUser && rUser) {
                    await (prisma as any).message.create({
                        data: { content, senderId: sUser.id, receiverId: rUser.id }
                    });
                }
            } catch (err) {
                console.error("Ошибка сохранения сообщения:", err);
            }
        }
    });

    socket.on('disconnect', () => {
        for (let [user, id] of onlineUsers.entries()) {
            if (id === socket.id) {
                onlineUsers.delete(user);
                break;
            }
        }
    });
});

// --- РЕГИСТРАЦИЯ (ИСПРАВЛЕННАЯ) ---
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log("Получены данные:", req.body);

        // Извлекаем данные и принудительно задаем дефолты, если чего-то нет
        const username = req.body.username;
        const password = req.body.password;
        const gender = req.body.gender || "не указан";
        const age = Number(req.body.age) || 0;
        const location = req.body.location || "не указано"; // КРИТИЧЕСКИЙ МОМЕНТ ТУТ
        const publicKey = req.body.publicKey || "";

        if (!username || !password) {
            return res.status(400).json({ error: 'Нужны логин и пароль' });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: 'Ник занят' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем объект данных СТРОГО со всеми полями
        const newUser = await prisma.user.create({
            data: {
                username: String(username),
                passwordHash: hashedPassword,
                publicKey: String(publicKey),
                gender: String(gender),
                age: age,
                location: String(location), // Теперь здесь ВСЕГДА будет строка
                bio: ""
            }
        });

        console.log(`[Auth] Зарегистрирован: ${newUser.username}`);
        res.status(201).json({ message: 'Успех!', username: newUser.username });

    } catch (error) {
        console.error("ОШИБКА ПРИЗМЫ ПОДРОБНО:", error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
// Добавь это в index.ts
app.get('/', (req, res) => {
    res.send('Бэкенд Hush работает! Сокеты и API готовы.');
});