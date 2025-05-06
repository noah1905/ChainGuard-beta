import { useState, useEffect, useRef } from 'react';
import { X, Upload, Calendar, Clock, AlertTriangle, Check, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../client.js';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function SupplierDetailsModal({
    selectedSupplier,
    setSelectedSupplier,
    fileUpload,
    setFileUpload
}) {
    const [activeTab, setActiveTab] = useState('details');
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [documentType, setDocumentType] = useState('selbstauskunft');
    const [documentName, setDocumentName] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [documentNote, setDocumentNote] = useState('');
    const [шоуNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    const [riskAssessment, setRiskAssessment] = useState({
        humanRights: { score: 0, note: '' },
        environmental: { score: 0, note: '' },
        safety: { score: 0, note: '' },
        corruption: { score: 0, note: '' }
    });
    const [measures, setMeasures] = useState([]);
    const [newMeasure, setNewMeasure] = useState({
        type: 'preventive',
        description: '',
        deadline: '',
        responsible: ''
    });
    const [audits, setAudits] = useState([]);
    const [newAudit, setNewAudit] = useState({
        date: '',
        checklist: '',
        findings: ''
    });
    const [communication, setCommunication] = useState([]);
    const [newCommunication, setNewCommunication] = useState({
        type: 'document_request',
        message: '',
        date: ''
    });
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    const documentTypes = [
        { id: 'selbstauskunft', name: 'Selbstauskunft' },
        { id: 'zertifikat', name: 'Zertifikat' },
        { id: 'audit', name: 'Audit/Prüfbericht' },
        { id: 'nachweis', name: 'Compliance-Nachweis' },
        { id: 'vertrag', name: 'Vertrag' },
        { id: 'sonstiges', name: 'Sonstiges' }
    ];

    const measureTemplates = [
        { id: 'training', name: 'Schulung für Mitarbeiter' },
        { id: 'policy_update', name: 'Aktualisierung der Richtlinien' },
        { id: 'supplier_audit', name: 'Lieferantenprüfung' },
        { id: 'contract_amendment', name: 'Vertragsänderung' }
    ];

    useEffect(() => {
        if (selectedSupplier) {
            fetchDocuments();
            fetchRiskAssessment();
            fetchMeasures();
            fetchAudits();
            fetchCommunication();
        }

        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setSelectedSupplier(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedSupplier]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('supplier_documents')
                .select('*')
                .eq('supplier_id', selectedSupplier.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Fehler beim Laden der Dokumente:', error);
        }
    };

    const fetchRiskAssessment = async () => {
        try {
            const { data, error } = await supabase
                .from('risk_assessments')
                .select('*')
                .eq('supplier_id', selectedSupplier.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setRiskAssessment(data || {
                humanRights: { score: 0, note: '' },
                environmental: { score: 0, note: '' },
                safety: { score: 0, note: '' },
                corruption: { score: 0, note: '' }
            });
        } catch (error) {
            console.error('Fehler beim Laden der Risikoanalyse:', error);
        }
    };

    const fetchMeasures = async () => {
        try {
            const { data, error } = await supabase
                .from('measures')
                .select('*')
                .eq('supplier_id', selectedSupplier.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMeasures(data || []);
        } catch (error) {
            console.error('Fehler beim Laden der Maßnahmen:', error);
        }
    };

    const fetchAudits = async () => {
        try {
            const { data, error } = await supabase
                .from('audits')
                .select('*')
                .eq('supplier_id', selectedSupplier.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setAudits(data || []);
        } catch (error) {
            console.error('Fehler beim Laden der Audits:', error);
        }
    };

    const fetchCommunication = async () => {
        try {
            const { data, error } = await supabase
                .from('communications')
                .select('*')
                .eq('supplier_id', selectedSupplier.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setCommunication(data || []);
        } catch (error) {
            console.error('Fehler beim Laden der Kommunikation:', error);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('Die Datei ist zu groß (max. 10MB)');
                return;
            }

            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!allowedTypes.includes(file.type)) {
                setUploadError('Nicht unterstütztes Dateiformat. Erlaubt sind PDF, JPG, PNG, DOC, DOCX, XLS, XLSX');
                return;
            }

            setFileUpload(file);
            setDocumentName(file.name);
            setUploadError('');
        }
    };

    const uploadDocument = async () => {
        if (!fileUpload) {
            setUploadError('Bitte wählen Sie eine Datei aus');
            return;
        }

        if (!documentType) {
            setUploadError('Bitte wählen Sie einen Dokumenttyp');
            return;
        }

        try {
            setIsUploading(true);

            const fileExt = fileUpload.name.split('.').pop();
            const fileName = `${selectedSupplier.id}_${Date.now()}.${fileExt}`;
            const filePath = `supplier_documents/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, fileUpload);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from('supplier_documents').insert([
                {
                    supplier_id: selectedSupplier.id,
                    file_path: filePath,
                    document_type: documentType,
                    document_name: documentName || fileUpload.name,
                    valid_until: validUntil || null,
                    note: documentNote,
                    version: 1,
                    created_at: new Date()
                }
            ]);

            if (dbError) throw dbError;

            setFileUpload(null);
            setDocumentName('');
            setDocumentType('selbstauskunft');
            setValidUntil('');
            setDocumentNote('');
            if (fileInputRef.current) fileInputRef.current.value = '';

            fetchDocuments();
            showNotificationMessage('Dokument erfolgreich hochgeladen', 'success');

        } catch (error) {
            console.error('Fehler beim Hochladen:', error);
            setUploadError('Fehler beim Hochladen: ' + error.message);
            showNotificationMessage('Fehler beim Hochladen', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadDocument = async (document) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .download(document.file_path);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;


            a.download = document.document_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Fehler beim Download:', error);
            showNotificationMessage('Fehler beim Download', 'error');
        }
    };

    const updateDocumentValidity = async (documentId, newDate) => {
        try {
            const { error } = await supabase
                .from('supplier_documents')
                .update({ valid_until: newDate })
                .eq('id', documentId);

            if (error) throw error;

            fetchDocuments();
            showNotificationMessage('Gültigkeitsdatum aktualisiert', 'success');
        } catch (error) {
            console.error('Fehler beim Aktualisieren:', error);
            showNotificationMessage('Fehler beim Aktualisieren', 'error');
        }
    };

    const uploadNewVersion = async (document, file) => {
        try {
            setIsUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedSupplier.id}_${Date.now()}.${fileExt}`;
            const filePath = `supplier_documents/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from('supplier_documents').insert([
                {
                    supplier_id: selectedSupplier.id,
                    file_path: filePath,
                    document_type: document.document_type,
                    document_name: document.document_name,
                    valid_until: document.valid_until,
                    note: document.note,
                    version: document.version + 1,
                    previous_version_id: document.id,
                    created_at: new Date()
                }
            ]);

            if (dbError) throw dbError;

            fetchDocuments();
            showNotificationMessage('Neue Version hochgeladen', 'success');

        } catch (error) {
            console.error('Fehler beim Hochladen der neuen Version:', error);
            showNotificationMessage('Fehler beim Hochladen der neuen Version', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const saveRiskAssessment = async () => {
        try {
            const { error } = await supabase
                .from('risk_assessments')
                .upsert([
                    {
                        supplier_id: selectedSupplier.id,
                        humanRights: riskAssessment.humanRights,
                        environmental: riskAssessment.environmental,
                        safety: riskAssessment.safety,
                        corruption: riskAssessment.corruption
                    }
                ]);

            if (error) throw error;
            showNotificationMessage('Risikoanalyse gespeichert', 'success');
        } catch (error) {
            console.error('Fehler beim Speichern der Risikoanalyse:', error);
            showNotificationMessage('Fehler beim Speichern', 'error');
        }
    };

    const addMeasure = async () => {
        try {
            const { error } = await supabase
                .from('measures')
                .insert([
                    {
                        supplier_id: selectedSupplier.id,
                        type: newMeasure.type,
                        description: newMeasure.description,
                        deadline: newMeasure.deadline,
                        responsible: newMeasure.responsible,
                        status: 'open',
                        created_at: new Date()
                    }
                ]);

            if (error) throw error;

            fetchMeasures();
            setNewMeasure({ type: 'preventive', description: '', deadline: '', responsible: '' });
            showNotificationMessage('Maßnahme hinzugefügt', 'success');
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Maßnahme:', error);
            showNotificationMessage('Fehler beim Hinzufügen', 'error');
        }
    };

    const addAudit = async () => {
        try {
            const { error } = await supabase
                .from('audits')
                .insert([
                    {
                        supplier_id: selectedSupplier.id,
                        date: newAudit.date,
                        checklist: newAudit.checklist,
                        findings: newAudit.findings,
                        created_at: new Date()
                    }
                ]);

            if (error) throw error;

            fetchAudits();
            setNewAudit({ date: '', checklist: '', findings: '' });
            showNotificationMessage('Audit hinzugefügt', 'success');
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Audits:', error);
            showNotificationMessage('Fehler beim Hinzufügen', 'error');
        }
    };

    const addCommunication = async () => {
        try {
            const { error } = await supabase
                .from('communications')
                .insert([
                    {
                        supplier_id: selectedSupplier.id,
                        type: newCommunication.type,
                        message: newCommunication.message,
                        date: newCommunication.date || new Date().toISOString(),
                        status: 'sent'
                    }
                ]);

            if (error) throw error;

            fetchCommunication();
            setNewCommunication({ type: 'document_request', message: '', date: '' });
            showNotificationMessage('Kommunikation gesendet', 'success');
        } catch (error) {
            console.error('Fehler beim Senden der Kommunikation:', error);
            showNotificationMessage('Fehler beim Senden', 'error');
        }
    };

    const showNotificationMessage = (message, type = 'success') => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const isExpiringStatus = (validDate) => {
        if (!validDate) return false;
        const today = new Date();
        const expiryDate = new Date(validDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 60 && diffDays > 0;
    };

    const isExpiredStatus = (validDate) => {
        if (!validDate) return false;
        const today = new Date();
        const expiryDate = new Date(validDate);
        return expiryDate < today;
    };

    const getDocumentStatus = (document) => {
        if (isExpiredStatus(document.valid_until)) {
            return { text: 'Abgelaufen', color: 'text-red-600 bg-red-50 border-red-200' };
        } else if (isExpiringStatus(document.valid_until)) {
            return { text: 'Läuft bald ab', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
        } else if (document.valid_until) {
            return { text: 'Gültig', color: 'text-green-600 bg-green-50 border-green-200' };
        } else {
            return { text: 'Unbefristet', color: 'text-blue-600 bg-blue-50 border-blue-200' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
        } catch (e) {
            return dateString;
        }
    };

    const getLatestVersionDocuments = () => {
        const groupedDocs = {};
        documents.forEach(doc => {
            const key = `${doc.document_type}-${doc.document_name}`;
            if (!groupedDocs[key] || new Date(doc.created_at) > new Date(groupedDocs[key].created_at)) {
                groupedDocs[key] = doc;
            }
        });

        return Object.values(groupedDocs);
    };

    const getDocumentVersionHistory = (documentName, documentType) => {
        return documents
            .filter(doc => doc.document_name === documentName && doc.document_type === documentType)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    };

    const getDocumentTypeLabel = (typeId) => {
        const docType = documentTypes.find(t => t.id === typeId);
        return docType ? docType.name : typeId;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative animate-fadeIn"
            >
                {/* Header mit Schließen-Button */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {selectedSupplier.name}
                        <span className={`ml-2 text-xs px-2 py-0.5 Rounded-full ${selectedSupplier.risk_level === 'Hoch' ? 'bg-red-100 text-red-700' :
                            selectedSupplier.risk_level === 'Mittel' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>{selectedSupplier.risk_level}</span>
                    </h2>
                    <button
                        onClick={() => setSelectedSupplier(null)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <div className="flex px-6 overflow-x-auto">
                        {[
                            { id: 'details', label: 'Lieferantendetails' },
                            { id: 'documents', label: 'Dokumente', badge: documents.length },
                            { id: 'risk', label: 'Risikoanalyse' },
                            { id: 'measures', label: 'Maßnahmen', badge: measures.length },
                            { id: 'audits', label: 'Audits', badge: audits.length },
                            { id: 'communication', label: 'Kommunikation', badge: communication.length },
                            { id: 'diligence', label: 'Sorgfaltspflichten' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-4 border-b-2 text-sm font-medium flex items-center gap-1 whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 rounded-full">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                                <p className="text-gray-900">{selectedSupplier.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Land</h3>
                                <p className="text-gray-900">{selectedSupplier.country}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Branche</h3>
                                <p className="text-gray-900">{selectedSupplier.industry}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Risikostufe</h3>
                                <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedSupplier.risk_level === 'Hoch' ? 'bg-red-100 text-red-800' :
                                    selectedSupplier.risk_level === 'Mittel' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    {selectedSupplier.risk_level}
                                </p>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-500 mb-1">LKG-relevante Informationen</h3>
                                <p className="text-gray-900">{selectedSupplier.note || 'Keine Informationen vorhanden'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <>
                            {/* Dokument-Upload-Bereich */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Neues Dokument hochladen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Dokument auswählen
                                        </label>
                                        <div className="flex items-center">
                                            <label className="flex-1 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg text-sm text-center hover:bg-gray-50">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <span className="flex items-center justify-center gap-2">
                                                    <Upload size={16} />
                                                    {fileUpload ? fileUpload.name : 'Datei auswählen'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Dokumenttyp
                                        </label>
                                        <select
                                            value={documentType}
                                            onChange={(e) => setDocumentType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {documentTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Dokumentname
                                        </label>
                                        <input
                                            type="text"
                                            value={documentName}
                                            onChange={(e) => setDocumentName(e.target.value)}
                                            placeholder="Dokumentname"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Gültig bis (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Notiz (optional)
                                        </label>
                                        <textarea
                                            value={documentNote}
                                            onChange={(e) => setDocumentNote(e.target.value)}
                                            placeholder="Zusätzliche Informationen zum Dokument"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows="2"
                                        ></textarea>
                                    </div>
                                </div>

                                {uploadError && (
                                    <div className="mt-2 text-sm text-red-600">
                                        <AlertCircle size={12} className="inline mr-1" /> {uploadError}
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={uploadDocument}
                                        disabled={isUploading || !fileUpload}
                                        className={`px-4 py-2 rounded-lg text-white font-medium ${isUploading || !fileUpload
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            } flex items-center gap-2`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Hochladen...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Dokument hochladen
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Dokumentenliste */}
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Dokumentenübersicht</h3>
                            {getLatestVersionDocuments().length > 0 ? (
                                <div className="space-y-4">
                                    {getLatestVersionDocuments().map((document) => {
                                        const status = getDocumentStatus(document);
                                        const versionHistory = getDocumentVersionHistory(document.document_name, document.document_type);
                                        const hasMultipleVersions = versionHistory.length > 1;

                                        return (
                                            <div key={document.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                {/* Dokument Header */}
                                                <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={18} className="text-blue-600" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{document.document_name}</h4>
                                                            <p className="text-xs text-gray-500">
                                                                {getDocumentTypeLabel(document.document_type)} • Version {document.version}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${status.color}`}>
                                                            {status.text}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Dokument Details */}
                                                <div className="p-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                Hochgeladen am:
                                                            </p>
                                                            <p className="text-sm text-gray-900">{formatDate(document.created_at)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                Gültig bis:
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-gray-900">
                                                                    {formatDate(document.valid_until)}
                                                                </p>
                                                                <button
                                                                    onClick={() => {
                                                                        const newDate = prompt(
                                                                            'Neues Gültigkeitsdatum (YYYY-MM-DD):',
                                                                            document.valid_until || ''
                                                                        );
                                                                        if (newDate) {
                                                                            updateDocumentValidity(document.id, newDate);
                                                                        }
                                                                    }}
                                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                                >
                                                                    Ändern
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {document.note && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500">Notiz:</p>
                                                            <p className="text-sm text-gray-900">{document.note}</p>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div>
                                                            {hasMultipleVersions && (
                                                                <details className="text-xs">
                                                                    <summary className="text-blue-600 cursor-pointer">
                                                                        Alle Versionen ({versionHistory.length})
                                                                    </summary>
                                                                    <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
                                                                        {versionHistory.map((version, index) => (
                                                                            <div key={version.id} className="flex items-center gap-2">
                                                                                <span>V{version.version}</span>
                                                                                <span className="text-gray-500">{formatDate(version.created_at)}</span>
                                                                                <button
                                                                                    onClick={() => downloadDocument(version)}
                                                                                    className="text-blue-600 hover:underline"
                                                                                >
                                                                                    Download
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="file"
                                                                id={`new-version-${document.id}`}
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        uploadNewVersion(document, file);
                                                                        e.target.value = null;
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`new-version-${document.id}`}
                                                                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 cursor-pointer"
                                                            >
                                                                Neue Version
                                                            </label>

                                                            <button
                                                                onClick={() => downloadDocument(document)}
                                                                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Warnungen für ablaufende Dokumente */}
                                                {isExpiringStatus(document.valid_until) && (
                                                    <div className="px-3 py-2 bg-yellow-50 text-yellow-700 border-t border-yellow-200 text-xs flex items-center gap-2">
                                                        <AlertTriangle size={14} />
                                                        Dieses Dokument läuft in weniger als 60 Tagen ab. Bitte planen Sie rechtzeitig die Erneuerung.
                                                    </div>
                                                )}

                                                {isExpiredStatus(document.valid_until) && (
                                                    <div className="px-3 py-2 bg-red-50 text-red-700 border-t border-red-200 text-xs flex items-center gap-2">
                                                        <AlertTriangle size={14} />
                                                        Dieses Dokument ist abgelaufen. Bitte laden Sie eine neue Version hoch.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Keine Dokumente vorhanden.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}