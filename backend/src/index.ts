import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Хранилище: имя_пользователя -> Set из socket.id (для нескольких вкладок)
const onlineUsers = new Map<string, Set<string>>();

io.on('connection', (socket) => {
    socket.on('join', async (username: string) => {
        if (!username) return;

        // Добавляем текущий сокет в список сокетов пользователя
        if (!onlineUsers.has(username)) {
            onlineUsers.set(username, new Set());
        }
        onlineUsers.get(username)?.add(socket.id);

        console.log(`[Socket] ${username} подключился (всего вкладок: ${onlineUsers.get(username)?.size})`);

        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (user) {
                // Загружаем сообщения и подтягиваем данные об отправителе
                const pending = await (prisma as any).message.findMany({
                    where: { receiverId: user.id },
                    include: { sender: true }, // Ключевое исправление
                    orderBy: { createdAt: 'asc' }
                });

                if (pending.length > 0) {
                    // Форматируем для фронтенда
                    const formatted = pending.map((m: any) => ({
                        sender: m.sender.username,
                        content: m.content,
                        createdAt: m.createdAt
                    }));

                    socket.emit('offline_messages', formatted);

                    // Удаляем доставленные сообщения
                    await (prisma as any).message.deleteMany({ where: { receiverId: user.id } });
                    console.log(`[Socket] Доставлено ${pending.length} оффлайн-сообщений для ${username}`);
                }
            }
        } catch (err) {
            console.error("Ошибка при входе в сокет:", err);
        }
    });

    socket.on('send_message', async (data: { sender: string, receiver: string, content: string }) => {
        const { sender, receiver, content } = data;
        const recipientSockets = onlineUsers.get(receiver);

        if (recipientSockets && recipientSockets.size > 0) {
            // Если пользователь в сети, отправляем во ВСЕ его вкладки
            recipientSockets.forEach(socketId => {
                io.to(socketId).emit('new_message', {
                    sender,
                    content,
                    createdAt: new Date()
                });
            });
            console.log(`[Socket] Сообщение от ${sender} для ${receiver} отправлено онлайн`);
        } else {
            // Оффлайн сохранение
            try {
                const sUser = await prisma.user.findUnique({ where: { username: sender } });
                const rUser = await prisma.user.findUnique({ where: { username: receiver } });

                if (sUser && rUser) {
                    await (prisma as any).message.create({
                        data: {
                            content,
                            senderId: sUser.id,
                            receiverId: rUser.id
                        }
                    });
                    console.log(`[Socket] Пользователь ${receiver} оффлайн. Сообщение сохранено в БД.`);
                }
            } catch (err) {
                console.error("Ошибка сохранения оффлайн-сообщения:", err);
            }
        }
    });

    socket.on('disconnect', () => {
        // Находим и удаляем именно этот socket.id из списка вкладок пользователя
        for (let [username, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                console.log(`[Socket] Одна вкладка пользователя ${username} закрыта`);

                // Если вкладок больше нет, удаляем пользователя из Map
                if (sockets.size === 0) {
                    onlineUsers.delete(username);
                    console.log(`[Socket] ${username} полностью покинул сеть`);
                }
                break;
            }
        }
    });
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, gender, age, location, publicKey } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Нужны логин и пароль' });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: 'Ник занят' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                publicKey: publicKey || "",
                gender: gender || "не указан",
                age: Number(age) || 0,
                location: location || "не указано",
                bio: ""
            }
        });

        res.status(201).json({ message: 'Успех!', username: newUser.username });
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/', (req, res) => {
    res.send('Бэкенд Hush работает!');
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});