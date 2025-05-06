import '@/styles/animations.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './client.js';
import AddSupplierForm from '@/components/AddSupplierForm.jsx';
import SupplierList from '@/components/SupplierList.jsx';
import AuditLog from '@/components/AuditLog.jsx';
import SupplierDetailsModal from '@/components/SupplierDetailsModal.jsx';
import { useAuditLogger } from '@/hooks/useAuditLogger.js';
import Sidebar from '@/components/Sidebar.jsx';
import { Search, PlusCircle, FileText, Download, ChevronDown, AlertCircle, X, Bell, CheckCircle, MinusCircle, MessageSquare, Loader } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Onboarding from '/src/pages/Onboarding.jsx';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Registriere Chart.js-Komponenten
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

// MessagesList-Komponente
const MessagesList = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                setError('');
                console.log('Fetching messages for user:', user.id);
                const { data, error } = await supabase
                    .from('messages')
                    .select('id, content, timestamp, user_id, sender_name, is_read')
                    .eq('user_id', user.id)
                    .order('timestamp', { ascending: false })
                    .limit(5);
                if (error) {
                    console.error('Supabase error (messages):', error);
                    throw error;
                }
                console.log('Messages fetched:', data);
                setMessages(data || []);
            } catch (error) {
                console.error('Error in fetchMessages:', error);
                const errorMessage = error.message || (error.details && JSON.stringify(error.details)) || JSON.stringify(error, null, 2);
                setError('Fehler beim Laden der Nachrichten: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) fetchMessages();
    }, [user]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                Nachrichten
            </h2>
            {error && (
                <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-3 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
            {loading ? (
                <div className="flex justify-center">
                    <Loader size={24} className="animate-spin text-gray-500" />
                </div>
            ) : messages.length > 0 ? (
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
                                        Von: {msg.sender_name || 'Unbekannt'} | An: Team | {new Date(msg.timestamp).toLocaleString('de-DE')}
                                    </p>
                                </div>
                                {!msg.is_read && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { error } = await supabase
                                                    .from('messages')
                                                    .update({ is_read: true })
                                                    .eq('id', msg.id);
                                                if (error) throw error;
                                                setMessages(messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
                                            } catch (error) {
                                                console.error('Fehler beim Markieren als gelesen:', error);
                                            }
                                        }}
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
                <p className="text-sm text-gray-500">Keine Nachrichten vorhanden.</p>
            )}
            <button
                onClick={() => navigate('/messages')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
                Alle Nachrichten anzeigen
            </button>
        </div>
    );
};

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        country: '',
        industry: '',
        risk_level: '',
        note: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [riskStats, setRiskStats] = useState({ Hoch: 0, Mittel: 0, Niedrig: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('Alle');
    const [industryFilter, setIndustryFilter] = useState('Alle');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [fileUpload, setFileUpload] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [riskTrendData, setRiskTrendData] = useState([]);
    const [openActions, setOpenActions] = useState(0);
    const [averageRiskScore, setAverageRiskScore] = useState(0);
    const [complianceScore, setComplianceScore] = useState(0);
    const [urgentActions, setUrgentActions] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [quickWins, setQuickWins] = useState([]);
    const [onboardingProgress, setOnboardingProgress] = useState(0);
    const totalSteps = 5;

    const navigate = useNavigate();
    const popupRef = useRef(null);
    const notificationsRef = useRef(null);
    const location = useLocation();
    let pageTitle = "Dashboard";
    if (location.pathname.includes('suppliers')) pageTitle = "Lieferanten";
    else if (location.pathname.includes('audit')) pageTitle = "Audit Log";
    else if (location.pathname.includes('whistleblower')) pageTitle = "Anonyme Meldung";

    const {
        auditLogs,
        logActionFilter,
        setLogActionFilter,
        logUserFilter,
        setLogUserFilter,
        handleAuditLogCSVExport,
        handleAuditLogPDFExport
    } = useAuditLogger(isAdmin);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('filters'));
        if (saved) {
            setSearchTerm(saved.searchTerm || '');
            setRiskFilter(saved.riskFilter || 'Alle');
            setIndustryFilter(saved.industryFilter || 'Alle');
        }
    }, []);

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    useEffect(() => {
        localStorage.setItem('filters', JSON.stringify({
            searchTerm,
            riskFilter,
            industryFilter,
        }));
    }, [searchTerm, riskFilter, industryFilter]);

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;
                if (data?.user) {
                    setUser(data.user);
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();
                    if (profileError) throw profileError;
                    setIsAdmin(profile?.role === 'admin');
                    await Promise.all([
                        fetchSuppliers(data.user.id),
                        fetchRiskTrend(),
                        fetchOpenActions(),
                        fetchNotifications(data.user.id),
                        fetchTasks(data.user.id),
                        fetchQuickWins(data.user.id)
                    ]);
                } else {
                    navigate('/');
                }
            } catch (error) {
                console.error('Fehler beim Laden des Benutzers:', error);
                setErrorMessage('Fehler beim Laden des Benutzers.');
                navigate('/');
            }
        };
        getUser();
    }, [navigate]);

    useEffect(() => {
        const checkOnboardingStatus = () => {
            const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
            const onboardingSkipped = localStorage.getItem('onboardingSkipped') === 'true';
            const onboardingData = JSON.parse(localStorage.getItem('onboardingData')) || {};

            if (onboardingComplete || onboardingSkipped) {
                setShowOnboarding(false);
                setOnboardingProgress(100);
                return;
            }

            let progress = 0;
            if (onboardingData.companyName) progress += 1;
            if (onboardingData.complianceAnswers?.length > 0) progress += 1;
            if (onboardingData.suppliers?.length > 0) progress += 1;
            if (onboardingData.documents?.length > 0) progress += 1;
            if (onboardingData.actionPlan) progress += 1;
            const progressPercentage = (progress / totalSteps) * 100;

            setShowOnboarding(true);
            setOnboardingProgress(progressPercentage);
        };

        checkOnboardingStatus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchSuppliers = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            setSuppliers(data || []);
            const stats = { Hoch: 0, Mittel: 0, Niedrig: 0 };
            data.forEach((s) => {
                if (s.risk_level && stats[s.risk_level] !== undefined) {
                    stats[s.risk_level]++;
                }
            });
            setRiskStats(stats);

            const scores = data.map(s => s.risk_score || 0);
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            setAverageRiskScore(avgScore);

            const compliance = Math.round((stats.Niedrig / (data.length || 1)) * 100);
            setComplianceScore(compliance || 0);
            setUrgentActions(stats.Hoch);
        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            setErrorMessage('Fehler beim Laden der Lieferanten.');
        }
    };

    const fetchRiskTrend = async () => {
        try {
            const { data, error } = await supabase
                .from('risk_trend')
                .select('month, average_risk')
                .order('month', { ascending: true });
            if (error) throw error;
            setRiskTrendData(data || []);
        } catch (error) {
            console.error('Fehler beim Laden des Risikotrends:', error);
            setErrorMessage('Fehler beim Laden des Risikotrends.');
        }
    };

    const fetchOpenActions = async () => {
        try {
            const { data, error } = await supabase
                .from('remedial_actions')
                .select('status')
                .eq('status', 'Offen');
            if (error) throw error;
            setOpenActions(data.length || 0);
        } catch (error) {
            console.error('Fehler beim Laden der offenen Maßnahmen:', error);
            setErrorMessage('Fehler beim Laden der offenen Maßnahmen.');
        }
    };

    const fetchNotifications = async (userId) => {
        try {
            console.log('Fetching notifications for user:', userId);
            const { data, error } = await supabase
                .from('notifications')
                .select('id, title, description, created_at, user_id, priority, is_read')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            if (error) {
                console.error('Supabase error (notifications):', error);
                throw error;
            }
            console.log('Notifications fetched:', data);
            setNotifications(data || []);
        } catch (error) {
            console.error('Error in fetchNotifications:', error);
            const errorMessage = error.message || (error.details && JSON.stringify(error.details)) || JSON.stringify(error, null, 2);
            setErrorMessage('Fehler beim Laden der Benachrichtigungen: ' + errorMessage);
        }
    };

    const fetchTasks = async (userId) => {
        try {
            console.log('Fetching tasks for user:', userId);
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, due_date, priority, action, assigned_to, created_by')
                .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
                .order('due_date', { ascending: true })
                .limit(3);
            if (error) {
                console.error('Supabase error (tasks):', error);
                throw error;
            }
            console.log('Tasks fetched:', data);
            setTasks(data || []);
        } catch (error) {
            console.error('Error in fetchTasks:', error);
            const errorMessage = error.message || (error.details && JSON.stringify(error.details)) || JSON.stringify(error, null, 2);
            setErrorMessage('Fehler beim Laden der Aufgaben: ' + errorMessage);
        }
    };

    const fetchQuickWins = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('quick_wins')
                .select('*')
                .eq('user_id', userId)
                .limit(3);
            if (error) throw error;
            setQuickWins(data || []);
        } catch (error) {
            console.error('Fehler beim Laden der Quick Wins:', error);
            setErrorMessage('Fehler beim Laden der Quick Wins.');
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Fehler beim Abmelden:', error);
            setErrorMessage('Fehler beim Abmelden.');
        }
    };

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
            setErrorMessage('Fehler beim Markieren der Benachrichtigung als gelesen.');
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
            setErrorMessage('Fehler beim Entfernen der Benachrichtigung.');
        }
    };

    const handleExportSuppliersCSV = () => {
        try {
            const csvData = filteredSuppliers.map(s => ({
                Name: s.name,
                Land: s.country,
                Branche: s.industry,
                Risikostufe: s.risk_level,
                Notizen: s.note || '',
                Risikoscore: s.risk_score || 0
            }));
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `lieferanten_${new Date().toISOString()}.csv`);
            link.click();
            URL.revokeObjectURL(url);
            setSuccessMessage('CSV-Export erfolgreich.');
        } catch (error) {
            console.error('Fehler beim Exportieren der Lieferanten als CSV:', error);
            setErrorMessage('Fehler beim Exportieren der Lieferanten als CSV.');
        }
    };

    const handleExportLKGReportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Lieferkettengesetz (LkSG) Bericht', 20, 20);
            doc.setFontSize(12);
            doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
            doc.text(`Compliance-Score: ${complianceScore}%`, 20, 40);
            doc.text(`Durchschnittlicher Risikoscore: ${averageRiskScore}/100`, 20, 50);
            doc.text(`Offene Maßnahmen: ${openActions}`, 20, 60);

            const tableData = filteredSuppliers.map(s => [
                s.name,
                s.country,
                s.industry,
                s.risk_level,
                s.risk_score || 0
            ]);
            doc.autoTable({
                startY: 70,
                head: [['Name', 'Land', 'Branche', 'Risikostufe', 'Risikoscore']],
                body: tableData,
            });

            doc.save(`lksg_bericht_${new Date().toISOString()}.pdf`);
            setSuccessMessage('PDF-Bericht erfolgreich erstellt.');
        } catch (error) {
            console.error('Fehler beim Erstellen des PDF-Berichts:', error);
            setErrorMessage('Fehler beim Erstellen des PDF-Berichts.');
        }
    };

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
                    setShowAddSupplier(true);
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
            setSuccessMessage('Aufgabe erfolgreich erledigt.');
        } catch (error) {
            console.error('Fehler beim Verarbeiten der Aufgabe:', error);
            setErrorMessage('Fehler beim Verarbeiten der Aufgabe.');
        }
    };

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
            setSuccessMessage('Quick Win erfolgreich umgesetzt.');
        } catch (error) {
            console.error('Fehler beim Verarbeiten des Quick Wins:', error);
            setErrorMessage('Fehler beim Verarbeiten des Quick Wins.');
        }
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-yellow-200 bg-yellow-50';
            case 'low': return 'border-blue-200 bg-blue-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getPriorityIndicator = (priority) => {
        switch (priority) {
            case 'high': return <span className="block w-2 h-2 rounded-full bg-red-500"></span>;
            case 'medium': return <span className="block w-2 h-2 rounded-full bg-yellow-500"></span>;
            case 'low': return <span className="block w-2 h-2 rounded-full bg-blue-500"></span>;
            default: return null;
        }
    };

    const getComplianceColor = (score) => {
        if (score < 40) return 'bg-red-500';
        if (score < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const unreadCount = notifications.filter(notification => !notification.is_read).length;

    const filteredSuppliers = suppliers.filter((s) =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (riskFilter === 'Alle' || s.risk_level === riskFilter) &&
        (industryFilter === 'Alle' || s.industry === industryFilter)
    );

    const konformPercentage = suppliers.length > 0 ? Math.round((riskStats.Niedrig / suppliers.length) * 100) : 0;
    const nichtKonformPercentage = suppliers.length > 0 ? Math.round((riskStats.Hoch / suppliers.length) * 100) : 0;

    const lineChartData = {
        labels: riskTrendData.map(data => data.month),
        datasets: [
            {
                label: 'Durchschnittlicher Risikoscore',
                data: riskTrendData.map(data => data.average_risk),
                fill: false,
                borderColor: 'rgb(59, 130, 246)',
                tension: 0.1,
            },
        ],
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-72">
                {showOnboarding && (
                    <Onboarding
                        onComplete={() => {
                            setShowOnboarding(false);
                            setOnboardingProgress(100);
                        }}
                        onSkip={() => {
                            setShowOnboarding(false);
                            setOnboardingProgress(100);
                        }}
                    />
                )}
                {!showOnboarding && (
                    <div className="max-w-6xl mx-auto p-6">
                        {/* Header */}
                        <header className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-800">{pageTitle}</h1>
                                <p className="text-sm text-gray-500 mt-1">Überblick und Verwaltung Ihrer Lieferkette</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                        Admin
                                    </span>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="focus:outline-none"
                                    >
                                        <Bell size={18} className="text-gray-500 hover:text-blue-600" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <div
                                            ref={notificationsRef}
                                            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform transition-all duration-300 ease-in-out origin-top-right scale-y-0 opacity-0 animate-[slideDown_0.3s_ease-in-out_forwards]"
                                        >
                                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                    <Bell size={16} className="text-blue-600" />
                                                    Benachrichtigungen
                                                    {unreadCount > 0 && (
                                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                                            {unreadCount} neu
                                                        </span>
                                                    )}
                                                </h2>
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="p-4 max-h-64 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    <div className="space-y-2">
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
                                                    <div className="text-center py-6 text-gray-500 text-sm">
                                                        Keine Benachrichtigungen
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                                <button
                                                    onClick={() => navigate('/notifications')}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium rounded-lg w-full text-center"
                                                >
                                                    Alle anzeigen
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Abmelden
                                </button>
                            </div>
                        </header>

                        {/* Compliance Setup Center */}
                        {!localStorage.getItem('onboardingComplete') && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3">Compliance Setup</h2>
                                <div className="mb-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${onboardingProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Fortschritt: {Math.round(onboardingProgress)}%</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`h-4 w-4 ${JSON.parse(localStorage.getItem('onboardingData'))?.companyName ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Firmeneinrichtung</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`h-4 w-4 ${JSON.parse(localStorage.getItem('onboardingData'))?.complianceAnswers?.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Compliance-Schnellstart</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`h-4 w-4 ${JSON.parse(localStorage.getItem('onboardingData'))?.suppliers?.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Lieferantenerfassung</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`h-4 w-4 ${JSON.parse(localStorage.getItem('onboardingData'))?.documents?.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Dokumenten-Basisset</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`h-4 w-4 ${JSON.parse(localStorage.getItem('onboardingData'))?.actionPlan ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>Compliance-Fahrplan</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowOnboarding(true)}
                                    className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                    Fortsetzen
                                </button>
                            </div>
                        )}

                        {/* Overview Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Übersicht</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs font-medium text-blue-700 uppercase">Offene Maßnahmen</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{openActions}</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <p className="text-xs font-medium text-purple-700 uppercase">Risikoscore</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{averageRiskScore}/100</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-xs font-medium text-green-700 uppercase">Compliance</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{complianceScore}%</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <span className="font-medium text-gray-700">LkSG-Compliance</span>
                                    <span className="text-gray-500">{urgentActions} Sofortmaßnahmen</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full ${getComplianceColor(complianceScore)}`}
                                        style={{ width: `${complianceScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Tasks, Quick Wins, and Messages */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3">Aufgaben</h2>
                                <div className="space-y-3">
                                    {tasks.length > 0 ? tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`p-3 border rounded-lg ${getPriorityStyles(task.priority)} flex justify-between items-center`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getPriorityIndicator(task.priority)}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                                    <p className="text-xs text-gray-500">Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTaskAction(task.action, task.id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                                            >
                                                Erledigen
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500">Keine Aufgaben vorhanden.</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/tasks')}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Alle Aufgaben anzeigen
                                </button>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Wins</h2>
                                <div className="space-y-3">
                                    {quickWins.length > 0 ? quickWins.map((win) => (
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
                                    )) : (
                                        <p className="text-sm text-gray-500">Keine Quick Wins vorhanden.</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/quick-wins')}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Alle Quick Wins anzeigen
                                </button>
                            </div>
                            <MessagesList user={user} />
                        </div>

                        {/* Risk Trend Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Risikotrend</h2>
                            <div className="h-64">
                                <Line
                                    data={lineChartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                title: { display: true, text: 'Risikoscore' },
                                            },
                                            x: {
                                                title: { display: true, text: 'Monat' },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Supplier List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div className="flex justify-between items-center p-5 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-800">Lieferanten</h2>
                                <button
                                    onClick={() => setShowAddSupplier(!showAddSupplier)}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {showAddSupplier ? 'Schließen' : 'Lieferant hinzufügen'}
                                    {showAddSupplier ? <MinusCircle size={16} /> : <PlusCircle size={16} />}
                                </button>
                            </div>
                            {showAddSupplier && (
                                <div className="p-5 bg-gray-50">
                                    <AddSupplierForm
                                        newSupplier={newSupplier}
                                        setNewSupplier={setNewSupplier}
                                        user={user}
                                        fetchSuppliers={fetchSuppliers}
                                        setShowAddSupplier={setShowAddSupplier}
                                        setSuccessMessage={setSuccessMessage}
                                        setErrorMessage={setErrorMessage}
                                    />
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Lieferant suchen..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={riskFilter}
                                            onChange={(e) => setRiskFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="Alle">Alle Risiken</option>
                                            <option value="Hoch">Hoch</option>
                                            <option value="Mittel">Mittel</option>
                                            <option value="Niedrig">Niedrig</option>
                                        </select>
                                        <select
                                            value={industryFilter}
                                            onChange={(e) => setIndustryFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="Alle">Alle Branchen</option>
                                            <option value="Elektronik">Elektronik</option>
                                            <option value="Textil">Textil</option>
                                            <option value="Lebensmittel">Lebensmittel</option>
                                            <option value="Automotive">Automotive</option>
                                        </select>
                                        <button
                                            onClick={handleExportSuppliersCSV}
                                            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                        >
                                            <Download size={16} />
                                            CSV
                                        </button>
                                    </div>
                                </div>
                                <SupplierList
                                    suppliers={suppliers}
                                    filteredSuppliers={filteredSuppliers}
                                    isAdmin={isAdmin}
                                    user={user}
                                    fetchSuppliers={fetchSuppliers}
                                    setSelectedSupplier={setSelectedSupplier}
                                />
                            </div>
                        </div>

                        {/* Admin Sections */}
                        {isAdmin && (
                            <div className="mb-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Audit-Log</h2>
                                    <AuditLog
                                        auditLogs={auditLogs}
                                        logActionFilter={logActionFilter}
                                        setLogActionFilter={setLogActionFilter}
                                        logUserFilter={logUserFilter}
                                        setLogUserFilter={setLogUserFilter}
                                        handleAuditLogCSVExport={handleAuditLogCSVExport}
                                        handleAuditLogPDFExport={handleAuditLogPDFExport}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reporting */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Berichte</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">LKG-Berichte</h3>
                                    <p className="text-xs text-gray-500">Berichte gemäß Lieferkettengesetz erstellen.</p>
                                    <div className="mt-2">
                                        <button
                                            onClick={handleExportLKGReportPDF}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            <FileText size={16} />
                                            PDF
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Compliance</h3>
                                    <div className="mt-2 grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-xs font-medium text-green-700">Konform</p>
                                            <p className="text-lg font-bold text-gray-800">{konformPercentage}%</p>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg">
                                            <p className="text-xs font-medium text-red-700">Nicht konform</p>
                                            <p className="text-lg font-bold text-gray-800">{nichtKonformPercentage}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Training & Knowledge Base */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Schulungen & Wissen</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Schulungen</h3>
                                    <p className="text-xs text-gray-500">Schulungen für Teams und Lieferanten.</p>
                                    <button
                                        onClick={() => navigate('/training')}
                                        className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        Schulungsplan
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Wissensdatenbank</h3>
                                    <p className="text-xs text-gray-500">Gesetzliche Anforderungen und Best Practices.</p>
                                    <button
                                        onClick={() => navigate('/knowledge-base')}
                                        className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                    >
                                        Durchsuchen
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Success and Error Messages */}
                        {successMessage && (
                            <div
                                ref={popupRef}
                                className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                {successMessage}
                            </div>
                        )}
                        {errorMessage && (
                            <div
                                className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
                            >
                                <AlertCircle size={16} className="mr-2" />
                                {errorMessage}
                            </div>
                        )}

                        {/* Modal */}
                        {selectedSupplier && (
                            <SupplierDetailsModal
                                selectedSupplier={selectedSupplier}
                                setSelectedSupplier={setSelectedSupplier}
                                fileUpload={fileUpload}
                                setFileUpload={setFileUpload}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Custom Animation Keyframes */}
            <style>{`
        @keyframes slideDown {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}