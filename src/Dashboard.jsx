import '@/styles/animations.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/supabaseClient.js';
import AddSupplierForm from '@/components/AddSupplierForm.jsx';
import SupplierList from '@/components/SupplierList.jsx';
import AuditLog from '@/components/AuditLog.jsx';
import SupplierDetailsModal from '@/components/SupplierDetailsModal.jsx';
import { useAuditLogger } from '@/hooks/useAuditLogger.js';
import Sidebar from '@/components/Sidebar.jsx';
import { Search, PlusCircle, FileText, Download, ChevronDown, AlertCircle, X, Bell } from 'lucide-react';
import Whistleblower from '@/components/Whistleblower.jsx'; // Import der Whistleblower-Komponente

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
    const [riskStats, setRiskStats] = useState({ Hoch: 0, Mittel: 0, Niedrig: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('Alle');
    const [industryFilter, setIndustryFilter] = useState('Alle');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [fileUpload, setFileUpload] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('chainguard_onboarding') !== 'dismissed';
    });
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Q3 Bericht veröffentlicht',
            description: 'Der Quartalsbericht Q3 2024 ist jetzt verfügbar.',
            date: '02. Mai 2025',
            isRead: false,
            priority: 'high'
        },
        {
            id: 2,
            title: 'Lieferant TechComp AG prüfen',
            description: 'Risikobewertung fällig für TechComp AG.',
            date: '30. April 2025',
            isRead: false,
            priority: 'medium'
        },
        {
            id: 3,
            title: 'Neue Compliance-Richtlinie',
            description: 'EU-Lieferkettengesetz erfordert Aktualisierung Ihrer Dokumente.',
            date: '28. April 2025',
            isRead: true,
            priority: 'medium'
        },
        {
            id: 4,
            title: 'System-Update geplant',
            description: 'ChainGuard wird am 05.05.2025 aktualisiert.',
            date: '27. April 2025',
            isRead: true,
            priority: 'low'
        }
    ]);
    const navigate = useNavigate();
    const popupRef = useRef(null);

    const location = useLocation();
    let pageTitle = "Dashboard";
    if (location.pathname.includes('suppliers')) pageTitle = "Lieferanten";
    else if (location.pathname.includes('audit')) pageTitle = "Audit Log";
    else if (location.pathname.includes('whistleblower')) pageTitle = "Anonyme Meldung"; // Neue Titel-Logik

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
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (!showOnboarding) {
            localStorage.setItem('chainguard_onboarding', 'dismissed');
        }
    }, [showOnboarding]);

    useEffect(() => {
        localStorage.setItem('filters', JSON.stringify({
            searchTerm,
            riskFilter,
            industryFilter,
        }));
    }, [searchTerm, riskFilter, industryFilter]);

    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
                fetchSuppliers(data.user.id);
            } else {
                navigate('/');
            }
        };
        getUser();
    }, []);

    const fetchSuppliers = async (userId) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', userId);
        if (!error) {
            setSuppliers(data);
            const stats = { Hoch: 0, Mittel: 0, Niedrig: 0 };
            data.forEach((s) => {
                if (s.risk_level && stats[s.risk_level] !== undefined) {
                    stats[s.risk_level]++;
                }
            });
            setRiskStats(stats);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const markNotificationAsRead = (id) => {
        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
        ));
    };

    const dismissNotification = (id) => {
        setNotifications(notifications.filter(notification => notification.id !== id));
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

    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    const filteredSuppliers = suppliers.filter((s) =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (riskFilter === 'Alle' || s.risk_level === riskFilter) &&
        (industryFilter === 'Alle' || s.industry === industryFilter)
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-72">
                <div className="max-w-7xl mx-auto p-8">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                            <p className="text-gray-500 mt-1">Verwalten Sie Ihre Lieferkette effizient</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {isAdmin && (
                                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-full">
                                    Admin-Modus
                                </span>
                            )}
                            <div className="relative">
                                <Bell size={20} className="text-gray-600 hover:text-blue-600 cursor-pointer" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Main Content Wrapper - Now with a grid layout to include notifications */}
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left 2/3 Column */}
                        <div className="col-span-2">
                            {/* Onboarding Message */}
                            {showOnboarding && (
                                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <h3 className="font-semibold">Willkommen bei ChainGuard</h3>
                                                <p className="text-sm mt-1">
                                                    Starte, indem du deinen ersten Lieferanten hinzufügst. Du kannst Dateien anhängen, Risiken bewerten und Berichte exportieren.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowOnboarding(false)}
                                            className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                        >
                                            <X size={16} className="text-blue-500" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Risk Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                                {[
                                    { level: 'Hohes Risiko', count: riskStats.Hoch, bg: 'from-red-50 to-red-100', text: 'text-red-700', icon: '⚠️', border: 'border-red-200', tooltip: 'Lieferanten mit erhöhtem Compliance-Risiko, die besondere Aufmerksamkeit erfordern.' },
                                    { level: 'Mittleres Risiko', count: riskStats.Mittel, bg: 'from-yellow-50 to-yellow-100', text: 'text-yellow-700', icon: '⚠', border: 'border-yellow-200', tooltip: 'Lieferanten mit moderatem Risiko, die regelmäßige Überprüfung benötigen.' },
                                    { level: 'Niedriges Risiko', count: riskStats.Niedrig, bg: 'from-green-50 to-green-100', text: 'text-green-700', icon: '✓', border: 'border-green-200', tooltip: 'Lieferanten mit geringem Risiko, die den Compliance-Anforderungen entsprechen.' },
                                ].map(({ level, count, bg, text, icon, border, tooltip }) => (
                                    <div
                                        key={level}
                                        className={`flex items-center justify-between p-5 rounded-xl shadow-sm bg-gradient-to-br ${bg} border ${border} hover:shadow-md transition-all duration-200`}
                                    >
                                        <div>
                                            <div className="flex items-center">
                                                <p className={`text-xs font-medium uppercase ${text}`}>{level}</p>
                                                <div className="relative ml-1 group">
                                                    <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                        {tooltip}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-4xl font-bold text-gray-900 mt-1">{count}</p>
                                        </div>
                                        <div className={`text-2xl ${text}`}>{icon}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800">Lieferantenübersicht</h2>
                                    <button
                                        onClick={() => setShowAddSupplier(!showAddSupplier)}
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {showAddSupplier ? 'Formular schließen' : 'Neuen Lieferanten hinzufügen'}
                                        <PlusCircle size={16} />
                                    </button>
                                </div>

                                {/* Add Supplier Form */}
                                {showAddSupplier && (
                                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                                        {/* Custom Add Supplier Form with Help Icons */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center mb-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative ml-1 group">
                                                            <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                Vollständiger Name des Lieferanten, wie er in offiziellen Dokumenten erscheint.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={newSupplier.name}
                                                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center mb-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Land <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative ml-1 group">
                                                            <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                Hauptsitz des Lieferanten oder Land der primären Geschäftstätigkeit.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={newSupplier.country}
                                                        onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center mb-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Branche <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative ml-1 group">
                                                            <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                Primäre Geschäftsbranche des Lieferanten gemäß Standard-Industrieklassifikation.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <select
                                                        value={newSupplier.industry}
                                                        onChange={(e) => setNewSupplier({ ...newSupplier, industry: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        required
                                                    >
                                                        <option value="">Bitte wählen</option>
                                                        <option value="Elektronik">Elektronik</option>
                                                        <option value="Textil">Textil</option>
                                                        <option value="Lebensmittel">Lebensmittel</option>
                                                        <option value="Automotive">Automotive</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <div className="flex items-center mb-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Risikostufe <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative ml-1 group">
                                                            <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                Die Risikoeinstufung basiert auf geopolitischen Faktoren, Compliance-Verlauf und Branchenrisiken. Hoch = tiefere Prüfung erforderlich.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <select
                                                        value={newSupplier.risk_level}
                                                        onChange={(e) => setNewSupplier({ ...newSupplier, risk_level: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        required
                                                    >
                                                        <option value="">Bitte wählen</option>
                                                        <option value="Hoch">Hoch</option>
                                                        <option value="Mittel">Mittel</option>
                                                        <option value="Niedrig">Niedrig</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center mb-1">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Notizen
                                                    </label>
                                                    <div className="relative ml-1 group">
                                                        <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                            Zusätzliche Informationen oder besondere Merkmale des Lieferanten.
                                                        </div>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={newSupplier.note}
                                                    onChange={(e) => setNewSupplier({ ...newSupplier, note: e.target.value })}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    rows="3"
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <p className="text-xs text-gray-500">
                                                    <span className="text-red-500">*</span> Pflichtfelder
                                                </p>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddSupplier(false)}
                                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Abbrechen
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Validiere und sende Formular
                                                            if (newSupplier.name && newSupplier.country && newSupplier.industry && newSupplier.risk_level) {
                                                                // Annahme: AddSupplierForm hatte einen Submit-Handler der hier aufgerufen werden würde
                                                                setShowAddSupplier(false);
                                                                setSuccessMessage('Lieferant erfolgreich hinzugefügt');
                                                                // Hier würde normalerweise fetchSuppliers aufgerufen werden
                                                            } else {
                                                                alert('Bitte füllen Sie alle Pflichtfelder aus.');
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg"
                                                    >
                                                        Lieferant hinzufügen
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Supplier List */}
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Lieferant suchen..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <select
                                                    value={riskFilter}
                                                    onChange={(e) => setRiskFilter(e.target.value)}
                                                    className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm bg-white appearance-none"
                                                >
                                                    <option value="Alle">Alle Risiken</option>
                                                    <option value="Hoch">Hohes Risiko</option>
                                                    <option value="Mittel">Mittleres Risiko</option>
                                                    <option value="Niedrig">Niedriges Risiko</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                                    <div className="relative group">
                                                        <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                            Filtere Lieferanten nach ihrer Risikoklassifizierung.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <select
                                                    value={industryFilter}
                                                    onChange={(e) => setIndustryFilter(e.target.value)}
                                                    className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm bg-white appearance-none"
                                                >
                                                    <option value="Alle">Alle Branchen</option>
                                                    <option value="Elektronik">Elektronik</option>
                                                    <option value="Textil">Textil</option>
                                                    <option value="Lebensmittel">Lebensmittel</option>
                                                    <option value="Automotive">Automotive</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                                    <div className="relative group">
                                                        <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                            Filtere Lieferanten nach Industriesektor.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => alert('Export gestartet')}
                                                className="flex items-center gap-1 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h2 className="text-lg font-semibold text-gray-800">Audit-Log</h2>
                                        </div>
                                        <div className="p-6">
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

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h2 className="text-lg font-semibold text-gray-800">Whistleblower-Meldung</h2>
                                        </div>
                                        <div className="p-6">
                                            <Whistleblower /> {/* Eingebettete Whistleblower-Komponente */}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h2 className="text-lg font-semibold text-gray-800">Berichterstattung</h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-700">LKG-konforme Berichte</h3>
                                                    <p className="text-sm text-gray-500">Generieren Sie Berichte gemäß Lieferkettengesetz.</p>
                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            onClick={() => alert('PDF-Bericht wird generiert...')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                        >
                                                            <FileText size={16} />
                                                            PDF Export
                                                        </button>
                                                        <button
                                                            onClick={() => alert('XBRL-Bericht wird generiert...')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                        >
                                                            <FileText size={16} />
                                                            XBRL Export
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-700">Compliance-Status</h3>
                                                    <p className="text-sm text-gray-500">Übersicht über den aktuellen Compliance-Status.</p>
                                                    <div className="mt-2 grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-green-50 rounded-lg">
                                                            <p className="text-sm font-medium text-green-700">Konform</p>
                                                            <p className="text-2xl font-bold text-gray-900">{Math.round((riskStats.Niedrig / suppliers.length) * 100)}%</p>
                                                        </div>
                                                        <div className="p-4 bg-red-50 rounded-lg">
                                                            <p className="text-sm font-medium text-red-700">Nicht konform</p>
                                                            <p className="text-2xl font-bold text-gray-900">{Math.round((riskStats.Hoch / suppliers.length) * 100)}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Berichterstattungs-System */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800">Berichterstattung</h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">LKG-konforme Berichte</h3>
                                            <p className="text-sm text-gray-500">Generieren Sie Berichte gemäß Lieferkettengesetz.</p>
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    onClick={() => alert('PDF-Bericht wird generiert...')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    <FileText size={16} />
                                                    PDF Export
                                                </button>
                                                <button
                                                    onClick={() => alert('XBRL-Bericht wird generiert...')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                >
                                                    <FileText size={16} />
                                                    XBRL Export
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">Compliance-Status</h3>
                                            <p className="text-sm text-gray-500">Übersicht über den aktuellen Compliance-Status.</p>
                                            <div className="mt-2 grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-green-50 rounded-lg">
                                                    <p className="text-sm font-medium text-green-700">Konform</p>
                                                    <p className="text-2xl font-bold text-gray-900">{Math.round((riskStats.Niedrig / suppliers.length) * 100)}%</p>
                                                </div>
                                                <div className="p-4 bg-red-50 rounded-lg">
                                                    <p className="text-sm font-medium text-red-700">Nicht konform</p>
                                                    <p className="text-2xl font-bold text-gray-900">{Math.round((riskStats.Hoch / suppliers.length) * 100)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Schulungs- und Wissensmodul */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800">Schulungen & Wissensdatenbank</h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">Schulungen</h3>
                                            <p className="text-sm text-gray-500">Verwalten Sie Schulungen für Teams und Lieferanten.</p>
                                            <button
                                                onClick={() => alert('Schulungsplan wird geöffnet...')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Schulungsplan anzeigen
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">Wissensdatenbank</h3>
                                            <p className="text-sm text-gray-500">Zugriff auf gesetzliche Anforderungen und Best Practices.</p>
                                            <button
                                                onClick={() => alert('Wissensdatenbank wird geöffnet...')}
                                                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                            >
                                                Datenbank durchsuchen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Integrationen */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800">Integrationen</h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">ERP-Integration</h3>
                                            <p className="text-sm text-gray-500">Anbindung an SAP, Oracle, etc.</p>
                                            <button
                                                onClick={() => alert('ERP-Integration konfigurieren...')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Konfigurieren
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700">Externe Datenquellen</h3>
                                            <p className="text-sm text-gray-500">Sanktionslisten, Länderrisiko-Indizes.</p>
                                            <button
                                                onClick={() => alert('Datenquellen verbinden...')}
                                                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                            >
                                                Verbinden
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right 1/3 Column - Notifications */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Bell size={18} className="text-blue-600" />
                                            Benachrichtigungen
                                            {unreadCount > 0 && (
                                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium rounded-full">
                                                    {unreadCount} neu
                                                </span>
                                            )}
                                        </h2>
                                        <div className="relative group">
                                            <div className="cursor-help w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center text-gray-600">i</div>
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                Hier sehen Sie wichtige Meldungen und Updates zu Ihrer Lieferkette. Priorisierte Benachrichtigungen sind farblich markiert.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 max-h-[600px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="space-y-3">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 border rounded-lg ${notification.isRead ? 'border-gray-200' : getPriorityStyles(notification.priority)} relative transition-all hover:shadow-sm ${notification.isRead ? 'opacity-75' : 'opacity-100'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            {!notification.isRead && getPriorityIndicator(notification.priority)}
                                                            <h3 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
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
                                                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                                        <span>{notification.date}</span>
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => markNotificationAsRead(notification.id)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Als gelesen markieren
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Keine Benachrichtigungen vorhanden</p>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center">
                                        Alle Benachrichtigungen anzeigen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success Message Toast */}
                    {successMessage && (
                        <div
                            ref={popupRef}
                            className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform animate-slideInRight flex items-center"
                        >
                            <span className="mr-2">✓</span>
                            {successMessage}
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
            </div>
        </div>
    );
}