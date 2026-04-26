import React, { useState, useEffect, useCallback } from 'react';
import { ProfileCard } from './ProfileCard';

interface UserResult {
    username: string;
    nickname?: string;
    avatar?: string;
    bio?: string;
    age?: number;
    location?: string;
    languages?: string;
    status?: string;
    gender?: string;
}

interface SearchPageProps {
    username: string;
    onStartChat: (username: string) => void;
}

const locationLabels: Record<string, string> = {
    'не_указано': 'ANY',
    'россия': 'RUSSIA',
    'европа': 'EUROPE',
    'азия': 'ASIA',
    'америка': 'AMERICA',
    'африка': 'AFRICA',
    'океания': 'OCEANIA'
};

export const SearchPage: React.FC<SearchPageProps> = ({ username, onStartChat }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

    const [filterLocation, setFilterLocation] = useState('не_указано');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterMinAge, setFilterMinAge] = useState('');
    const [filterMaxAge, setFilterMaxAge] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('');

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        params.append('me', username);
        if (filterLocation !== 'не_указано') params.append('location', filterLocation);
        if (filterStatus) params.append('status', filterStatus);
        if (filterMinAge) params.append('minAge', filterMinAge);
        if (filterMaxAge) params.append('maxAge', filterMaxAge);
        if (filterLanguage) params.append('language', filterLanguage);

        fetch(`http://localhost:3001/api/users/search?${params.toString()}`)
            .then(r => r.json())
            .then((data: UserResult[]) => setResults(data));
    }, [query, username, filterLocation, filterStatus, filterMinAge, filterMaxAge, filterLanguage]);

    useEffect(() => {
        handleSearch();
    }, [handleSearch]);

    return (
        <div style={containerStyle}>
            <div style={filtersStyle}>
                <input
                    style={searchInputStyle}
                    placeholder="SEARCH BY NICKNAME..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />

                <div style={filterRowStyle}>
                    <select style={selectStyle} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                        {Object.entries(locationLabels).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">ANY STATUS</option>
                        <option value="online">ONLINE</option>
                        <option value="offline">OFFLINE</option>
                    </select>
                    <select style={selectStyle} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                        <option value="">ANY GENDER</option>
                        <option value="мужской">MALE</option>
                        <option value="женский">FEMALE</option>
                    </select>
                </div>

                <div style={filterRowStyle}>
                    <input style={{ ...selectStyle, width: '80px' }} placeholder="MIN AGE" type="number" value={filterMinAge} onChange={e => setFilterMinAge(e.target.value)} />
                    <input style={{ ...selectStyle, width: '80px' }} placeholder="MAX AGE" type="number" value={filterMaxAge} onChange={e => setFilterMaxAge(e.target.value)} />
                    <input style={{ ...selectStyle, flex: 1 }} placeholder="LANGUAGE (RU,EN...)" value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} />
                </div>

                <button style={searchBtnStyle} onClick={handleSearch}>SEARCH</button>
            </div>

            <div style={gridStyle}>
                {results.length === 0 && (
                    <div style={emptyStyle}>NO RESULTS. TRY DIFFERENT FILTERS.</div>
                )}
                {results.map(user => {
                    const isOnline = user.status === 'online';
                    return (
                        <div key={user.username} style={cardStyle} onClick={() => setSelectedUser(user)}>
                            <div style={cardAvatarStyle}>
                                {user.avatar ? (
                                    <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                ) : (
                                    (user.nickname || user.username)[0]?.toUpperCase() || '?'
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                                <div style={cardNameStyle}>{user.nickname || 'ANONYMOUS'}</div>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: isOnline ? '#22d3ee' : '#333',
                                    boxShadow: isOnline ? '0 0 6px #22d3ee' : 'none', flexShrink: 0
                                }} />
                            </div>
                            {user.bio && <div style={cardBioStyle}>{user.bio.slice(0, 60)}{user.bio.length > 60 ? '...' : ''}</div>}
                            <div style={cardTagsStyle}>
                                {user.age ? <span style={tagStyle}>{user.age} y.o.</span> : null}
                                <span style={tagStyle}>{locationLabels[user.location || 'не_указано']}</span>
                                {user.languages ? <span style={tagStyle}>{user.languages}</span> : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedUser && (
                <ProfileCard
                    user={selectedUser}
                    myUsername={username}
                    onClose={() => setSelectedUser(null)}
                    onSendMessage={() => {
                        onStartChat(selectedUser.username);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

const containerStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const filtersStyle: React.CSSProperties = { padding: '20px 25px', borderBottom: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '10px' };
const searchInputStyle: React.CSSProperties = { background: '#080808', border: '1px solid #1a1a1a', padding: '14px 18px', borderRadius: '12px', color: '#22d3ee', fontSize: '14px', outline: 'none' };
const filterRowStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const selectStyle: React.CSSProperties = { background: '#080808', border: '1px solid #1a1a1a', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' };
const searchBtnStyle: React.CSSProperties = { padding: '12px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', letterSpacing: '1px' };
const gridStyle: React.CSSProperties = { flex: 1, padding: '25px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', alignContent: 'start' };
const emptyStyle: React.CSSProperties = { gridColumn: '1 / -1', textAlign: 'center', color: '#333', fontSize: '14px', letterSpacing: '3px', marginTop: '100px' };
const cardStyle: React.CSSProperties = { background: '#080808', border: '1px solid #111', borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s', textAlign: 'center' };
const cardAvatarStyle: React.CSSProperties = { width: '70px', height: '70px', borderRadius: '18px', background: '#111', border: '1px solid #22d3ee', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#22d3ee', overflow: 'hidden' };
const cardNameStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#fff', textAlign: 'center' };
const cardBioStyle: React.CSSProperties = { fontSize: '11px', color: '#666', marginTop: '8px', lineHeight: '1.4', textAlign: 'center' };
const cardTagsStyle: React.CSSProperties = { display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' };
const tagStyle: React.CSSProperties = { fontSize: '9px', color: '#22d3ee', background: 'rgba(34,211,238,0.1)', padding: '3px 8px', borderRadius: '5px', fontWeight: 'bold' };