import React, { useState } from 'react';

interface ProfileEditorProps {
    username: string;
    onClose: () => void;
    onSave: () => void;
}

interface WallPost {
    id: string;
    text: string;
    createdAt: string;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ username, onClose, onSave }) => {
    const session = JSON.parse(localStorage.getItem('hush_session') || '{}');

    const [nickname, setNickname] = useState(session.nickname || '');
    const [bio, setBio] = useState(session.bio || '');
    const [age, setAge] = useState(session.age || '');
    const [location, setLocation] = useState(session.location || 'не_указано');
    const [languages, setLanguages] = useState(session.languages || '');
    const [status, setStatus] = useState(session.status || 'offline');

    // Посты на стене
    const [wallPosts, setWallPosts] = useState<WallPost[]>(() => {
        const saved = localStorage.getItem(`hush_wall_${username}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [newPost, setNewPost] = useState('');

    const handleSave = async () => {
        const res = await fetch('http://localhost:3001/api/users/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username, nickname, bio,
                age: Number(age) || 0, location, languages, status
            })
        });

        if (res.ok) {
            const updated = await res.json();
            const newSession = {
                ...session,
                nickname: updated.nickname,
                bio: updated.bio,
                age: updated.age,
                location: updated.location,
                languages: updated.languages,
                status: updated.status
            };
            localStorage.setItem('hush_session', JSON.stringify(newSession));
            onSave();
        }
    };

    const addWallPost = () => {
        if (!newPost.trim()) return;
        const post: WallPost = {
            id: Date.now().toString(),
            text: newPost.trim(),
            createdAt: new Date().toISOString()
        };
        const updated = [post, ...wallPosts];
        setWallPosts(updated);
        localStorage.setItem(`hush_wall_${username}`, JSON.stringify(updated));
        setNewPost('');
    };

    const deleteWallPost = (id: string) => {
        const updated = wallPosts.filter(p => p.id !== id);
        setWallPosts(updated);
        localStorage.setItem(`hush_wall_${username}`, JSON.stringify(updated));
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={titleStyle}>РЕДАКТИРОВАНИЕ ПРОФИЛЯ</h2>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>НИКНЕЙМ</label>
                    <input style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Твой позывной" />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>ОПИСАНИЕ</label>
                    <textarea style={{ ...inputStyle, height: '60px', resize: 'none' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Пару слов о себе" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                        <label style={labelStyle}>ВОЗРАСТ</label>
                        <input style={inputStyle} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="0" />
                    </div>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                        <label style={labelStyle}>СТАТУС</label>
                        <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="online">ONLINE</option>
                            <option value="offline">OFFLINE</option>
                        </select>
                    </div>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>ЛОКАЦИЯ</label>
                    <select style={inputStyle} value={location} onChange={e => setLocation(e.target.value)}>
                        <option value="не_указано">НЕ УКАЗАНО</option>
                        <option value="россия">РОССИЯ</option>
                        <option value="европа">ЕВРОПА</option>
                        <option value="азия">АЗИЯ</option>
                        <option value="америка">АМЕРИКА</option>
                        <option value="африка">АФРИКА</option>
                        <option value="океания">ОКЕАНИЯ</option>
                    </select>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>ЯЗЫКИ (через запятую: RU,EN,ES)</label>
                    <input style={inputStyle} value={languages} onChange={e => setLanguages(e.target.value)} placeholder="RU,EN" />
                </div>

                {/* Стена */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #1a1a1a', paddingTop: '15px' }}>
                    <label style={labelStyle}>СТЕНА ({wallPosts.length} постов)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                            style={{ ...inputStyle, flex: 1 }}
                            placeholder="Написать на стене..."
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addWallPost()}
                        />
                        <button onClick={addWallPost} style={postBtnStyle}>+</button>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                        {wallPosts.map(post => (
                            <div key={post.id} style={wallPostStyle}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>{post.text}</div>
                                    <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>{new Date(post.createdAt).toLocaleString()}</div>
                                </div>
                                <button onClick={() => deleteWallPost(post.id)} style={deletePostBtnStyle}>✕</button>
                            </div>
                        ))}
                        {wallPosts.length === 0 && (
                            <div style={{ fontSize: '11px', color: '#333', textAlign: 'center', padding: '15px' }}>Стена пуста. Напиши что-нибудь.</div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button style={saveBtnStyle} onClick={handleSave}>СОХРАНИТЬ</button>
                    <button style={cancelBtnStyle} onClick={onClose}>ОТМЕНА</button>
                </div>
            </div>
        </div>
    );
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100
};

const modalStyle: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: '20px', padding: '30px', width: '460px',
    maxHeight: '85vh', overflowY: 'auto'
};

const titleStyle: React.CSSProperties = {
    fontSize: '16px', color: '#22d3ee', fontWeight: '900',
    letterSpacing: '3px', marginBottom: '25px', textAlign: 'center'
};

const formGroupStyle: React.CSSProperties = { marginBottom: '15px' };

const labelStyle: React.CSSProperties = {
    fontSize: '10px', color: '#555', fontWeight: 'bold',
    letterSpacing: '2px', display: 'block', marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
    width: '100%', background: '#080808', border: '1px solid #1a1a1a',
    padding: '14px', borderRadius: '10px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};

const saveBtnStyle: React.CSSProperties = {
    flex: 1, padding: '14px', background: '#22d3ee', color: '#000',
    border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontWeight: '900', fontSize: '13px'
};

const cancelBtnStyle: React.CSSProperties = {
    flex: 1, padding: '14px', background: 'transparent',
    border: '1px solid #333', color: '#555', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
};

const postBtnStyle: React.CSSProperties = {
    width: '42px', height: '42px', borderRadius: '10px',
    background: '#22d3ee', color: '#000', border: 'none',
    cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const wallPostStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '10px', background: '#080808', borderRadius: '10px',
    border: '1px solid #111', marginBottom: '6px'
};

const deletePostBtnStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', color: '#444',
    cursor: 'pointer', fontSize: '14px', padding: '2px 6px'
};