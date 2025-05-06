import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client.js';
import { CheckCircle, X } from 'lucide-react';

export default function Tasks({ user }) {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
                    .order('due_date', { ascending: true });
                if (error) throw error;
                setTasks(data || []);
            } catch (error) {
                console.error('Fehler beim Laden der Aufgaben:', error);
                setError('Fehler beim Laden der Aufgaben.');
            }
        };
        if (user?.id) fetchTasks();
    }, [user]);

    const handleTaskAction = async (action, taskId) => {
        try {
            switch (action) {
                case 'evaluate_supplier':
                    navigate('/suppliers/evaluate');
                    break;
                case 'update_documents':
                    navigate('/documents');
                    break;
                case 'schedule_training':
                    navigate('/training/schedule');
                    break;
                case 'add_supplier':
                    navigate('/dashboard');
                    break;
                default:
                    break;
            }
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', taskId);
            if (error) throw error;
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Fehler beim Verarbeiten der Aufgabe:', error);
            setError('Fehler beim Verarbeiten der Aufgabe.');
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
                    <CheckCircle size={24} className="text-blue-600" />
                    Aufgaben
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
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`p-3 border rounded-lg ${getPriorityStyles(task.priority)} flex justify-between items-center`}
                            >
                                <div className="flex items-center gap-2">
                                    {getPriorityIndicator(task.priority)}
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                        <p className="text-xs text-gray-500">
                                            Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTaskAction(task.action, task.id)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                                >
                                    Erledigen
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Keine Aufgaben vorhanden.</p>
                )}
            </div>
        </div>
    );
}