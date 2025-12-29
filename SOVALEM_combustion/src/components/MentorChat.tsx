import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Brain, BookOpen, Camera } from 'lucide-react';
import { analyzeQuestion } from '../utils/mentorEngine';
import { analyzeSupervisionImage } from '../utils/geminiClient';
import { useBoilerData } from '../hooks/useBoilerData';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

export const MentorChat: React.FC<Props> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "👋 Bonjour ! Je suis le **Super Mentor IA** de SOVALEM.\n\nJe peux répondre à vos questions sur :\n- 🌡️ Température et surchauffe\n- 🔥 Réglage du feu\n- 💨 O2 et combustion\n- ⚙️ Modes de régulation\n\nPosez-moi une question !",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isTeaching, setIsTeaching] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startTeaching = () => {
        setIsTeaching(true);
        const teachingMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "🎓 **Mode Enseignement Activé**\n\nJe suis prêt à apprendre. Quel savoir ou retour d'expérience de SOVALEM (ex: issu de NotebookLM) souhaites-tu me transmettre ?\n\n*Colle ton texte ici et je t'aiderai à le structurer.*",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, teachingMessage]);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);
        const fileNames = fileList.map(f => f.name).join(', ');

        // Add user message indicating image upload
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: `📷 ${fileList.length} image(s) envoyée(s): ${fileNames}`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsAnalyzingImage(true);

        try {
            // Convert all files to base64
            const imagesData: { base64: string; mimeType: string }[] = [];

            for (const file of fileList) {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        const base64Data = result.split(',')[1];
                        resolve(base64Data);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                imagesData.push({
                    base64,
                    mimeType: file.type || 'image/jpeg'
                });
            }

            const analysis = await analyzeSupervisionImage(imagesData[0].base64, imagesData[0].mimeType, imagesData.slice(1));

            const analysisMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: analysis,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, analysisMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Erreur lors de l'analyse de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAnalyzingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Call AI (async for API)
        const context = {
            sh5Temp: data.simulation.sh5Temp,
            o2: data.simulation.simulatedO2,
            barycenter: data.currentBarycenter,
            mode: data.asMode,
            fouling: data.foulingFactor,
            pci: data.simulation.dynamicPCI,
            asFlow: data.simulation.asFlow
        };

        try {
            const response = await analyzeQuestion(input, context, isTeaching);

            const mentorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, mentorMessage]);

            // Optional: If AI confirmed save, we could reset isTeaching.
            // For now, let the user stay in teaching mode until they click a "Finished" button or similar.
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "❌ Erreur lors de la communication avec l'IA. Réessayez.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickQuestion = (question: string) => {
        setInput(question);
    };

    const quickQuestions = [
        "Comment régler le barycentre ?",
        "Pourquoi SH5 monte ?",
        "Différence Mode 1 et Mode 2 ?",
        "Quand ramoner ?"
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform group"
                title="Ouvrir Super Mentor IA"
            >
                <MessageCircle size={28} className="group-hover:animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Brain size={14} />
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Super Mentor IA</h3>
                        <p className="text-xs opacity-90">Assistant SOVALEM</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={startTeaching}
                        disabled={isTeaching}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 hover:bg-white/20 ${isTeaching ? 'text-green-300' : 'text-white'}`}
                        title="Enseigner au Mentor"
                    >
                        <BookOpen size={20} />
                        <span className="text-xs font-bold hidden sm:inline">Enseigner</span>
                    </button>
                    {isTeaching && (
                        <button
                            onClick={() => setIsTeaching(false)}
                            className="p-1 px-2 bg-red-500/50 hover:bg-red-500 rounded text-[10px] font-bold text-white transition-colors"
                        >
                            QUITTER
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                                }`}
                        >
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm">{msg.content}</p>
                            )}
                            <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
                <div className="px-4 py-2 bg-white border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-2 font-semibold">Questions rapides :</p>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickQuestion(q)}
                                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
                {/* Hidden file input for image upload (supports multiple files) */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTyping || isAnalyzingImage}
                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        title="Analyser une capture de supervision"
                    >
                        <Camera size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isAnalyzingImage ? "Analyse en cours..." : "Posez votre question..."}
                        disabled={isAnalyzingImage}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-slate-100"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping || isAnalyzingImage}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                    📷 Cliquez sur l'icône caméra pour analyser une capture de supervision
                </p>
            </div>
        </div>
    );
};
