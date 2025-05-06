import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client.js';
import { AlertTriangle, ArrowRight, HelpCircle, ChevronDown, Settings, Loader, CheckCircle, Info, ArrowUpRight, Zap, FileText, X, File } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar.jsx';

export default function Analyse({ user }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showFactors, setShowFactors] = useState(true);
    const [showAssessment, setShowAssessment] = useState(true);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [showHierarchy, setShowHierarchy] = useState(true);
    const [showMethodology, setShowMethodology] = useState(true);
    const [supplier, setSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [history, setHistory] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSuppliers = async () => {
            console.log('Fetching suppliers for user:', user?.id);
            try {
                if (!user?.id) {
                    throw new Error('No user ID provided');
                }
                const { data, error } = await supabase
                    .from('suppliers')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .is('parent_supplier_id', null);
                console.log('Suppliers fetched:', data, 'Error:', error);
                if (error) throw error;
                setSuppliers(data || []);
                if (data?.length > 0) {
                    console.log('Setting selectedSupplierId to:', data[0].id);
                    setSelectedSupplierId(data[0].id);
                } else {
                    console.log('No suppliers found');
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                setError(error.message || 'Fehler beim Laden der Lieferanten.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchSuppliers();
        } else {
            console.log('No user ID, cannot fetch suppliers');
            setError('Benutzer nicht authentifiziert.');
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const fetchSupplierData = async () => {
            console.log('Fetching supplier data for supplier_id:', selectedSupplierId);
            if (!selectedSupplierId) {
                console.log('No selectedSupplierId, skipping fetch');
                return;
            }
            try {
                setLoading(true);
                const { data: supplierData, error: supplierError } = await supabase
                    .from('suppliers')
                    .select('id, name, country, industry, tier, risk_score, risk_level, last_updated, parent_supplier_id')
                    .eq('id', selectedSupplierId)
                    .single();
                console.log('Supplier data:', supplierData, 'Error:', supplierError);
                if (supplierError) throw supplierError;

                const { data: subSuppliers, error: subError } = await supabase
                    .from('suppliers')
                    .select('id, name, country, industry, tier, risk_score, risk_level, parent_supplier_id')
                    .eq('user_id', user.id)
                    .not('parent_supplier_id', 'is', null);
                console.log('Sub-suppliers:', subSuppliers, 'Error:', subError);
                if (subError) throw subError;

                let factorsData = null;
                const { data: fetchedFactors, error: factorsError } = await supabase
                    .from('risk_factors')
                    .select('country, industry, company, position')
                    .eq('supplier_id', supplierData.id)
                    .single();
                console.log('Risk factors:', fetchedFactors, 'Error:', factorsError);
                if (factorsError && factorsError.code !== 'PGRST116') throw factorsError;
                factorsData = fetchedFactors || { country: 7.2, industry: 6.5, company: 5.4, position: 3.8 };

                const { data: recData, error: recError } = await supabase
                    .from('recommendations')
                    .select('id, supplier_id, text, priority, effort, status')
                    .eq('supplier_id', supplierData.id);
                console.log('Recommendations:', recData, 'Error:', recError);
                if (recError) throw recError;

                const { data: historyData, error: historyError } = await supabase
                    .from('risk_history')
                    .select('risk_score, risk_level, updated_at')
                    .eq('supplier_id', supplierData.id)
                    .order('updated_at', { ascending: false });
                console.log('History:', historyData, 'Error:', historyError);
                if (historyError) throw historyError;

                const { data: docData, error: docError } = await supabase
                    .from('documents')
                    .select('id, supplier_id, file_name, file_type, uploaded_at')
                    .eq('supplier_id', supplierData.id);
                console.log('Documents:', docData, 'Error:', docError);
                if (docError) throw docError;

                const buildHierarchy = (parentId) => {
                    return (subSuppliers || [])
                        .filter(sub => sub.parent_supplier_id === parentId)
                        .map(sub => ({
                            ...sub,
                            subSuppliers: buildHierarchy(sub.id),
                        }));
                };

                const supplierWithHierarchy = {
                    ...supplierData,
                    subSuppliers: buildHierarchy(supplierData.id),
                    factors: factorsData,
                    methodology: {
                        weights: { country: 40, industry: 30, company: 20, position: 10 },
                        updateInterval: 'Monatlich',
                        description:
                            'Die Risikobewertung basiert auf einer gewichteten Analyse von Länderrisiko (40%), Branchenrisiko (30%), Unternehmensrisiko (20%) und Positionsrisiko (10%). Datenquellen umfassen globale Indizes und Lieferantendaten. Aktualisierung erfolgt monatlich.',
                    },
                };
                console.log('Setting supplier:', supplierWithHierarchy);
                setSupplier(supplierWithHierarchy);
                setRecommendations(recData || []);
                setHistory(historyData || []);
                setDocuments(docData || []);
            } catch (error) {
                console.error('Error fetching supplier data:', error);
                setError(error.message || 'Fehler beim Laden der Analyse-Daten.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id && selectedSupplierId) {
            fetchSupplierData();
        } else {
            console.log('Skipping fetchSupplierData - user.id:', user?.id, 'selectedSupplierId:', selectedSupplierId);
            setLoading(false);
        }
    }, [user, selectedSupplierId]);

    useEffect(() => {
        if (!supplier) return;
        const subscription = supabase
            .channel('recommendations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'recommendations',
                    filter: `supplier_id=eq.${supplier.id}`,
                },
                payload => {
                    setRecommendations([payload.new, ...recommendations]);
                }
            )
            .subscribe();
        return () => supabase.removeChannel(subscription);
    }, [recommendations, supplier]);

    const updateRecommendationStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('recommendations')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;
            setRecommendations(recommendations.map(rec => (rec.id === id ? { ...rec, status: newStatus } : rec)));
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Empfehlung:', error);
            setError(error.message || 'Fehler beim Aktualisieren der Empfehlung.');
        }
    };

    const exportToPDF = () => {
        if (!supplier) return;
        setIsExporting(true);
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Lieferanten-Risikobewertung', 20, 20);
        doc.setFontSize(12);
        doc.text(`Lieferant: ${supplier.name}`, 20, 30);
        doc.text(`Land: ${supplier.country}`, 20, 40);
        doc.text(`Branche: ${supplier.industry}`, 20, 50);
        doc.text(`Tier: ${supplier.tier}`, 20, 60);
        doc.text(`Risikopunktzahl: ${supplier.risk_score}/100 (${supplier.risk_level})`, 20, 70);
        doc.text(`Letzte Aktualisierung: ${new Date(supplier.last_updated).toLocaleDateString('de-DE')}`, 20, 80);
        doc.setFontSize(14);
        doc.text('Risikofaktoren', 20, 100);
        doc.setFontSize(12);
        doc.text(`Länderrisiko: ${supplier.factors.country}/10`, 20, 110);
        doc.text(`Branchenrisiko: ${supplier.factors.industry}/10`, 20, 120);
        doc.text(`Unternehmensrisiko: ${supplier.factors.company}/10`, 20, 130);
        doc.text(`Positionsrisiko: ${supplier.factors.position}/10`, 20, 140);
        doc.setFontSize(14);
        doc.text('Handlungsempfehlungen', 20, 160);
        let yPos = 170;
        recommendations.forEach((rec, index) => {
            doc.setFontSize(12);
            doc.text(`${index + 1}. ${rec.text} (${rec.priority}, ${rec.effort}) - Status: ${rec.status}`, 20, yPos);
            yPos += 10;
        });
        doc.save(`${supplier.name}_RiskAssessment.pdf`);
        setIsExporting(false);
    };

    const riskLevelColorClass = {
        Hoch: 'text-red-600 bg-red-50 border-red-200',
        Mittel: 'text-amber-600 bg-amber-50 border-amber-200',
        Niedrig: 'text-green-600 bg-green-50 border-green-200',
    };

    const priorityClasses = {
        high: 'bg-red-50 text-red-700 border-red-200',
        medium: 'bg-amber-50 text-amber-700 border-amber-200',
        low: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const effortClasses = {
        high: 'bg-gray-100 text-gray-700',
        medium: 'bg-gray-50 text-gray-600',
        low: 'bg-white text-gray-500',
    };

    const statusClasses = {
        Offen: 'bg-gray-100 text-gray-700',
        'In Bearbeitung': 'bg-yellow-100 text-yellow-700',
        Abgeschlossen: 'bg-green-100 text-green-700',
    };

    const renderSupplierHierarchy = (supplier, level = 0) => {
        return (
            <div key={supplier.id} className={`ml-${level * 4}`}>
                <div className={`flex items-center gap-2 p-2 border border-gray-200 rounded-lg ${riskLevelColorClass[supplier.risk_level]}`}>
                    <span className="font-medium">{supplier.name}</span>
                    <span className="text-xs">({supplier.tier}, {supplier.risk_score}/100)</span>
                </div>
                {supplier.subSuppliers && supplier.subSuppliers.length > 0 && (
                    <div className="mt-2">
                        {supplier.subSuppliers.map(subSupplier => renderSupplierHierarchy(subSupplier, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 ml-72 p-10 text-center text-gray-600">
                    <Loader size={24} className="animate-spin mx-auto" />
                    <p className="mt-2">Lade Analyse-Daten...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 ml-72 p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center">
                            <X size={16} className="mr-2" />
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!suppliers.length) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 ml-72 p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center">
                            <Info size={16} className="mr-2" />
                            Keine Lieferanten gefunden. Bitte fügen Sie einen Lieferanten hinzu.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 ml-72 p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center">
                            <Info size={16} className="mr-2" />
                            Keine Lieferantendaten verfügbar. Bitte wählen Sie einen anderen Lieferanten oder aktualisieren Sie die Daten.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-72">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold">Lieferanten-Risikobewertung</h2>
                                    <p className="text-blue-100 text-sm mt-1">Automatisierte LKG-konforme Risikoanalyse</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevelColorClass[supplier.risk_level]}`}>
                                        {supplier.risk_score}/100 - {supplier.risk_level}es Risiko
                                    </span>
                                    <button className="p-2 hover:bg-blue-700 rounded-full">
                                        <Settings size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <select
                                value={selectedSupplierId || ''}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full max-w-xs"
                            >
                                <option value="">Lieferant auswählen</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6 flex">
                            <button
                                className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Übersicht
                            </button>
                            <button
                                className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'factors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('factors')}
                            >
                                Risikofaktoren
                            </button>
                            <button
                                className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('history')}
                            >
                                Historischer Verlauf
                            </button>
                            <button
                                className={`py-3 px-4 font-medium text-sm border-b-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('documents')}
                            >
                                Nachweise
                            </button>
                        </div>

                        {/* Main content */}
                        {activeTab === 'overview' && (
                            <div className="p-6">
                                {/* Supplier info */}
                                <div className="flex flex-col md:flex-row gap-6 mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{supplier.tier}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {supplier.industry} • {supplier.country}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Letzte Bewertung: {new Date(supplier.last_updated).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
                                            <Zap size={16} />
                                            Neu bewerten
                                        </button>
                                        <button className="text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg">Details</button>
                                        <button
                                            onClick={exportToPDF}
                                            disabled={isExporting}
                                            className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-green-400"
                                        >
                                            {isExporting ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                                            PDF exportieren
                                        </button>
                                    </div>
                                </div>

                                {/* Lieferketten-Hierarchie */}
                                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Info size={18} className="text-blue-500" />
                                            <h3 className="font-medium text-gray-900">Lieferketten-Hierarchie</h3>
                                            <div className="group relative cursor-help">
                                                <HelpCircle size={14} className="text-gray-400" />
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                    Hierarchie der Lieferkette, einschließlich Tier-2- und Tier-3-Lieferanten.
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowHierarchy(!showHierarchy)}>
                                            <ChevronDown size={18} className={`transform transition-transform ${showHierarchy ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {showHierarchy && (
                                        <div className="p-4 space-y-2">
                                            {renderSupplierHierarchy(supplier)}
                                        </div>
                                    )}
                                </div>

                                {/* Risk factors section */}
                                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-amber-500" />
                                            <h3 className="font-medium text-gray-900">Risikofaktoren</h3>
                                            <div className="group relative cursor-help">
                                                <HelpCircle size={14} className="text-gray-400" />
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                    Die wichtigsten Faktoren, die zu dieser Risikobewertung beitragen
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowFactors(!showFactors)}>
                                            <ChevronDown size={18} className={`transform transition-transform ${showFactors ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {showFactors && (
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-4">
                                                        <div className="w-full h-full relative rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                            <div className="absolute inset-2 rounded-full bg-blue-100 border border-blue-200"></div>
                                                            <div className="absolute inset-8 rounded-full bg-blue-200 border border-blue-300"></div>
                                                            <div className="absolute inset-14 rounded-full bg-blue-300 border border-blue-400"></div>
                                                            <div className="absolute inset-20 rounded-full bg-blue-400 border border-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                                                {supplier.risk_score}
                                                            </div>
                                                            <div className="absolute top-10 right-16 w-3 h-3 bg-amber-500 rounded-full"></div>
                                                            <div className="absolute top-1/4 left-10 w-3 h-3 bg-red-500 rounded-full"></div>
                                                            <div className="absolute bottom-10 left-1/4 w-3 h-3 bg-amber-500 rounded-full"></div>
                                                            <div className="absolute bottom-1/4 right-10 w-3 h-3 bg-green-500 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Länderrisiko</p>
                                                            <p className="text-xs text-gray-500">Menschenrechte, Korruption, Stabilität</p>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-lg font-bold text-red-600">{supplier.factors.country}</span>
                                                            <span className="text-xs text-gray-400">/10</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Branchenrisiko</p>
                                                            <p className="text-xs text-gray-500">Ressourcen, Arbeitsintensität</p>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-lg font-bold text-amber-600">{supplier.factors.industry}</span>
                                                            <span className="text-xs text-gray-400">/10</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Unternehmensrisiko</p>
                                                            <p className="text-xs text-gray-500">Größe, Zertifizierungen, Historie</p>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-lg font-bold text-amber-600">{supplier.factors.company}</span>
                                                            <span className="text-xs text-gray-400">/10</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Positionsrisiko</p>
                                                            <p className="text-xs text-gray-500">Tier-Level, Strategische Bedeutung</p>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-lg font-bold text-green-600">{supplier.factors.position}</span>
                                                            <span className="text-xs text-gray-400">/10</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Risikoanalyse-Methodik */}
                                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Info size={18} className="text-blue-500" />
                                            <h3 className="font-medium text-gray-900">Risikoanalyse-Methodik</h3>
                                            <div className="group relative cursor-help">
                                                <HelpCircle size={14} className="text-gray-400" />
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                    Methodik zur Berechnung der Risikobewertung
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowMethodology(!showMethodology)}>
                                            <ChevronDown size={18} className={`transform transition-transform ${showMethodology ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {showMethodology && (
                                        <div className="p-4 space-y-3">
                                            <p className="text-sm text-gray-600">{supplier.methodology.description}</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Länderrisiko-Gewichtung</span>
                                                    <span className="text-sm font-medium text-gray-900">{supplier.methodology.weights.country}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Branchenrisiko-Gewichtung</span>
                                                    <span className="text-sm font-medium text-gray-900">{supplier.methodology.weights.industry}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Unternehmensrisiko-Gewichtung</span>
                                                    <span className="text-sm font-medium text-gray-900">{supplier.methodology.weights.company}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Positionsrisiko-Gewichtung</span>
                                                    <span className="text-sm font-medium text-gray-900">{supplier.methodology.weights.position}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Aktualisierungsintervall</span>
                                                    <span className="text-sm font-medium text-gray-900">{supplier.methodology.updateInterval}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* LKG-Bewertung */}
                                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Info size={18} className="text-blue-500" />
                                            <h3 className="font-medium text-gray-900">LKG-Bewertung</h3>
                                            <div className="group relative cursor-help">
                                                <HelpCircle size={14} className="text-gray-400" />
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                    Einordnung gemäß Lieferkettengesetz-Anforderungen
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAssessment(!showAssessment)}>
                                            <ChevronDown size={18} className={`transform transition-transform ${showAssessment ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {showAssessment && (
                                        <div className="p-4">
                                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle size={18} className="text-amber-500" />
                                                        <span className="font-medium text-amber-800">Mittleres LKG-Risiko</span>
                                                    </div>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Prüfung erforderlich</span>
                                                </div>
                                                <p className="text-sm text-amber-700 mt-2">
                                                    Dieser Lieferant benötigt weitere Überprüfungen und Dokumentation, um vollständige LKG-Konformität zu gewährleisten.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Menschenrechte</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">65%</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Risiken bzgl. Arbeitsbedingungen und Vereinigungsfreiheit</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Umweltschutz</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">78%</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Hohe Umweltbelastung in der Elektronikfertigung</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Korruptionsbekämpfung</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">60%</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Mittleres Risiko aufgrund regionaler Faktoren</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Transparenz</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">40%</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Ausreichende Berichts- und Nachverfolgungsdaten</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Handlungsempfehlungen */}
                                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={18} className="text-green-500" />
                                            <h3 className="font-medium text-gray-900">Handlungsempfehlungen</h3>
                                            <div className="group relative cursor-help">
                                                <HelpCircle size={14} className="text-gray-400" />
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                    Maßnahmen zur Risikominimierung
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowRecommendations(!showRecommendations)}>
                                            <ChevronDown size={18} className={`transform transition-transform ${showRecommendations ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {showRecommendations && (
                                        <div className="p-4 space-y-3">
                                            {recommendations.length === 0 ? (
                                                <p className="text-sm text-gray-500">Keine Empfehlungen verfügbar.</p>
                                            ) : (
                                                recommendations.map(rec => (
                                                    <div key={rec.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-900">{rec.text}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${priorityClasses[rec.priority]}`}>
                                                                    Priorität: {rec.priority}
                                                                </span>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${effortClasses[rec.effort]}`}>
                                                                    Aufwand: {rec.effort}
                                                                </span>
                                                                <select
                                                                    value={rec.status}
                                                                    onChange={e => updateRecommendationStatus(rec.id, e.target.value)}
                                                                    className={`text-xs px-2 py-0.5 rounded border-0 ${statusClasses[rec.status]}`}
                                                                >
                                                                    <option value="Offen">Offen</option>
                                                                    <option value="In Bearbeitung">In Bearbeitung</option>
                                                                    <option value="Abgeschlossen">Abgeschlossen</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <button className="text-gray-500 hover:text-blue-600">
                                                            <ArrowRight size={16} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'factors' && (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaillierte Risikofaktoren</h3>
                                <div className="space-y-4">
                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900">Länderrisiko: {supplier.factors.country}/10</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Basierend auf Menschenrechtsindizes, Korruptionswahrnehmung und politischer Stabilität in {supplier.country}.
                                        </p>
                                    </div>
                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900">Branchenrisiko: {supplier.factors.industry}/10</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Berücksichtigt Arbeitsintensität und Ressourcenabhängigkeit in der {supplier.industry}-Branche.
                                        </p>
                                    </div>
                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900">Unternehmensrisiko: {supplier.factors.company}/10</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Bewertet Unternehmensgröße, Zertifizierungen und bisherige Compliance-Historie.
                                        </p>
                                    </div>
                                    <div className="p-4 border border-gray-200 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900">Positionsrisiko: {supplier.factors.position}/10</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Abhängig von der Position in der Lieferkette (Tier {supplier.tier}) und strategischer Bedeutung.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historischer Risikoverlauf</h3>
                                {history.length === 0 ? (
                                    <p className="text-sm text-gray-500">Kein Verlauf verfügbar.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((entry, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                                <div className={`w-3 h-3 rounded-full ${riskLevelColorClass[entry.risk_level]}`}></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900">
                                                        Risikopunktzahl: {entry.risk_score}/100 ({entry.risk_level})
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Aktualisiert am: {new Date(entry.updated_at).toLocaleDateString('de-DE')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nachweise und Dokumente</h3>
                                {documents.length === 0 ? (
                                    <p className="text-sm text-gray-500">Keine Dokumente verfügbar.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {documents.map(doc => (
                                            <div key={doc.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                                <File size={16} className="text-gray-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900">{doc.file_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Hochgeladen am: {new Date(doc.uploaded_at).toLocaleDateString('de-DE')} ({doc.file_type})
                                                    </p>
                                                </div>
                                                <button className="text-gray-500 hover:text-blue-600">
                                                    <ArrowDown size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}