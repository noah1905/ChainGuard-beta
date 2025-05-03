import { useState } from 'react';
import { AlertTriangle, ArrowRight, HelpCircle, ChevronDown, Settings, Loader, CheckCircle, Info, ArrowUpRight, Zap } from 'lucide-react';

export default function RiskAssessmentModule() {
    const [activeTab, setActiveTab] = useState('overview');
    const [showFactors, setShowFactors] = useState(true);
    const [showAssessment, setShowAssessment] = useState(true);
    const [showRecommendations, setShowRecommendations] = useState(true);

    // Example supplier data
    const supplierData = {
        name: "TechComp AG",
        country: "Vietnam",
        industry: "Elektronik",
        tier: "Tier 1",
        riskScore: 68,
        riskLevel: "Mittel",
        lastUpdated: "02.05.2025",
        factors: {
            country: 7.2,
            industry: 6.5,
            company: 5.4,
            position: 3.8
        },
        recommendations: [
            { id: 1, text: "Arbeitsrechts-Selbstauskunft anfordern", priority: "high", effort: "low" },
            { id: 2, text: "Umwelt-Zertifizierungen überprüfen", priority: "medium", effort: "medium" },
            { id: 3, text: "Audit vor Ort planen", priority: "medium", effort: "high" },
            { id: 4, text: "Lieferanten-Kodex unterzeichnen lassen", priority: "low", effort: "low" }
        ]
    };

    const riskLevelColorClass = {
        "Hoch": "text-red-600 bg-red-50 border-red-200",
        "Mittel": "text-amber-600 bg-amber-50 border-amber-200",
        "Niedrig": "text-green-600 bg-green-50 border-green-200"
    };

    const priorityClasses = {
        high: "bg-red-50 text-red-700 border-red-200",
        medium: "bg-amber-50 text-amber-700 border-amber-200",
        low: "bg-blue-50 text-blue-700 border-blue-200"
    };

    const effortClasses = {
        high: "bg-gray-100 text-gray-700",
        medium: "bg-gray-50 text-gray-600",
        low: "bg-white text-gray-500"
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Lieferanten-Risikobewertung</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Automatisierte LKG-konforme Risikoanalyse
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevelColorClass[supplierData.riskLevel] || ''}`}>
                            {supplierData.riskScore}/100 - {supplierData.riskLevel}es Risiko
                        </span>
                        <button className="p-2 hover:bg-blue-700 rounded-full">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
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
                                <h3 className="font-semibold text-gray-900">{supplierData.name}</h3>
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {supplierData.tier}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm">{supplierData.industry} • {supplierData.country}</p>
                            <p className="text-gray-400 text-xs mt-1">Letzte Bewertung: {supplierData.lastUpdated}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
                                <Zap size={16} />
                                Neu bewerten
                            </button>
                            <button className="text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg">
                                Details
                            </button>
                        </div>
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
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowFactors(!showFactors)}
                            >
                                <ChevronDown size={18} className={`transform transition-transform ${showFactors ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {showFactors && (
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        {/* Radar chart visualization placeholder */}
                                        <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-4">
                                            <div className="w-full h-full relative rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                <div className="absolute inset-2 rounded-full bg-blue-100 border border-blue-200"></div>
                                                <div className="absolute inset-8 rounded-full bg-blue-200 border border-blue-300"></div>
                                                <div className="absolute inset-14 rounded-full bg-blue-300 border border-blue-400"></div>
                                                <div className="absolute inset-20 rounded-full bg-blue-400 border border-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                                    {supplierData.riskScore}
                                                </div>

                                                {/* Factor points - simplified representation */}
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
                                                <span className="text-lg font-bold text-red-600">{supplierData.factors.country}</span>
                                                <span className="text-xs text-gray-400">/10</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Branchenrisiko</p>
                                                <p className="text-xs text-gray-500">Ressourcen, Arbeitsintensität</p>
                                            </div>
                                            <div className="w-16 text-center">
                                                <span className="text-lg font-bold text-amber-600">{supplierData.factors.industry}</span>
                                                <span className="text-xs text-gray-400">/10</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Unternehmensrisiko</p>
                                                <p className="text-xs text-gray-500">Größe, Zertifizierungen, Historie</p>
                                            </div>
                                            <div className="w-16 text-center">
                                                <span className="text-lg font-bold text-amber-600">{supplierData.factors.company}</span>
                                                <span className="text-xs text-gray-400">/10</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Positionsrisiko</p>
                                                <p className="text-xs text-gray-500">Tier-Level, Strategische Bedeutung</p>
                                            </div>
                                            <div className="w-16 text-center">
                                                <span className="text-lg font-bold text-green-600">{supplierData.factors.position}</span>
                                                <span className="text-xs text-gray-400">/10</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assessment result section */}
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
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowAssessment(!showAssessment)}
                            >
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
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            Prüfung erforderlich
                                        </span>
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

                    {/* Recommendations section */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-500" />
                                <h3 className="font-medium text-gray-900">Handlungsempfehlungen</h3>
                                <div className="group relative cursor-help">
                                    <HelpCircle size={14} className="text-gray-400" />
                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        Konkrete Maßnahmen zur Risikominderung
                                    </div>
                                </div>
                            </div>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowRecommendations(!showRecommendations)}
                            >
                                <ChevronDown size={18} className={`transform transition-transform ${showRecommendations ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {showRecommendations && (
                            <div className="p-4">
                                <div className="space-y-3">
                                    {supplierData.recommendations.map(rec => (
                                        <div key={rec.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${priorityClasses[rec.priority].split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{rec.text}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityClasses[rec.priority]}`}>
                                                            {rec.priority === 'high' ? 'Hohe Priorität' : rec.priority === 'medium' ? 'Mittlere Priorität' : 'Niedrige Priorität'}
                                                        </span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border border-gray-200 ${effortClasses[rec.effort]}`}>
                                                            {rec.effort === 'high' ? 'Hoher Aufwand' : rec.effort === 'medium' ? 'Mittlerer Aufwand' : 'Geringer Aufwand'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                                                Umsetzen <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 text-center">
                                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 mx-auto">
                                        Alle Empfehlungen anzeigen <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Other tabs content would be here */}
            {activeTab !== 'overview' && (
                <div className="p-6 flex items-center justify-center text-gray-500">
                    <p>Tab-Inhalt für "{activeTab}" wird geladen...</p>
                </div>
            )}
        </div>
    );
}