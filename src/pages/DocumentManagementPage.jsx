import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient.js';
import Sidebar from '@/components/Sidebar.jsx';
import {
    Search, Upload, FileText, AlertCircle,
    X, Bell, Calendar, Clock, Filter,
    Download, ChevronDown, AlertTriangle,
    History, CheckCircle
} from 'lucide-react';
import { format, parse, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentManagementPage() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Alle');
    const [successMessage, setSuccessMessage] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('document_management_onboarding') !== 'dismissed';
    });
    const [documents, setDocuments] = useState([
        {
            id: 1,
            name: "ISO 9001 Zertifikat - TechComp AG",
            category: "Zertifikate",
            supplier: "TechComp AG",
            expiryDate: "30.06.2025",
            daysLeft: 59,
            versions: [
                { version: 1, uploadedAt: "01.01.2024", uploadedBy: "user1@example.com", fileUrl: "#" },
                { version: 2, uploadedAt: "15.06.2024", uploadedBy: "user2@example.com", fileUrl: "#" }
            ],
            status: "active"
        },
        {
            id: 2,
            name: "Selbstauskunft - TextilPro GmbH",
            category: "Selbstauskünfte",
            supplier: "TextilPro GmbH",
            expiryDate: "15.05.2025",
            daysLeft: 13,
            versions: [
                { version: 1, uploadedAt: "10.03.2024", uploadedBy: "user1@example.com", fileUrl: "#" }
            ],
            status: "expiring_soon"
        },
        {
            id: 3,
            name: "Auditbericht 2024 - AutoParts Inc.",
            category: "Auditergebnisse",
            supplier: "AutoParts Inc.",
            expiryDate: null,
            daysLeft: null,
            versions: [
                { version: 1, uploadedAt: "20.04.2024", uploadedBy: "user3@example.com", fileUrl: "#" }
            ],
            status: "active"
        }
    ]);
    const [pendingRequests, setPendingRequests] = useState([
        {
            id: 1,
            documentName: "Umweltzertifikat - FoodCorp Ltd.",
            supplier: "FoodCorp Ltd.",
            requestedAt: "01.05.2025",
            status: "pending"
        },
        {
            id: 2,
            documentName: "Selbstauskunft Q2 - TechComp AG",
            supplier: "TechComp AG",
            requestedAt: "28.04.2025",
            status: "pending"
        }
    ]);
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Dokument läuft bald ab",
            description: "Selbstauskunft - TextilPro GmbH läuft am 15.05.2025 ab.",
            date: "15.05.2025",
            daysLeft: 13,
            isRead: false,
            priority: "high"
        },
        {
            id: 2,
            title: "Ausstehende Anfrage",
            description: "Umweltzertifikat von FoodCorp Ltd. noch nicht eingereicht.",
            date: "01.05.2025",
            daysLeft: 0,
            isRead: false,
            priority: "medium"
        }
    ]);

    const popupRef = useRef(null);

    useEffect(() => {
        if (!showOnboarding) {
            localStorage.setItem('document_management_onboarding', 'dismissed');
        }
    }, [showOnboarding]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

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
            }
        };
        getUser();
    }, []);

    const uploadDocument = async (event) => {
        const file = event.target.files[0];
        if (!file || !user) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `documents/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (uploadError) {
            setSuccessMessage('Upload fehlgeschlagen');
            return;
        }

        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        const newDocument = {
            id: documents.length + 1,
            name: file.name,
            category: categoryFilter === 'Alle' ? 'Zertifikate' : categoryFilter,
            supplier: 'Unbekannt', // Replace with actual supplier selection
            expiryDate: null,
            daysLeft: null,
            versions: [
                {
                    version: 1,
                    uploadedAt: format(new Date(), 'dd.MM.yyyy', { locale: de }),
                    uploadedBy: user.email,
                    fileUrl: urlData.publicUrl
                }
            ],
            status: 'active'
        };

        setDocuments([...documents, newDocument]);
        setSuccessMessage('Dokument hochgeladen');

        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'document_uploaded',
                details: `Uploaded document "${file.name}" to category "${newDocument.category}"`,
                created_at: new Date()
            }
        ]);
    };

    const requestDocument = () => {
        const documentName = prompt("Name des angeforderten Dokuments:");
        const supplier = prompt("Lieferant:");
        if (documentName && supplier) {
            const newRequest = {
                id: pendingRequests.length + 1,
                documentName,
                supplier,
                requestedAt: format(new Date(), 'dd.MM.yyyy', { locale: de }),
                status: 'pending'
            };
            setPendingRequests([...pendingRequests, newRequest]);
            setNotifications([
                ...notifications,
                {
                    id: notifications.length + 1,
                    title: "Neue Dokumentenanfrage",
                    description: `${documentName} von ${supplier} angefordert.`,
                    date: newRequest.requestedAt,
                    daysLeft: 0,
                    isRead: false,
                    priority: 'medium'
                }
            ]);
            setSuccessMessage('Dokumentenanfrage gesendet');
        }
    };

    const markRequestAsCompleted = async (id) => {
        setPendingRequests(pendingRequests.map(req =>
            req.id === id ? { ...req, status: 'completed' } : req
        ));
        setSuccessMessage('Anfrage als erledigt markiert');

        if (user) {
            await supabase.from('audit_logs').insert([
                {
                    user_id: user.id,
                    action: 'document_request_completed',
                    details: `Marked document request ID ${id} as completed`,
                    created_at: new Date()
                }
            ]);
        }
    };

    const markNotificationAsRead = (id) => {
        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
        ));
    };

    const dismissNotification = (id) => {
        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'expiring_soon':
                return 'border-yellow-200 bg-yellow-50';
            case 'expired':
                return 'border-red-200 bg-red-50';
            case 'active':
                return 'border-green-200 bg-green-50';
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

    const filteredDocuments = documents.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === 'Alle' || doc.category === categoryFilter)
    );

    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    const formatDate = (dateString) => {
        try {
            const parsedDate = parse(dateString, 'dd.MM.yyyy', new Date());
            return format(parsedDate, 'dd.MM.yyyy', { locale: de });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-72">
                <div className="max-w-7xl mx-auto p-8">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dokumentenverwaltung</h1>
                            <p className="text-gray-500 mt-1">Verwaltung von Nachweisdokumenten für Sorgfaltspflichten</p>
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

                    {/* Onboarding Message */}
                    {showOnboarding && (
                        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold">Willkommen zur Dokumentenverwaltung</h3>
                                        <p className="text-sm mt-1">
                                            Hier können Sie Dokumente wie Zertifikate und Auditergebnisse hochladen, versionieren und deren Ablaufdaten überwachen. Verfolgen Sie ausstehende Anfragen und erhalten Sie Warnungen bei ablaufenden Dokumenten.
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

                    {/* Document Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-medium uppercase text-green-700">Aktive Dokumente</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">{documents.filter(d => d.status === 'active').length}</p>
                            <p className="text-sm text-gray-600 mt-1">von {documents.length} Dokumenten</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-medium uppercase text-yellow-700">Bald ablaufend</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">{documents.filter(d => d.status === 'expiring_soon').length}</p>
                            <p className="text-sm text-gray-600 mt-1">innerhalb 30 Tage</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-medium uppercase text-red-700">Abgelaufen</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">{documents.filter(d => d.status === 'expired').length}</p>
                            <p className="text-sm text-gray-600 mt-1">sofortige Aktion erforderlich</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <p className="text-xs font-medium uppercase text-blue-700">Ausstehende Anfragen</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">{pendingRequests.filter(r => r.status === 'pending').length}</p>
                            <p className="text-sm text-gray-600 mt-1">offene Dokumentenanfragen</p>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left 2/3 Column - Document List */}
                        <div className="col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Dokumentenübersicht
                                    </h2>
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                            <Upload size={16} />
                                            Dokument hochladen
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={uploadDocument}
                                            />
                                        </label>
                                        <button
                                            onClick={requestDocument}
                                            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <FileText size={16} />
                                            Dokument anfordern
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Dokument suchen..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm bg-white appearance-none"
                                            >
                                                <option value="Alle">Alle Kategorien</option>
                                                <option value="Zertifikate">Zertifikate</option>
                                                <option value="Selbstauskünfte">Selbstauskünfte</option>
                                                <option value="Auditergebnisse">Auditergebnisse</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Document List */}
                                    <div className="space-y-6">
                                        {filteredDocuments.length > 0 ? (
                                            filteredDocuments.map((doc) => (
                                                <div key={doc.id} className={`border rounded-lg overflow-hidden ${getStatusStyles(doc.status)}`}>
                                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{doc.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500">{doc.category}</span>
                                                                <span className="text-xs text-gray-500">•</span>
                                                                <span className="text-xs text-gray-500">{doc.supplier}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {doc.expiryDate && (
                                                                <div className="text-right">
                                                                    <div className="text-xs text-gray-600">Ablauf: {formatDate(doc.expiryDate)}</div>
                                                                    <div className="text-xs text-gray-600">{doc.daysLeft} Tage verbleibend</div>
                                                                </div>
                                                            )}
                                                            <a
                                                                href={doc.versions[doc.versions.length - 1].fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <History size={16} className="text-gray-500" />
                                                                <span className="text-sm text-gray-700">Versionen: {doc.versions.length}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => alert(`Versionen für ${doc.name}:\n${doc.versions.map(v => `v${v.version}: ${v.uploadedAt} von ${v.uploadedBy}`).join('\n')}`)}
                                                                className="text-xs text-blue-600 hover:text-blue-800"
                                                            >
                                                                Versionsverlauf
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-gray-500">
                                                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                                <p className="text-lg font-medium">Keine Dokumente gefunden</p>
                                                <p className="mt-1">Versuchen Sie andere Suchkriterien oder Filter</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right 1/3 Column - Notifications and Pending Requests */}
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
                                    </div>
                                </div>
                                <div className="p-4 max-h-[300px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="space-y-3">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 border rounded-lg ${notification.isRead ? 'border-gray-200' : getStatusStyles(notification.priority)} relative transition-all hover:shadow-sm ${notification.isRead ? 'opacity-75' : 'opacity-100'}`}
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
                                                        <span>{formatDate(notification.date)}</span>
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
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                        <AlertTriangle size={18} className="text-yellow-600" />
                                        Ausstehende Anfragen
                                    </h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {pendingRequests.length > 0 ? (
                                            pendingRequests.map((request) => (
                                                <div
                                                    key={request.id}
                                                    className={`p-3 border rounded-lg ${request.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-75'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{request.documentName}</h4>
                                                            <p className="text-xs text-gray-600 mt-1">{request.supplier}</p>
                                                            <p className="text-xs text-gray-600 mt-1">Angefordert am: {formatDate(request.requestedAt)}</p>
                                                        </div>
                                                        {request.status === 'pending' && (
                                                            <button
                                                                onClick={() => markRequestAsCompleted(request.id)}
                                                                className="text-xs px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200"
                                                            >
                                                                Erledigt
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>Keine ausstehenden Anfragen</p>
                                            </div>
                                        )}
                                    </div>
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
                            <CheckCircle size={16} className="mr-2" />
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}