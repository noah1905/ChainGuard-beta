import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client.js';
import { MessageSquare, X } from 'lucide-react';

export default function Messages({ user }) {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*, suppliers(name)')
                    .eq('user_id', user.id)
                    .order('timestamp', { ascending: false });
                if (error) throw error;
                setMessages(data || []);
            } catch (error) {
                console.error('Fehler beim Laden der Nachrichten:', error);
                setError('Fehler beim Laden der Nachrichten.');
            }
        };
        if (user?.id) fetchMessages();
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', id);
            if (error) throw error;
            setMessages(messages.map(msg => msg.id === id ? { ...msg, is_read: true } : msg));
        } catch (error) {
            console.error('Fehler beim Markieren als gelesen:', error);
            setError('Fehler beim Markieren als gelesen.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare size={24} className="text-blue-600" />
                    Nachrichten
                </h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Zurück zum Dashboard
                </button>
            </div>
            {error && (
                <div className="mb-4 bg-red-600 text-white px-4 py-2 rounded-lg flex items-center">
                    <X size={16} className="mr-2" />
                    {error}
                </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {messages.length > 0 ? (
                    <div className="space-y-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-3 border rounded-lg ${msg.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{msg.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Von: {msg.sender_name} | An: {msg.suppliers?.name || 'Team'} |{' '}
                                            {new Date(msg.timestamp).toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                    {!msg.is_read && (
                                        <button
                                            onClick={() => markAsRead(msg.id)}
                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                            Gelesen
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Keine Nachrichten vorhanden.</p>
                )}
            </div>
        </div>
    );
}