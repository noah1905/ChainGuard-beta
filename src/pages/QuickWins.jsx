import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client.js';
import { CheckCircle, X } from 'lucide-react';

export default function QuickWins({ user }) {
    const [quickWins, setQuickWins] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuickWins = async () => {
            try {
                const { data, error } = await supabase
                    .from('quick_wins')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setQuickWins(data || []);
            } catch (error) {
                console.error('Fehler beim Laden der Quick Wins:', error);
                setError('Fehler beim Laden der Quick Wins.');
            }
        };
        if (user?.id) fetchQuickWins();
    }, [user]);

    const handleQuickWinAction = async (action, winId) => {
        try {
            switch (action) {
                case 'complete_supplier_data':
                    navigate('/suppliers/edit');
                    break;
                case 'enable_auto_reports':
                    navigate('/settings/reports');
                    break;
                default:
                    break;
            }
            const { error } = await supabase
                .from('quick_wins')
                .update({ status: 'completed' })
                .eq('id', winId);
            if (error) throw error;
            setQuickWins(quickWins.filter(win => win.id !== winId));
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Quick Wins:', error);
            setError('Fehler beim Verarbeiten des Quick Wins.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle size={24} className="text-green-600" />
                    Quick Wins
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
                {quickWins.length > 0 ? (
                    <div className="space-y-3">
                        {quickWins.map((win) => (
                            <div
                                key={win.id}
                                className="p-3 border border-gray-200 rounded-lg flex justify-between items-center"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{win.title}</p>
                                        <p className="text-xs text-gray-500">{win.impact}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleQuickWinAction(win.action, win.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                                >
                                    Umsetzen
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Keine Quick Wins vorhanden.</p>
                )}
            </div>
        </div>
    );
}