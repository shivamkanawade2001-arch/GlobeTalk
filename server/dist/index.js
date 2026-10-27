"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const handlers_1 = require("./socket/handlers");
const store_1 = require("./store");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        activeRooms: store_1.rooms.size,
        totalUsers: store_1.users.size,
    });
});
// ── WebRTC STUN/TURN ──────────────────────────────────────────────────────────
app.get('/api/ice-servers', (_req, res) => {
    res.json({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    });
});
// ── Rooms REST API ────────────────────────────────────────────────────────────
app.get('/api/rooms', (_req, res) => {
    const allRooms = Array.from(store_1.rooms.values()).filter((r) => r.isActive);
    res.json(allRooms);
});
app.get('/api/rooms/:id', (req, res) => {
    const room = store_1.rooms.get(req.params.id);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
});
app.post('/api/rooms', (req, res) => {
    const { title, hostId, hostName, hostAvatar, languages, level, maxParticipants, isPublic, allowListeners, tags, } = req.body;
    if (!title || !hostId) {
        return res.status(400).json({ error: 'Title and hostId are required' });
    }
    const newRoom = {
        id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        hostId,
        hostName: hostName || 'Host',
        hostAvatar: hostAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostId}`,
        languages: Array.isArray(languages) && languages.length > 0 ? languages : ['English'],
        level: level || 'Any',
        maxParticipants: Math.min(Math.max(Number(maxParticipants) || 6, 2), 12),
        isPublic: isPublic !== false,
        allowListeners: allowListeners !== false,
        tags: Array.isArray(tags) ? tags : [],
        createdAt: Date.now(),
        isActive: true,
        participants: [],
        listeners: [],
    };
    store_1.rooms.set(newRoom.id, newRoom);
    store_1.roomMessages.set(newRoom.id, []);
    // Broadcast new room to lobby
    io.emit('lobby:room-created', { room: newRoom });
    res.status(201).json(newRoom);
});
// ── Users REST API ────────────────────────────────────────────────────────────
app.get('/api/users', (_req, res) => {
    res.json(Array.from(store_1.users.values()));
});
app.get('/api/users/:uid', (req, res) => {
    const user = store_1.users.get(req.params.uid);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});
app.post('/api/users', (req, res) => {
    const { uid, displayName, photoURL, email, nativeLanguages, learningLanguages, bio, country, isVerified } = req.body;
    if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
    }
    let user = store_1.users.get(uid);
    if (user) {
        user.displayName = displayName || user.displayName;
        user.photoURL = photoURL || user.photoURL;
        user.bio = bio !== undefined ? bio : user.bio;
        user.nativeLanguages = nativeLanguages || user.nativeLanguages;
        user.learningLanguages = learningLanguages || user.learningLanguages;
        user.country = country !== undefined ? country : user.country;
    }
    else {
        user = {
            uid,
            displayName: displayName || 'Learner',
            photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
            email: email || `${uid}@globetalk.io`,
            isVerified: !!isVerified,
            vouchCount: 0,
            vouchedBy: [],
            nativeLanguages: nativeLanguages || ['English'],
            learningLanguages: learningLanguages || ['Spanish'],
            followers: [],
            following: [],
            createdAt: Date.now(),
            bio: bio || 'Excited to practice languages on GlobeTalk! 🗣️',
            country: country || 'Global',
        };
        store_1.users.set(uid, user);
    }
    res.json(user);
});
// Serve client static dist bundle
const possibleDistPaths = [
    path_1.default.resolve(__dirname, '../public'),
    path_1.default.resolve(__dirname, './public'),
    path_1.default.resolve(process.cwd(), 'public'),
    path_1.default.resolve(process.cwd(), 'server/public'),
    path_1.default.resolve(__dirname, '../../client/dist'),
    path_1.default.resolve(__dirname, '../client/dist'),
    path_1.default.resolve(process.cwd(), 'client/dist'),
    path_1.default.resolve(process.cwd(), '../client/dist'),
];
const clientDistPath = possibleDistPaths.find((p) => fs_1.default.existsSync(p) && fs_1.default.existsSync(path_1.default.join(p, 'index.html'))) ||
    possibleDistPaths[0];
if (fs_1.default.existsSync(clientDistPath)) {
    app.use(express_1.default.static(clientDistPath));
}
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
    }
    const indexPath = path_1.default.join(clientDistPath, 'index.html');
    if (fs_1.default.existsSync(indexPath)) {
        try {
            let html = fs_1.default.readFileSync(indexPath, 'utf8');
            const envConfig = {
                VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDm13zGCqJP2Ntn3nJ3r4nxwOMYpVM-TIc',
                VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'globetalk-f83d4.firebaseapp.com',
                VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'globetalk-f83d4',
                VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'globetalk-f83d4.firebasestorage.app',
                VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '327271905813',
                VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:327271905813:web:f30c9d843a5d17c9d16c1c',
            };
            html = html.replace('<head>', `<head><script>window.__GLOBETALK_ENV__ = ${JSON.stringify(envConfig)};</script>`);
            return res.send(html);
        }
        catch {
            return res.sendFile(indexPath);
        }
    }
    res.json({
        status: 'ok',
        service: 'GlobeTalk Backend & Signaling Server',
        activeRooms: store_1.rooms.size,
        totalUsers: store_1.users.size,
    });
});
// Setup WebSockets
(0, handlers_1.setupSocketHandlers)(io);
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🌍 GlobeTalk signaling & API server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map