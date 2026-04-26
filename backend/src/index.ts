import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const onlineUsers = new Map<string, Set<string>>();

io.on('connection', (socket) => {
    socket.on('join', async (username: string) => {
        if (!username) return;
        if (!onlineUsers.has(username)) onlineUsers.set(username, new Set());
        onlineUsers.get(username)?.add(socket.id);

        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (user) {
                // Извлекаем сообщения, которые накопились пока юзер был оффлайн
                const pending = await prisma.message.findMany({
                    where: { receiverId: user.id },
                    include: { sender: true },
                    orderBy: { createdAt: 'asc' }
                });

                if (pending.length > 0) {
                    const formatted = pending.map(m => ({
                        sender: m.sender.username,
                        content: m.content,
                        avatar: m.sender.avatar,
                        nickname: m.sender.nickname,
                        createdAt: m.createdAt
                    }));
                    socket.emit('offline_messages', formatted);

                    // БЕЗОПАСНОЕ УДАЛЕНИЕ: Сообщения доставлены, стираем их из БД
                    await prisma.message.deleteMany({ where: { receiverId: user.id } });
                }
            }
        } catch (err) { console.error("Join error:", err); }
    });

    socket.on('send_message', async (data: { sender: string, receiver: string, content: string }) => {
        const { sender, receiver, content } = data;
        const sUser = await prisma.user.findUnique({ where: { username: sender } });
        const rUser = await prisma.user.findUnique({ where: { username: receiver } });

        if (sUser && rUser) {
            const recipientSockets = onlineUsers.get(receiver);

            // Если получатель в сети — доставляем мгновенно через сокет
            if (recipientSockets && recipientSockets.size > 0) {
                recipientSockets.forEach(id => {
                    io.to(id).emit('new_message', {
                        sender,
                        content,
                        avatar: sUser.avatar,
                        nickname: sUser.nickname,
                        createdAt: new Date()
                    });
                });
            } else {
                // Если оффлайн — сохраняем зашифрованный пакет в БД до востребования
                await prisma.message.create({
                    data: { content, senderId: sUser.id, receiverId: rUser.id }
                });
            }
        }
    });

    socket.on('disconnect', () => {
        onlineUsers.forEach((sockets, user) => {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) onlineUsers.delete(user);
            }
        });
    });
});

// API для получения ключей
app.get('/api/users/key/:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: { publicKey: true }
        });
        res.json({ publicKey: user?.publicKey });
    } catch { res.status(500).json({ error: "KEY_FETCH_ERROR" }); }
});

// Поиск (для начала нового диалога)
app.get('/api/users/search', async (req, res) => {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: String(req.query.query) } },
                { nickname: { contains: String(req.query.query) } }
            ],
            NOT: { username: String(req.query.me) } // Не искать самого себя
        },
        take: 10,
        select: { username: true, nickname: true, avatar: true, bio: true }
    });
    res.json(users);
});

// Обновление профиля
app.patch('/api/users/update', async (req, res) => {
    const { username, avatar, publicKey, nickname, bio } = req.body;
    try {
        const updated = await prisma.user.update({
            where: { username },
            data: { avatar, publicKey, nickname, bio }
        });
        res.json(updated);
    } catch { res.status(500).json({ error: "UPDATE_ERROR" }); }
});

// Auth
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await prisma.user.create({
            data: { username, passwordHash: hashedPassword, gender: "none", age: 0, location: "none" }
        });
        res.status(201).json(newUser);
    } catch { res.status(400).json({ error: "USER_EXISTS" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { username: req.body.username } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    res.json({ username: user.username, nickname: user.nickname, bio: user.bio, photo: user.avatar });
});

const PORT = 3001;
httpServer.listen(PORT, () => console.log(`🚀 HUSH_SERVER_RUNNING: ${PORT}`));