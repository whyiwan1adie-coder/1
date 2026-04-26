import React, { useState } from 'react';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({ username: '', password: '', gender: 'мужской', age: 18 });
    const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
    const [accessKey, setAccessKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setAccessKey(data.accessKey);
            setStep('success');
        } catch (err) {
            alert(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020203] text-white overflow-hidden font-sans relative">
            {/* Глубокий градиент на фоне (Профессиональный Mesh) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-600/10 blur-[120px]"></div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">

                {/* 1. INTRO SCREEN */}
                {step === 'intro' && (
                    <div className="max-w-xl w-full text-center space-y-10 animate-in fade-in duration-1000">
                        <div className="space-y-4">
                            <h1 className="text-9xl font-black tracking-tighter italic bg-gradient-to-br from-white via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                                HUSH
                            </h1>
                            <p className="text-xl tracking-[0.3em] font-light text-slate-400 uppercase">
                                Разговоры без эха
                            </p>
                        </div>
                        <button
                            onClick={() => setStep('form')}
                            className="px-12 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            РАСТВОРИТЬСЯ
                        </button>
                    </div>
                )}

                {/* 2. FORM SCREEN */}
                {step === 'form' && (
                    <div className="max-w-md w-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
                        <h2 className="text-2xl font-bold mb-8 tracking-tight text-cyan-400">Новая личность</h2>
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Никнейм</label>
                                <input
                                    className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-violet-500 transition-colors"
                                    type="text" required onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-4">Пароль</label>
                                <input
                                    className="w-full bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-violet-500 transition-colors"
                                    type="password" required onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <select
                                    className="flex-1 bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-cyan-500 appearance-none"
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="мужской">Мужчина</option>
                                    <option value="женский">Женщина</option>
                                </select>
                                <input
                                    className="w-24 bg-white/[0.05] border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-emerald-500 text-center"
                                    type="number" placeholder="Лет" onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 via-cyan-600 to-emerald-600 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
                            >
                                {isLoading ? 'СОЗДАНИЕ...' : 'ОБРЕТИ ГОЛОС'}
                            </button>
                        </form>
                    </div>
                )}

                {/* 3. SUCCESS SCREEN */}
                {step === 'success' && (
                    <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Твой секретный ключ</h2>
                        <div className="p-6 bg-black rounded-3xl border border-white/10 font-mono text-cyan-400 break-all shadow-inner">
                            {accessKey}
                        </div>
                        <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-white transition-colors uppercase text-xs tracking-[0.3em]">
                            Ключ сохранен
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;