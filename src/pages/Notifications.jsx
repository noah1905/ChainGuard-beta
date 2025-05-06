import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client.js';
import { Bell, X } from 'lucide-react';

export default function Notifications({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setNotifications(data || []);
            } catch (error) {
                console.error('Fehler beim Laden der Benachrichtigungen:', error);
                setError('Fehler beim Laden der Benachrichtigungen.');
            }
        };
        if (user?.id) fetchNotifications();
    }, [user]);

    const markNotificationAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
            if (error) throw error;
            setNotifications(notifications.map(notification =>
                notification.id === id ? { ...notification, is_read: true } : notification
            ));
        } catch (error) {
            console.error('Fehler beim Markieren der Benachrichtigung als gelesen:', error);
            setError('Fehler beim Markieren der Benachrichtigung als gelesen.');
        }
    };

    const dismissNotification = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setNotifications(notifications.filter(notification => notification.id !== id));
        } catch (error) {
            console.error('Fehler beim Entfernen der Benachrichtigung:', error);
            setError('Fehler beim Entfernen der Benachrichtigung.');
        }
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-red-200 bg-red-50';
            case 'medium':
                return 'border-yellow-200 bg-yellow-50';
            case 'low':
                return 'border-blue-200 bg-blue-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const getPriorityIndicator = (priority) => {
        switch (priority) {
            case 'high':
                return <span className="block w-2 h-2 rounded-full bg-red-500"></span>;
            case 'medium':
                return <span className="block w-2 h-2 rounded-full bg-yellow-500"></span>;
            case 'low':
                return <span className="block w-2 h-2 rounded-full bg-blue-500"></span>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <Bell size={24} className="text-blue-600" />
                    Benachrichtigungen
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
                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 border rounded-lg ${notification.is_read ? 'border-gray-200' : getPriorityStyles(notification.priority)}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {!notification.is_read && getPriorityIndicator(notification.priority)}
                                        <h3 className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                                            {notification.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => dismissNotification(notification.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{notification.description}</p>
                                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                    <span>{new Date(notification.created_at).toLocaleString('de-DE')}</span>
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => markNotificationAsRead(notification.id)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Gelesen
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Keine Benachrichtigungen vorhanden.</p>
                )}
            </div>
        </div>
    );
}