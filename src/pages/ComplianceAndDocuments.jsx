import { useEffect, useState, useRef } from 'react';
import { supabase } from '../client.js';
import Sidebar from '../components/Sidebar.jsx';
import {
    Search, Upload, FileText, AlertCircle, X, Bell, Calendar, Clock, Filter,
    Download, ChevronDown, AlertTriangle, CheckCircle, Eye, Trash2, RefreshCw,
    PlusCircle
} from 'lucide-react';
import { format, parse, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ComplianceAndDocuments() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Alle');
    const [statusFilter, setStatusFilter] = useState('Alle');
    const [supplierFilter, setSupplierFilter] = useState('Alle');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showAddDocument, setShowAddDocument] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showDocumentDetails, setShowDocumentDetails] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('compliance_docs_onboarding') !== 'dismissed';
    });
    const popupRef = useRef(null);

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
                fetchData();
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        if (!showOnboarding) {
            localStorage.setItem('compliance_docs_onboarding', 'dismissed');
        }
    }, [showOnboarding]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchData = async () => {
        const { data: catData } = await supabase.from('categories').select('name');
        setCategories(catData || ['Zertifikate', 'Selbstauskünfte', 'Auditergebnisse', 'Risikoanalysen', 'Verträge', 'Compliance-Erklärungen']);

        const { data: supData } = await supabase.from('suppliers').select('id, name');
        setSuppliers(supData || [
            { id: 1, name: 'TechComp AG' },
            { id: 2, name: 'Textile Solutions GmbH' },
            { id: 3, name: 'FoodSupply Ltd.' },
            { id: 4, name: 'AutoParts Corp.' }
        ]);

        const { data: tempData } = await supabase.from('templates').select('*');
        setTemplates(tempData || [
            { id: 1, name: 'Datenschutzerklärung', category: 'Compliance-Erklärungen', description: 'Vorlage für DSGVO-konforme Datenschutzerklärung', content: 'Hier steht der Inhalt der Datenschutzerklärung...' },
            { id: 2, name: 'AGB', category: 'Verträge', description: 'Allgemeine Geschäftsbedingungen für KMUs', content: 'Hier stehen die AGB...' }
        ]);

        const { data: docData } = await supabase.from('documents').select('*').eq('user_id', user.id);
        if (docData) {
            const processedDocs = docData.map(doc => {
                const expiryDate = doc.expiry_date ? parse(doc.expiry_date, 'yyyy-MM-dd', new Date()) : null;
                const daysLeft = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
                let status = 'Aktiv';
                if (!doc.file_url) status = 'Ausstehend';
                else if (daysLeft <= 0) status = 'Abgelaufen';
                else if (daysLeft <= 30) status = 'Läuft bald ab';
                return { ...doc, days_left: daysLeft, status, compliance_status: status === 'Abgelaufen' ? 'Nicht konform' : status === 'Läuft bald ab' ? 'Teilkonform' : 'Konform' };
            });
            setDocuments(processedDocs);

            const newNotifications = processedDocs
                .filter(doc => doc.status === 'Läuft bald ab' || doc.status === 'Abgelaufen')
                .map(doc => ({
                    id: `doc-${doc.id}`,
                    title: doc.status === 'Abgelaufen' ? 'Dokument abgelaufen' : 'Dokument läuft bald ab',
                    description: `${doc.name} (${doc.compliance_status.toLowerCase().replace('_', ' ')}).`,
                    date: doc.expiry_date || format(new Date(), 'yyyy-MM-dd'),
                    days_left: doc.days_left,
                    is_read: false,
                    priority: doc.status === 'Abgelaufen' ? 'high' : 'medium'
                }));
            setNotifications(newNotifications);
        }

        const { data: reqData } = await supabase.from('document_requests').select('*').eq('user_id', user.id);
        setPendingRequests(reqData || []);
        const reqNotifications = reqData
            ?.filter(req => req.status === 'pending')
            .map(req => ({
                id: `req-${req.id}`,
                title: 'Ausstehende Dokumentenanfrage',
                description: `${req.document_name} von ${req.supplier_name} noch nicht eingereicht.`,
                date: req.requested_at,
                days_left: 0,
                is_read: false,
                priority: 'medium'
            }));
        setNotifications(prev => [...prev, ...(reqNotifications || [])]);
    };

    const uploadDocument = async (event, formData) => {
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

        const expiryDate = formData.expiryDate ? parse(formData.expiryDate, 'yyyy-MM-dd', new Date()) : null;
        const daysLeft = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
        const status = !urlData.publicUrl ? 'Ausstehend' : daysLeft <= 30 && daysLeft > 0 ? 'Läuft bald ab' : daysLeft <= 0 ? 'Abgelaufen' : 'Aktiv';
        const complianceStatus = status === 'Abgelaufen' ? 'Nicht konform' : status === 'Läuft bald ab' ? 'Teilkonform' : 'Konform';

        const newDocument = {
            user_id: user.id,
            name: formData.docName,
            category: formData.category,
            supplier_id: formData.supplier,
            supplier_name: suppliers.find(s => s.id === parseInt(formData.supplier))?.name,
            upload_date: format(new Date(), 'yyyy-MM-dd'),
            expiry_date: formData.expiryDate || null,
            days_left: daysLeft,
            status,
            compliance_status: complianceStatus,
            version: '1.0',
            file_type: fileExt,
            file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            uploader: user.email,
            description: formData.description,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            history: [{ date: format(new Date(), 'yyyy-MM-dd'), action: 'Hochgeladen', user: user.email }],
            file_url: urlData.publicUrl
        };

        const { error: insertError } = await supabase.from('documents').insert([newDocument]);
        if (!insertError) {
            setDocuments([...documents, newDocument]);
            setSuccessMessage('Dokument hochgeladen');
            await supabase.from('audit_logs').insert([
                {
                    user_id: user.id,
                    action: 'document_uploaded',
                    details: `Uploaded document "${newDocument.name}" to category "${newDocument.category}"`,
                    created_at: new Date()
                }
            ]);
        }
    };

    const handleAddDocument = async (e) => {
        e.preventDefault();
        const formData = {
            docName: e.target.docName.value,
            category: e.target.category.value,
            supplier: e.target.supplier.value,
            expiryDate: e.target.expiryDate.value,
            description: e.target.description.value,
            tags: e.target.tags.value
        };
        await uploadDocument({ target: { files: [e.target.file.files[0]] } }, formData);
        setShowAddDocument(false);
    };

    const handleRequestDocument = async () => {
        const documentName = prompt('Name des angeforderten Dokuments:');
        const supplierId = prompt('Lieferanten-ID:');
        if (documentName && supplierId && suppliers.find(s => s.id === parseInt(supplierId))) {
            const newRequest = {
                user_id: user.id,
                document_name: documentName,
                supplier_id: parseInt(supplierId),
                supplier_name: suppliers.find(s => s.id === parseInt(supplierId)).name,
                requested_at: format(new Date(), 'yyyy-MM-dd'),
                status: 'pending'
            };
            const { error } = await supabase.from('document_requests').insert([newRequest]);
            if (!error) {
                setPendingRequests([...pendingRequests, newRequest]);
                setNotifications([
                    ...notifications,
                    {
                        id: `req-${newRequest.id}`,
                        title: 'Neue Dokumentenanfrage',
                        description: `${documentName} von ${newRequest.supplier_name} angefordert.`,
                        date: newRequest.requested_at,
                        days_left: 0,
                        is_read: false,
                        priority: 'medium'
                    }
                ]);
                setSuccessMessage('Dokumentenanfrage gesendet');

                const pendingDoc = {
                    user_id: user.id,
                    name: documentName,
                    category: 'Zertifikate',
                    supplier_id: parseInt(supplierId),
                    supplier_name: newRequest.supplier_name,
                    upload_date: newRequest.requested_at,
                    expiry_date: null,
                    days_left: null,
                    status: 'Ausstehend',
                    compliance_status: 'Nicht konform',
                    version: '0',
                    file_type: null,
                    file_size: null,
                    uploader: 'System',
                    description: `Angeforderte Dokumentation: ${documentName}`,
                    tags: ['Anfrage'],
                    history: [{ date: newRequest.requested_at, action: 'Angefordert', user: user.email }],
                    file_url: null
                };
                await supabase.from('documents').insert([pendingDoc]);
                setDocuments([...documents, pendingDoc]);
            }
        }
    };

    const handleUpdateDocument = async (id) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;

        const file = prompt('Bitte laden Sie die neue Version hoch (Simulation):');
        if (file) {
            const updatedDoc = {
                ...doc,
                version: (parseFloat(doc.version) + 0.1).toFixed(1),
                upload_date: format(new Date(), 'yyyy-MM-dd'),
                history: [
                    ...doc.history,
                    { date: format(new Date(), 'yyyy-MM-dd'), action: 'Aktualisiert', user: user.email }
                ],
                file_url: doc.file_url
            };
            const { error } = await supabase
                .from('documents')
                .update(updatedDoc)
                .eq('id', id);
            if (!error) {
                setDocuments(documents.map(d => (d.id === id ? updatedDoc : d)));
                setSuccessMessage('Dokument aktualisiert');
                await supabase.from('audit_logs').insert([
                    {
                        user_id: user.id,
                        action: 'document_updated',
                        details: `Updated document "${doc.name}" to version ${updatedDoc.version}`,
                        created_at: new Date()
                    }
                ]);
            }
        }
    };

    const handleDeleteDocument = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
            const { error } = await supabase.from('documents').delete().eq('id', id);
            if (!error) {
                setDocuments(documents.filter(doc => doc.id !== id));
                setSuccessMessage('Dokument gelöscht');
                await supabase.from('audit_logs').insert([
                    {
                        user_id: user.id,
                        action: 'document_deleted',
                        details: `Deleted document ID ${id}`,
                        created_at: new Date()
                    }
                ]);
            }
        }
    };

    const handleUseTemplate = async (e) => {
        e.preventDefault();
        const formData = {
            docName: e.target.docName.value,
            category: selectedTemplate.category,
            supplier: e.target.supplier.value,
            expiryDate: e.target.expiryDate.value,
            description: e.target.description.value,
            tags: e.target.tags.value,
            content: e.target.content.value
        };

        const newDocument = {
            user_id: user.id,
            name: formData.docName,
            category: formData.category,
            supplier_id: parseInt(formData.supplier),
            supplier_name: suppliers.find(s => s.id === parseInt(formData.supplier))?.name,
            upload_date: format(new Date(), 'yyyy-MM-dd'),
            expiry_date: formData.expiryDate || null,
            days_left: formData.expiryDate ? differenceInDays(parse(formData.expiryDate, 'yyyy-MM-dd', new Date()), new Date()) : null,
            status: 'Aktiv',
            compliance_status: 'Konform',
            version: '1.0',
            file_type: 'txt',
            file_size: '0.1 MB',
            uploader: user.email,
            description: formData.description,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            history: [{ date: format(new Date(), 'yyyy-MM-dd'), action: 'Erstellt aus Vorlage', user: user.email }],
            file_url: null
        };

        const { error: insertError } = await supabase.from('documents').insert([new AMLDocument]);
        if (!insertError) {
            setDocuments([...documents, newDocument]);
            setSuccessMessage('Dokument aus Vorlage erstellt');
            await supabase.from('audit_logs').insert([
                {
                    user_id: user.id,
                    action: 'document_created_from_template',
                    details: `Created document "${newDocument.name}" from template "${selectedTemplate.name}"`,
                    created_at: new Date()
                }
            ]);
        }
        setShowTemplateModal(false);
        setSelectedTemplate(null);
    };

    const markRequestAsCompleted = async (id) => {
        const request = pendingRequests.find(req => req.id === id);
        if (!request) return;

        const { error } = await supabase
            .from('document_requests')
            .update({ status: 'completed' })
            .eq('id', id);
        if (!error) {
            setPendingRequests(pendingRequests.map(req =>
                req.id === id ? { ...req, status: 'completed' } : req
            ));
            setSuccessMessage('Anfrage als erledigt markiert');
            await supabase.from('audit_logs').insert([
                {
                    user_id: user.id,
                    action: 'document_request_completed',
                    details: `Marked document request "${request.document_name}" as completed`,
                    created_at: new Date()
                }
            ]);
        }
    };

    const markNotificationAsRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
        ));
    };

    const dismissNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Aktiv': return 'bg-green-100 text-green-800';
            case 'Läuft bald ab': return 'bg-yellow-100 text-yellow-800';
            case 'Abgelaufen': return 'bg-red-100 text-red-800';
            case 'Ausstehend': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getComplianceStatusStyle = (complianceStatus) => {
        switch (complianceStatus) {
            case 'Konform': return 'bg-green-100 text-green-800';
            case 'Teilkonform': return 'bg-yellow-100 text-yellow-800';
            case 'Nicht konform': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
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

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesCategory = categoryFilter === 'Alle' || doc.category === categoryFilter;
        const matchesStatus = statusFilter === 'Alle' || doc.status === statusFilter;
        const matchesSupplier = supplierFilter === 'Alle' || doc.supplier_name === supplierFilter;
        return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
    });

    const sortedDocuments = [...filteredDocuments].sort((a, b) => {
        switch (sortBy) {
            case 'date_desc': return new Date(b.upload_date) - new Date(a.upload_date);
            case 'date_asc': return new Date(a.upload_date) - new Date(b.upload_date);
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            default: return 0;
        }
    });

    const statusCounts = documents.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
    }, {});

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-72">
                <div className="max-w-7xl mx-auto p-8">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Compliance & Dokumente</h1>
                            <p className="text-gray-500 mt-1">Verwaltung von Nachweisdokumenten und Compliance-Status</p>
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

                    {showOnboarding && (
                        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold">Willkommen zu Compliance & Dokumente</h3>
                                        <p className="text-sm mt-1">
                                            Verwalten Sie Dokumente, nutzen Sie Vorlagen für LKG-Anforderungen und überwachen Sie den Compliance-Status.
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

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-medium text-green-700 uppercase">Aktive Dokumente</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Aktiv'] || 0}</p>
                                </div>
                                <CheckCircle size={24} className="text-green-500" />
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-medium text-yellow-700 uppercase">Bald ablaufend</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Läuft bald ab'] || 0}</p>
                                </div>
                                <Clock size={24} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-medium text-red-700 uppercase">Abgelaufen</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Abgelaufen'] || 0}</p>
                                </div>
                                <AlertCircle size={24} className="text-red-500" />
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-medium text-blue-700 uppercase">Ausstehend</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Ausstehend'] || 0}</p>
                                </div>
                                <AlertTriangle size={24} className="text-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Vorlagenbibliothek
                                    </h2>
                                    <button
                                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                        onClick={() => setShowTemplateModal(true)}
                                    >
                                        <PlusCircle size={14} />
                                        Vorlage auswählen
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.map(template => (
                                            <div
                                                key={template.id}
                                                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                            >
                                                <h3 className="font-medium text-gray-900">{template.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                                <p className="text-xs text-gray-400 mt-2">Kategorie: {template.category}</p>
                                                <button
                                                    className="mt-3 text-sm text-blue-600 hover:underline"
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setShowTemplateModal(true);
                                                    }}
                                                >
                                                    Vorlage verwenden
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Dokumentenübersicht
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRequestDocument}
                                            className="text-sm px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                                        >
                                            <Clock size={14} />
                                            Dokument anfordern
                                        </button>
                                        <button
                                            onClick={() => setShowAddDocument(true)}
                                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <PlusCircle size={14} />
                                            Dokument hinzufügen
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 border-b border-gray-100 bg-gray-50">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Dokumente durchsuchen..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="relative">
                                                <select
                                                    value={categoryFilter}
                                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="Alle">Alle Kategorien</option>
                                                    {categories.map((category, index) => (
                                                        <option key={index} value={category}>{category}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            </div>
                                            <div className="relative">
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="Alle">Alle Status</option>
                                                    <option value="Aktiv">Aktiv</option>
                                                    <option value="Läuft bald ab">Läuft bald ab</option>
                                                    <option value="Abgelaufen">Abgelaufen</option>
                                                    <option value="Ausstehend">Ausstehend</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            </div>
                                            <div className="relative">
                                                <select
                                                    value={supplierFilter}
                                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="Alle">Alle Lieferanten</option>
                                                    {suppliers.map(supplier => (
                                                        <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            </div>
                                            <div className="relative">
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="date_desc">Neueste zuerst</option>
                                                    <option value="date_asc">Älteste zuerst</option>
                                                    <option value="name_asc">Name (A-Z)</option>
                                                    <option value="name_desc">Name (Z-A)</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <th className="px-6 py-3 text-left">Dokument</th>
                                                    <th className="px-6 py-3 text-left">Kategorie</th>
                                                    <th className="px-6 py-3 text-left">Lieferant</th>
                                                    <th className="px-6 py-3 text-left">Hochgeladen</th>
                                                    <th className="px-6 py-3 text-left">Gültig bis</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Compliance-Status</th>
                                                    <th className="px-6 py-3 text-left">Version</th>
                                                    <th className="px-6 py-3 text-center">Aktionen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {sortedDocuments.length > 0 ? (
                                                    sortedDocuments.map((doc) => (
                                                        <tr key={doc.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                                    <div className="h-10 w-10 flex-shrink-0 mr-3 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                        {doc.file_type ? (
                                                                            <FileText size={20} className="text-gray-500" />
                                                                        ) : (
                                                                            <Clock size={20} className="text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{doc.name}</div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {doc.file_type && `${doc.file_type.toUpperCase()} • ${doc.file_size}`}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {doc.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.supplier_name}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.upload_date}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {doc.expiry_date || <span className="text-gray-400">-</span>}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(doc.status)}`}>
                                                                    {doc.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatusStyle(doc.compliance_status)}`}>
                                                                    {doc.compliance_status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">v{doc.version}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex justify-center space-x-2">
                                                                    {doc.file_type && (
                                                                        <a
                                                                            href={doc.file_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-gray-500 hover:text-blue-600"
                                                                            title="Dokument ansehen"
                                                                            onClick={() => { setSelectedDoc(doc); setShowDocumentDetails(true); }}
                                                                        >
                                                                            <Eye size={18} />
                                                                        </a>
                                                                    )}
                                                                    {doc.status !== 'Ausstehend' && (
                                                                        <button
                                                                            className="text-gray-500 hover:text-green-600"
                                                                            title="Neue Version hochladen"
                                                                            onClick={() => handleUpdateDocument(doc.id)}
                                                                        >
                                                                            <RefreshCw size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className="text-gray-500 hover:text-red-600"
                                                                        title="Dokument löschen"
                                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                                            Keine Dokumente gefunden
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                                    className={`p-3 border rounded-lg ${notification.is_read ? 'border-gray-200' : getStatusBadgeStyle(notification.priority)} relative transition-all hover:shadow-sm ${notification.is_read ? 'opacity-75' : 'opacity-100'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            {!notification.is_read && getPriorityIndicator(notification.priority)}
                                                            <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
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
                                                        {!notification.is_read && (
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
                                                            <h4 className="font-medium text-gray-900">{request.document_name}</h4>
                                                            <p className="text-xs text-gray-600 mt-1">{request.supplier_name}</p>
                                                            <p className="text-xs text-gray-600 mt-1">Angefordert am: {request.requested_at}</p>
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

                    {showAddDocument && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800">Neues Dokument hinzufügen</h3>
                                    <button
                                        onClick={() => setShowAddDocument(false)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                                <form onSubmit={handleAddDocument} className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Dokumentname</label>
                                            <input
                                                type="text"
                                                name="docName"
                                                required
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="z.B. ISO 9001 Zertifikat"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Kategorie</label>
                                            <select
                                                name="category"
                                                required
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {categories.map((category, index) => (
                                                    <option key={index} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Lieferant</label>
                                            <select
                                                name="supplier"
                                                required
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {suppliers.map(supplier => (
                                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ablaufdatum (optional)</label>
                                            <input
                                                type="date"
                                                name="expiryDate"
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                                            <textarea
                                                name="description"
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows="4"
                                                placeholder="Beschreiben Sie den Inhalt des Dokuments"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tags (kommagetrennt)</label>
                                            <input
                                                type="text"
                                                name="tags"
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="z.B. Qualität, ISO, Compliance"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Datei</label>
                                            <input
                                                type="file"
                                                name="file"
                                                required
                                                accept=".pdf,.docx,.xlsx"
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddDocument(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                        >
                                            Hinzufügen
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {showTemplateModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {selectedTemplate ? `Vorlage anpassen: ${selectedTemplate.name}` : 'Vorlage auswählen'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowTemplateModal(false);
                                            setSelectedTemplate(null);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                                {selectedTemplate ? (
                                    <form onSubmit={handleUseTemplate} className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Dokumentname</label>
                                                <input
                                                    type="text"
                                                    name="docName"
                                                    defaultValue={selectedTemplate.name}
                                                    required
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Lieferant</label>
                                                <select
                                                    name="supplier"
                                                    required
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    {suppliers.map(supplier => (
                                                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Ablaufdatum (optional)</label>
                                                <input
                                                    type="date"
                                                    name="expiryDate"
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                                                <textarea
                                                    name="description"
                                                    defaultValue={selectedTemplate.description}
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows="4"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Inhalt</label>
                                                <textarea
                                                    name="content"
                                                    defaultValue={selectedTemplate.content}
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows="6"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Tags (kommagetrennt)</label>
                                                <input
                                                    type="text"
                                                    name="tags"
                                                    defaultValue="Vorlage, Compliance"
                                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowTemplateModal(false);
                                                    setSelectedTemplate(null);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                            >
                                                Abbrechen
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                            >
                                                Dokument erstellen
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {templates.map(template => (
                                                <div
                                                    key={template.id}
                                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                                >
                                                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                                    <p className="text-xs text-gray-400 mt-2">Kategorie: {template.category}</p>
                                                    <button
                                                        className="mt-3 text-sm text-blue-600 hover:underline"
                                                        onClick={() => setSelectedTemplate(template)}
                                                    >
                                                        Vorlage verwenden
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showDocumentDetails && selectedDoc && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedDoc.name}</h3>
                                    <button
                                        onClick={() => setShowDocumentDetails(false)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Kategorie</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Lieferant</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.supplier_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Hochgeladen am</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.upload_date}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Gültig bis</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.expiry_date || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(selectedDoc.status)}`}>
                                                {selectedDoc.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Compliance-Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatusStyle(selectedDoc.compliance_status)}`}>
                                                {selectedDoc.compliance_status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Dateityp</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.file_type || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Dateigröße</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.file_size || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-700">Beschreibung</p>
                                            <p className="text-sm text-gray-500">{selectedDoc.description || 'Keine Beschreibung'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-700">Tags</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDoc.tags && 入选Doc.tags.map((tag, index) => (
                                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-700">Versionsverlauf</p>
                                            <div className="mt-2 space-y-2">
                                                {selectedDoc.history.map((entry, index) => (
                                                    <div key={index} className="flex justify-between text-sm text-gray-500">
                                                        <span>{entry.action} von {entry.user}</span>
                                                        <span>{entry.date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedDoc.file_url && (
                                        <div className="mt-6">
                                            <a
                                                href={selectedDoc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                            >
                                                <Download size={16} className="mr-2" />
                                                Dokument herunterladen
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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