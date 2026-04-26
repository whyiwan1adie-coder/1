import React, { useState, useRef, useEffect, useCallback } from 'react';

interface WallPost {
    id: string;
    text: string;
    image?: string | null;
    audio?: string | null;
    createdAt: string;
}

interface WallPageProps {
    username: string;
    myAvatar: string | null;
    myBio: string;
    myStatus: string;
    ghostCount: number;
}

const VoicePlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
        setPlaying(!playing);
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '250px', padding: '6px 10px', background: '#0a0a0a', borderRadius: '20px', marginTop: '8px' }}>
            <audio ref={audioRef} src={src} onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }} onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
            <button onClick={togglePlay} style={{ background: 'transparent', border: 'none', color: '#22d3ee', cursor: 'pointer', fontSize: '14px', padding: 0 }}>{playing ? '⏸' : '▶'}</button>
            <div style={{ flex: 1, height: '3px', background: '#1a1a1a', borderRadius: '2px' }}>
                <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', background: '#22d3ee', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#555', minWidth: '28px', textAlign: 'right' }}>{formatTime(currentTime)}</span>
        </div>
    );
};

const compressImage = (base64: string, size: number = 400): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.src = base64;
    });
};

export const WallPage: React.FC<WallPageProps> = ({ username, myAvatar, myBio, myStatus, ghostCount }) => {
    const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
    const [newPost, setNewPost] = useState('');
    const [postImage, setPostImage] = useState<string | null>(null);
    const [postAudio, setPostAudio] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const statusColor = myStatus === 'online' ? '#22d3ee' : myStatus === 'shadow' ? '#a855f7' : '#333';
    const statusLabel = myStatus === 'online' ? 'ONLINE' : myStatus === 'shadow' ? 'SHADOW' : 'OFFLINE';

    const loadPosts = useCallback(() => {
        fetch(`http://localhost:3001/api/wall/${username}`)
            .then(r => r.json())
            .then((data: WallPost[]) => setWallPosts(data))
            .catch(() => { });
    }, [username]);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    const addWallPost = async () => {
        if (!newPost.trim() && !postImage && !postAudio) return;
        try {
            const res = await fetch(`http://localhost:3001/api/wall/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newPost.trim(), image: postImage, audio: postAudio })
            });
            if (res.ok) {
                setNewPost('');
                setPostImage(null);
                setPostAudio(null);
                loadPosts();
            }
        } catch { alert('Ошибка при сохранении поста'); }
    };

    const deleteWallPost = async (id: string) => {
        try {
            await fetch(`http://localhost:3001/api/wall/post/${id}`, { method: 'DELETE' });
            loadPosts();
        } catch { alert('Ошибка при удалении'); }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const reader = new FileReader();
            reader.onload = async () => {
                const compressed = await compressImage(reader.result as string);
                setPostImage(compressed);
                setUploading(false);
            };
            reader.readAsDataURL(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('⚠️ Аудио слишком большое. Максимум 5 МБ.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => setPostAudio(reader.result as string);
            reader.readAsDataURL(file);
            if (audioInputRef.current) audioInputRef.current.value = '';
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', height: '100%', background: '#000' }}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #1a1a1a', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#111', border: '2px solid #22d3ee', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#22d3ee', overflow: 'hidden' }}>
                    {myAvatar ? <img src={myAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : username[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#22d3ee', fontWeight: '900' }}>{username}</div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColor }} />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{myBio || '...'}</div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px', justifyContent: 'center' }}>
                    <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px 16px', minWidth: '70px' }}>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{statusLabel}</div>
                        <div style={{ fontSize: '8px', color: '#555', letterSpacing: '1.5px', marginTop: '4px' }}>СТАТУС</div>
                    </div>
                    <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px 16px', minWidth: '70px' }}>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {ghostCount} <span style={{ fontSize: '16px' }}>👻</span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#555', letterSpacing: '1.5px', marginTop: '4px' }}>GHOSTS</div>
                    </div>
                    <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px 16px', minWidth: '70px' }}>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{wallPosts.length}</div>
                        <div style={{ fontSize: '8px', color: '#555', letterSpacing: '1.5px', marginTop: '4px' }}>ПОСТОВ</div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, padding: '15px 25px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                {(postImage || postAudio) && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        {postImage && (
                            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', flexShrink: 0 }}>
                                <img src={postImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                                <button onClick={() => setPostImage(null)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>
                        )}
                        {postAudio && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0a0a0a', padding: '6px 10px', borderRadius: '8px', border: '1px solid #333' }}>
                                <span style={{ fontSize: '12px' }}>🎵</span>
                                <span style={{ fontSize: '11px', color: '#888' }}>Аудио</span>
                                <button onClick={() => setPostAudio(null)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                    <input style={{ flex: 1, background: '#080808', border: '1px solid #1a1a1a', padding: '12px 16px', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="Написать на стене..." value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWallPost()} />
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                    <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioSelect} />
                    <button onClick={() => fileInputRef.current?.click()} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Фото">{uploading ? '⏳' : '📷'}</button>
                    <button onClick={() => audioInputRef.current?.click()} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Аудио">🎵</button>
                    <button onClick={addWallPost} style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#22d3ee', color: '#000', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>

                <div style={{ marginTop: '15px' }}>
                    {wallPosts.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#333', fontSize: '13px', padding: '40px', letterSpacing: '2px' }}>
                            СТЕНА ПУСТА. НАПИШИ ПЕРВЫЙ ПОСТ.
                        </div>
                    )}
                    {wallPosts.map(post => (
                        <div key={post.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', background: '#080808', borderRadius: '12px', border: '1px solid #111', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {post.text && <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: post.image || post.audio ? '12px' : '0' }}>{post.text}</div>}
                                {post.image && (
                                    <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: post.audio ? '12px' : '0' }}>
                                        <img src={post.image} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} alt="post" />
                                    </div>
                                )}
                                {post.audio && <VoicePlayer src={post.audio} />}
                                <div style={{ fontSize: '10px', color: '#444', marginTop: '12px' }}>{new Date(post.createdAt).toLocaleString()}</div>
                            </div>
                            <button onClick={() => deleteWallPost(post.id)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>✕</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};