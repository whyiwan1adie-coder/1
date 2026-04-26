import React, { useState } from 'react';
import { UserData } from './App';

interface RegisterProps {
    onRegister: (userData: UserData) => void;
}

interface RegisterResponse {
    publicKey?: string;
    error?: string;
    username?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Используем React.FormEvent — это стандартный современный тип
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = (await response.json()) as RegisterResponse;

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }

            const key = data.publicKey || "HUSH_" + Math.random().toString(36).substring(2, 12).toUpperCase();
            setAccessKey(key);
            setStep('success');
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert('Произошла неизвестная ошибка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalStep = () => {
        if (!accessKey) return;

        const userData: UserData = {
            username: formData.username,
            login: formData.username,
            hashPassword: formData.password,
            encryptionKey: accessKey,
            photo: ""
        };

        onRegister(userData);
    };

    return (
        <div className="min-h-screen w-full bg-[#020203] text-white overflow-hidden relative font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]"></div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                {step === 'intro' && (
                    <div className="max-w-xl w-full text-center space-y-10">
                        <div className="space-y-4">
                            <h1 className="text-8xl md:text-9xl font-black italic bg-gradient-to-br from-white via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                                HUSH
                            </h1>
                            <p className="text-xl tracking-[0.3em] font-light text-slate-400 uppercase">Разговоры без эха</p>
                        </div>
                        <button
                            onClick={() => setStep('form')}
                            className="px-12 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            РАСТВОРИТЬСЯ
                        </button>
                    </div>
                )}

                {step === 'form' && (
                    <div className="max-w-md w-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl">
                        <h2 className="text-2xl font-bold mb-8 text-cyan-400">Новая личность</h2>
                        <form onSubmit={handleRegister} className="space-y-6">
                            <input
                                className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-violet-500 text-white"
                                placeholder="Никнейм"
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <input
                                className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-violet-500 text-white"
                                placeholder="Пароль"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-bold hover:opacity-90 transition-opacity text-white"
                            >
                                {isLoading ? 'СОЗДАНИЕ...' : 'ОБРЕТИ ГОЛОС'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div className="max-w-md w-full text-center space-y-8">
                        <h2 className="text-3xl font-bold text-white">Твой секретный ключ</h2>
                        <div className="p-6 bg-black rounded-3xl border border-white/10 font-mono text-cyan-400 break-all shadow-inner">
                            {accessKey}
                        </div>
                        <button
                            onClick={handleFinalStep}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-cyan-400 transition-colors uppercase tracking-widest"
                        >
                            ВОЙТИ В СЕТЬ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;