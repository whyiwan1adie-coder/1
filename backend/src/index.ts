import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const onlineUsers = new Map<string, Set<string>>();

io.on('connection', (socket) => {
    socket.on('join', async (username: string) => {
        if (!username) return;
        if (!onlineUsers.has(username)) onlineUsers.set(username, new Set());
        onlineUsers.get(username)?.add(socket.id);

        try {
            const user = await prisma.user.findUnique({ where: { username } });
            if (user) {
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

// ==================== USERS API ====================

app.get('/api/users/key/:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: { publicKey: true }
        });
        res.json({ publicKey: user?.publicKey });
    } catch { res.status(500).json({ error: "KEY_FETCH_ERROR" }); }
});

app.get('/api/users/search', async (req, res) => {
    try {
        const { query, location, language, status, minAge, maxAge, me } = req.query;
        const where: any = {
            NOT: { username: String(me || '') }
        };

        if (status) {
            where.status = String(status);
        } else {
            where.status = { not: 'shadow' };
        }

        if (query) {
            const searchQuery = String(query);
            where.OR = [
                { username: { contains: searchQuery } },
                { nickname: { contains: searchQuery } }
            ];
        }

        if (location && location !== 'не_указано') where.location = String(location);
        if (language) where.languages = { contains: String(language) };
        if (minAge || maxAge) {
            where.age = {};
            if (minAge) where.age.gte = Number(minAge);
            if (maxAge) where.age.lte = Number(maxAge);
        }

        const users = await prisma.user.findMany({
            where,
            take: 20,
            select: {
                username: true,
                nickname: true,
                avatar: true,
                bio: true,
                age: true,
                location: true,
                languages: true,
                status: true,
                gender: true
            }
        });
        res.json(users);
    } catch (err) { console.error(err); res.status(500).json({ error: "SEARCH_ERROR" }); }
});

app.patch('/api/users/update', async (req, res) => {
    const { username, avatar, publicKey, nickname, bio, age, location, languages, status } = req.body;
    try {
        const data: any = {};
        if (avatar !== undefined) data.avatar = avatar;
        if (publicKey !== undefined) data.publicKey = publicKey;
        if (nickname !== undefined) data.nickname = nickname;
        if (bio !== undefined) data.bio = bio;
        if (age !== undefined) data.age = age;
        if (location !== undefined) data.location = location;
        if (languages !== undefined) data.languages = languages;
        if (status !== undefined) data.status = status;

        const updated = await prisma.user.update({ where: { username }, data });
        res.json(updated);
    } catch (err) { console.error(err); res.status(500).json({ error: "UPDATE_ERROR" }); }
});

// ==================== FRIENDS API ====================

app.post('/api/friends/request', async (req, res) => {
    const { from, to } = req.body;
    try {
        const fromUser = await prisma.user.findUnique({ where: { username: from } });
        const toUser = await prisma.user.findUnique({ where: { username: to } });
        if (!fromUser || !toUser) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { fromUserId: fromUser.id, toUserId: toUser.id },
                    { fromUserId: toUser.id, toUserId: fromUser.id }
                ]
            }
        });
        if (existing) return res.status(400).json({ error: "REQUEST_ALREADY_EXISTS" });

        const friendship = await prisma.friendship.create({
            data: { fromUserId: fromUser.id, toUserId: toUser.id }
        });
        res.status(201).json(friendship);
    } catch (err) { console.error(err); res.status(500).json({ error: "REQUEST_ERROR" }); }
});

app.post('/api/friends/accept', async (req, res) => {
    const { id } = req.body;
    try {
        const friendship = await prisma.friendship.update({
            where: { id },
            data: { status: 'accepted' }
        });
        res.json(friendship);
    } catch (err) { console.error(err); res.status(500).json({ error: "ACCEPT_ERROR" }); }
});

app.post('/api/friends/reject', async (req, res) => {
    const { id } = req.body;
    try {
        await prisma.friendship.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "REJECT_ERROR" }); }
});

app.get('/api/friends/incoming/:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const requests = await prisma.friendship.findMany({
            where: { toUserId: user.id, status: 'pending' },
            include: { fromUser: { select: { username: true, nickname: true, avatar: true } } }
        });
        res.json(requests);
    } catch (err) { console.error(err); res.status(500).json({ error: "INCOMING_ERROR" }); }
});

app.get('/api/friends/list/:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'accepted',
                OR: [{ fromUserId: user.id }, { toUserId: user.id }]
            },
            include: {
                fromUser: { select: { username: true, nickname: true, avatar: true, status: true } },
                toUser: { select: { username: true, nickname: true, avatar: true, status: true } }
            }
        });

        const seen = new Set<string>();
        const friends: { username: string; nickname: string | null; avatar: string | null; status: string | null }[] = [];

        friendships.forEach(f => {
            const friend = f.fromUserId === user.id ? f.toUser : f.fromUser;
            if (!seen.has(friend.username)) {
                seen.add(friend.username);
                friends.push(friend);
            }
        });

        res.json(friends);
    } catch (err) { console.error(err); res.status(500).json({ error: "LIST_ERROR" }); }
});

// ==================== WALL API ====================

app.get('/api/wall/:username', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const posts = await prisma.wallPost.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(posts);
    } catch (err) { console.error(err); res.status(500).json({ error: "WALL_ERROR" }); }
});

app.post('/api/wall/:username', async (req, res) => {
    const { text, image, audio } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

        const post = await prisma.wallPost.create({
            data: { text: text || '', image, audio, userId: user.id }
        });
        res.status(201).json(post);
    } catch (err) { console.error(err); res.status(500).json({ error: "CREATE_ERROR" }); }
});

app.delete('/api/wall/post/:id', async (req, res) => {
    try {
        await prisma.wallPost.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "DELETE_ERROR" }); }
});

// ==================== AUTH ====================

app.post('/api/auth/register', async (req, res) => {
    const { username, password, gender, age, location } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const accessKey = crypto.randomBytes(16).toString('hex');
    const accessKeyHash = await bcrypt.hash(accessKey, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                accessKeyHash,
                gender: gender || "не указан",
                age: age || 0,
                location: location || "не_указано"
            }
        });
        res.status(201).json({
            username: newUser.username,
            accessKey,
            message: "ACCESS_KEY_SHOWN_ONCE_SAVE_IT"
        });
    } catch (err) { console.error(err); res.status(400).json({ error: "USER_EXISTS" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { username: req.body.username } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    res.json({
        username: user.username, nickname: user.nickname, bio: user.bio,
        photo: user.avatar, status: user.status, location: user.location,
        languages: user.languages, age: user.age, gender: user.gender
    });
});

app.post('/api/auth/login-with-key', async (req, res) => {
    const { username, accessKey } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.accessKeyHash) return res.status(401).json({ error: 'ACCOUNT_NOT_FOUND' });
    const valid = await bcrypt.compare(accessKey, user.accessKeyHash);
    if (!valid) return res.status(401).json({ error: 'INVALID_ACCESS_KEY' });
    res.json({
        username: user.username, nickname: user.nickname, bio: user.bio,
        photo: user.avatar, status: user.status, location: user.location,
        languages: user.languages, age: user.age, gender: user.gender
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => console.log(`HUSH_SERVER_RUNNING: ${PORT}`));