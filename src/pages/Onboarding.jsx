import { useState, useEffect } from 'react';
import {
    CheckCircle, HelpCircle, SkipForward, ArrowRight,
    Info, AlertTriangle, Upload, Database, FileCheck
} from 'lucide-react';

export default function Onboarding({ onComplete, onSkip }) {
    const [step, setStep] = useState(1);
    const [isComplete, setIsComplete] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        size: '',
        directSuppliers: '',
        hasNonEUSuppliers: false,
        hasOver50Employees: false,
        isPartOfLargerCompany: false,
        complianceAnswers: [],
        suppliers: [],
        documents: [],
        actionPlan: null,
        setupReminders: false,
        reminderEmail: '',
        setupCalendar: false
    });

    const [tooltipVisible, setTooltipVisible] = useState(null);
    const totalSteps = 5;

    useEffect(() => {
        // Check if onboarding was already completed before
        const completed = localStorage.getItem('onboardingComplete');
        if (completed === 'true') {
            const savedData = JSON.parse(localStorage.getItem('onboardingData') || '{}');
            setFormData(prevData => ({ ...prevData, ...savedData }));
            setIsComplete(true);
        }
    }, []);

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            setIsComplete(true);
            localStorage.setItem('onboardingComplete', 'true');
            localStorage.setItem('onboardingData', JSON.stringify(formData));
        }
    };

    const handlePrevious = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        onSkip();
        localStorage.setItem('onboardingSkipped', 'true');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const showHelp = (step) => {
        const helpMessages = [
            "Füllen Sie bitte Ihre grundlegenden Firmendaten aus. Diese Informationen helfen uns, den Onboarding-Prozess für Sie anzupassen.",
            "Beantworten Sie diese kurzen Fragen, um Ihren aktuellen Compliance-Status zu ermitteln. Je ehrlicher, desto besser können wir Ihnen helfen.",
            "Tragen Sie Ihre wichtigsten Lieferanten ein und bewerten Sie schnell deren Risikopotential.",
            "Hier können Sie die grundlegenden Dokumente für Ihre LKG-Compliance hochladen oder unsere Vorlagen verwenden.",
            "Basierend auf Ihren Angaben erstellen wir einen realistischen Zeitplan für Ihre Compliance-Maßnahmen."
        ];

        alert(`Hilfe zu Schritt ${step}: ${helpMessages[step - 1]}`);
    };

    const getComplianceScore = () => {
        const trueAnswers = formData.complianceAnswers.filter(Boolean).length;
        const totalQuestions = 6; // Number of compliance questions

        if (trueAnswers === 0) return { status: 'kritisch', color: 'bg-red-500' };
        if (trueAnswers <= 2) return { status: 'gefährdet', color: 'bg-orange-500' };
        if (trueAnswers <= 4) return { status: 'in Bearbeitung', color: 'bg-yellow-500' };
        return { status: 'gut', color: 'bg-green-500' };
    };

    const getActionItems = () => {
        const answers = formData.complianceAnswers;
        const items = [];

        if (!answers[0]) items.push("Compliance-Richtlinie erstellen");
        if (!answers[1]) items.push("Lieferantenaudits planen");
        if (!answers[2]) items.push("Risikoanalyse durchführen");
        if (!answers[3]) items.push("Mitarbeiterschulungen organisieren");
        if (!answers[4]) items.push("LKG-Verantwortlichen benennen");
        if (!answers[5]) items.push("Notwendige Dokumente sammeln");

        return items.slice(0, 3); // Return top 3 action items
    };

    const addSupplier = (name) => {
        if (!name.trim()) return;

        const newSupplier = {
            name: name.trim(),
            risk: {
                riskCountry: false,
                knownIssues: false
            },
        };

        setFormData({
            ...formData,
            suppliers: [...formData.suppliers, newSupplier],
        });
    };

    const updateSupplierRisk = (index, riskType, value) => {
        const updatedSuppliers = [...formData.suppliers];
        updatedSuppliers[index].risk[riskType] = value;
        setFormData({
            ...formData,
            suppliers: updatedSuppliers
        });
    };

    const getSupplierRiskLevel = (supplier) => {
        const { riskCountry, knownIssues } = supplier.risk || {};

        if (riskCountry && knownIssues) return { level: 'Hoch', color: 'bg-red-500' };
        if (riskCountry || knownIssues) return { level: 'Mittel', color: 'bg-yellow-500' };
        return { level: 'Niedrig', color: 'bg-green-500' };
    };

    const handleFileUpload = (type, file) => {
        const updatedDocs = [...formData.documents];
        const existingIndex = updatedDocs.findIndex(doc => doc && doc.type === type);

        if (existingIndex >= 0) {
            updatedDocs[existingIndex] = { type, file: file.name };
        } else {
            updatedDocs.push({ type, file: file.name });
        }

        setFormData({ ...formData, documents: updatedDocs });
    };

    const handleCSVImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simulate CSV parsing logic
        const mockSuppliers = [
            { name: "Import-Lieferant 1", risk: { riskCountry: false, knownIssues: false } },
            { name: "Import-Lieferant 2", risk: { riskCountry: true, knownIssues: false } },
            { name: "Import-Lieferant 3", risk: { riskCountry: false, knownIssues: false } }
        ];

        setFormData({
            ...formData,
            suppliers: [...formData.suppliers, ...mockSuppliers]
        });

        alert(`${mockSuppliers.length} Lieferanten erfolgreich importiert!`);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Willkommen & Firmeneinrichtung</h2>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ca. 3-5 Min.
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-gray-700">Willkommen bei ChainGuard - wir führen Sie sicher zur LKG-Compliance.</p>
                                    <p className="text-sm text-gray-600 mt-1">Diese Ersteinrichtung dauert ca. 15-20 Minuten insgesamt und kann jederzeit pausiert werden.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Firmenname</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="z.B. Meier GmbH"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branche</label>
                                <select
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Bitte auswählen</option>
                                    <option value="automotive">Automobilindustrie</option>
                                    <option value="manufacturing">Fertigungsindustrie</option>
                                    <option value="retail">Einzelhandel</option>
                                    <option value="food">Lebensmittel</option>
                                    <option value="textiles">Textilien</option>
                                    <option value="tech">IT/Technologie</option>
                                    <option value="other">Sonstige</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmensgröße</label>
                                <select
                                    name="size"
                                    value={formData.size}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Bitte auswählen</option>
                                    <option value="1-50">1-50 Mitarbeiter</option>
                                    <option value="51-250">51-250 Mitarbeiter</option>
                                    <option value="251-1000">251-1000 Mitarbeiter</option>
                                    <option value="1000+">Über 1000 Mitarbeiter</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl direkter Lieferanten</label>
                                <input
                                    type="number"
                                    name="directSuppliers"
                                    value={formData.directSuppliers}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="z.B. 10"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                LKG-Relevanz-Check
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">Bitte bestätigen Sie:</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="lkg1"
                                        className="mt-1"
                                        checked={formData.hasNonEUSuppliers}
                                        onChange={(e) => setFormData({ ...formData, hasNonEUSuppliers: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="lkg1" className="text-sm font-medium text-gray-700">
                                            Haben Sie Lieferanten außerhalb der EU?
                                        </label>
                                        <p className="text-xs text-gray-500">Dazu zählen direkte und indirekte Lieferanten</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="lkg2"
                                        className="mt-1"
                                        checked={formData.hasOver50Employees}
                                        onChange={(e) => setFormData({ ...formData, hasOver50Employees: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="lkg2" className="text-sm font-medium text-gray-700">
                                            Beschäftigen Sie mehr als 50 Mitarbeiter?
                                        </label>
                                        <p className="text-xs text-gray-500">Gesamtanzahl der Beschäftigten im Unternehmen</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="lkg3"
                                        className="mt-1"
                                        checked={formData.isPartOfLargerCompany}
                                        onChange={(e) => setFormData({ ...formData, isPartOfLargerCompany: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="lkg3" className="text-sm font-medium text-gray-700">
                                            Sind Sie Teil eines größeren Unternehmens (mehr als 1000 MA)?
                                        </label>
                                        <p className="text-xs text-gray-500">Konzernzugehörigkeit oder Muttergesellschaft</p>
                                    </div>
                                </div>
                            </div>

                            {(formData.hasNonEUSuppliers && (formData.hasOver50Employees || formData.isPartOfLargerCompany)) && (
                                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm font-medium text-red-700">
                                        Basierend auf Ihren Angaben ist das LKG für Ihr Unternehmen relevant!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2:
                const questions = [
                    {
                        q: "Haben Sie eine dokumentierte Compliance-Richtlinie?",
                        help: "Eine schriftliche Richtlinie, die Ihre Anforderungen an Umwelt-, Sozial- und Governance-Standards festlegt."
                    },
                    {
                        q: "Führen Sie regelmäßige Lieferantenaudits durch?",
                        help: "Überprüfungen Ihrer Lieferanten durch Fragebögen, Besuche oder externe Auditoren."
                    },
                    {
                        q: "Haben Sie eine Risikoanalyse für Ihre Lieferkette?",
                        help: "Systematische Bewertung von Risiken wie Menschenrechtsverletzungen oder Umweltverstößen in Ihrer Lieferkette."
                    },
                    {
                        q: "Schulen Sie Ihre Mitarbeiter in Compliance-Themen?",
                        help: "Regelmäßige Schulungen zu relevanten Compliance-Themen für Mitarbeiter im Einkauf oder anderen relevanten Abteilungen."
                    },
                    {
                        q: "Gibt es einen Ansprechpartner für LKG-Themen?",
                        help: "Eine verantwortliche Person oder Stelle für Fragen und Maßnahmen zum Lieferkettensorgfaltspflichtengesetz."
                    },
                    {
                        q: "Haben Sie bereits LKG-relevante Dokumente gesammelt?",
                        help: "Dokumente wie Lieferantenselbstauskünfte, Zertifikate, Nachhaltigkeitsberichte etc."
                    }
                ];

                const score = getComplianceScore();
                const actionItems = getActionItems();

                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Compliance-Schnellstart</h2>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ca. 3-5 Min.
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-blue-600" />
                                Quick-Assessment
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Beantworten Sie die folgenden Fragen für eine erste Standortbestimmung:
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-3">
                                {questions.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id={`q${idx}`}
                                            className="mt-1"
                                            checked={formData.complianceAnswers[idx] || false}
                                            onChange={(e) => {
                                                const answers = [...(formData.complianceAnswers || [])];
                                                answers[idx] = e.target.checked;
                                                setFormData({ ...formData, complianceAnswers: answers });
                                            }}
                                        />
                                        <div className="relative">
                                            <div className="flex items-center gap-1">
                                                <label htmlFor={`q${idx}`} className="text-sm font-medium text-gray-700">
                                                    {item.q}
                                                </label>
                                                <button
                                                    className="text-gray-400 hover:text-blue-600"
                                                    onMouseEnter={() => setTooltipVisible(idx)}
                                                    onMouseLeave={() => setTooltipVisible(null)}
                                                >
                                                    <HelpCircle size={16} />
                                                </button>
                                            </div>

                                            {tooltipVisible === idx && (
                                                <div className="absolute left-0 mt-1 p-2 bg-white rounded shadow-lg border border-gray-200 text-xs text-gray-600 w-64 z-10">
                                                    {item.help}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {formData.complianceAnswers && formData.complianceAnswers.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Ihr Compliance-Status</h3>

                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`${score.color} h-2 rounded-full`}
                                                style={{ width: `${(formData.complianceAnswers.filter(Boolean).length / questions.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {formData.complianceAnswers.filter(Boolean).length}/{questions.length}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-3 h-3 rounded-full ${score.color}`}></div>
                                        <p className="text-sm font-medium">Status: {score.status}</p>
                                    </div>

                                    <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-2">Wichtigste Handlungsfelder:</h4>
                                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                        {actionItems.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Lieferantenerfassung</h2>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ca. 3-5 Min.
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-700">
                                    Tragen Sie Ihre wichtigsten Lieferanten ein. Für eine umfassende LKG-Compliance sollten Sie mit den risikoreichsten Lieferanten beginnen.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Lieferanten Eingabe */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Kernlieferanten eingeben</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="supplierInput"
                                        placeholder="Lieferantenname eingeben"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addSupplier(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        onClick={() => {
                                            const input = document.getElementById('supplierInput');
                                            addSupplier(input.value);
                                            input.value = '';
                                        }}
                                    >
                                        Hinzufügen
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Drücken Sie Enter oder klicken Sie auf "Hinzufügen", um einen Lieferanten hinzuzufügen
                                </p>
                            </div>

                            {/* CSV Import */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database size={20} className="text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Massenimport via CSV</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Wenn Sie bereits eine Liste Ihrer Lieferanten haben, können Sie diese hier hochladen.
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    onChange={handleCSVImport}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    CSV-Format: Name, Land, Kategorie (eine Zeile pro Lieferant)
                                </p>
                            </div>

                            {/* Lieferantenliste */}
                            {formData.suppliers.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Ihre Lieferanten ({formData.suppliers.length})</h3>
                                    <div className="space-y-3">
                                        {formData.suppliers.map((supplier, idx) => {
                                            const riskStatus = getSupplierRiskLevel(supplier);
                                            return (
                                                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-md font-semibold text-gray-800">{supplier.name}</h4>
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${riskStatus.color}`}></div>
                                                            <span className="text-xs font-medium">Risiko: {riskStatus.level}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">Risiko-Schnellcheck:</p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`risk${idx}1`}
                                                                className="mt-1"
                                                                checked={supplier.risk?.riskCountry || false}
                                                                onChange={(e) => updateSupplierRisk(idx, 'riskCountry', e.target.checked)}
                                                            />
                                                            <div>
                                                                <label htmlFor={`risk${idx}1`} className="text-sm text-gray-700">
                                                                    Lieferant aus Risikoland
                                                                </label>
                                                                <p className="text-xs text-gray-500">z.B. Länder mit bekannten Menschenrechtsproblemen</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`risk${idx}2`}
                                                                className="mt-1"
                                                                checked={supplier.risk?.knownIssues || false}
                                                                onChange={(e) => updateSupplierRisk(idx, 'knownIssues', e.target.checked)}
                                                            />
                                                            <div>
                                                                <label htmlFor={`risk${idx}2`} className="text-sm text-gray-700">
                                                                    Bekannte Compliance-Probleme
                                                                </label>
                                                                <p className="text-xs text-gray-500">z.B. frühere Verstöße oder negative Berichterstattung</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 4:
                const requiredDocs = [
                    {
                        type: "selbstauskunft",
                        name: "Lieferantenselbstauskunft",
                        description: "Fragebogen für Ihre Lieferanten zu Umwelt-, Sozial- und Governance-Standards"
                    },
                    {
                        type: "risikoanalyse",
                        name: "Risikoanalyse",
                        description: "Systematische Bewertung der Risiken in Ihrer Lieferkette"
                    },
                    {
                        type: "nachhaltigkeitsbericht",
                        name: "Nachhaltigkeitsbericht",
                        description: "Dokumentation Ihrer Nachhaltigkeitsmaßnahmen und -ziele"
                    }
                ];

                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Dokumenten-Basisset</h2>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ca. 3-5 Min.
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-blue-600" />
                                Mindestanforderungen
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Für die LKG-Compliance benötigen Sie grundlegende Dokumente. Diese bilden das Fundament Ihrer Nachweispflichten.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {requiredDocs.map((doc, idx) => {
                                const isUploaded = formData.documents.some(d => d && d.type === doc.type);
                                return (
                                    <div key={idx} className={`border ${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'} rounded-lg p-4`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-md font-semibold text-gray-800 flex items-center gap-1">
                                                    {isUploaded && <CheckCircle size={16} className="text-green-600" />}
                                                    {doc.name}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                            </div>

                                            <a
                                                href="#"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    alert(`Vorlage für ${doc.name} wird heruntergeladen...`);
                                                }}
                                            >
                                                <ArrowRight size={14} />
                                                Vorlage
                                            </a>
                                        </div>

                                        <div className="mt-3">
                                            <label className={`
                                                flex justify-center items-center px-4 py-2 border-2 
                                                ${isUploaded ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 hover:border-blue-500'} 
                                                rounded-lg cursor-pointer transition-colors
                                            `}>
                                                <div className="flex items-center gap-2">
                                                    <Upload size={18} className={isUploaded ? "text-green-600" : "text-gray-500"} />
                                                    <span className={`text-sm ${isUploaded ? "text-green-700" : "text-gray-700"}`}>
                                                        {isUploaded
                                                            ? `Hochgeladen: ${formData.documents.find(d => d && d.type === doc.type).file}`
                                                            : "Dokument hochladen (.pdf, .docx)"}
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.docx"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            handleFileUpload(doc.type, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800">Weitere relevante Dokumente</h4>
                                <p className="text-sm text-gray-600 mt-1 mb-3">
                                    Je nach Branche und Unternehmensgröße können weitere Dokumente erforderlich sein.
                                </p>
                                <button
                                    className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                                    onClick={() => alert("Im Dashboard können Sie weitere Dokumente hochladen.")}
                                >
                                    + Zusätzliche Dokumente im Dashboard verwalten
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                const nextSteps = [];
                // Generate next steps based on previous inputs
                if (formData.suppliers.length > 0) {
                    nextSteps.push(`Selbstauskunft von Top-${Math.min(3, formData.suppliers.length)}-Lieferanten einholen`);
                }
                const complianceScore = getComplianceScore();
                if (complianceScore.status === 'kritisch' || complianceScore.status === 'gefährdet') {
                    nextSteps.push("Compliance-Schulung für Einkaufsteam durchführen");
                    nextSteps.push("Risikoanalyse für Hauptlieferanten erstellen");
                } else {
                    nextSteps.push("Regelmäßige Lieferantenaudits einplanen");
                    nextSteps.push("Compliance-Richtlinien aktualisieren");
                }

                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">Ihr Compliance-Fahrplan</h2>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ca. 2-3 Min.
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalisierter Aktionsplan</h3>

                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-gray-700">Zeitplan:</p>
                                    <span className="text-sm text-gray-600">3 Monate</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Nächste Schritte (Priorität):</h4>
                            <div className="space-y-2">
                                {nextSteps.slice(0, 3).map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-green-100">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-700">{step}</p>
                                            <p className="text-xs text-gray-500">Innerhalb der nächsten {(idx + 1) * 2} Wochen</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Erinnerungen einrichten</h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="reminder_email"
                                        className="mt-1"
                                        checked={formData.setupReminders}
                                        onChange={(e) => setFormData({ ...formData, setupReminders: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="reminder_email" className="text-sm font-medium text-gray-700">
                                            Automatische E-Mail-Benachrichtigungen aktivieren
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Wir erinnern Sie an Fristen und nächste Schritte
                                        </p>
                                    </div>
                                </div>

                                {formData.setupReminders && (
                                    <div className="ml-7">
                                        <input
                                            type="email"
                                            name="reminderEmail"
                                            value={formData.reminderEmail}
                                            onChange={handleInputChange}
                                            placeholder="Ihre E-Mail-Adresse"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="reminder_calendar"
                                        className="mt-1"
                                        checked={formData.setupCalendar}
                                        onChange={(e) => setFormData({ ...formData, setupCalendar: e.target.checked })}
                                    />
                                    <div>
                                        <label htmlFor="reminder_calendar" className="text-sm font-medium text-gray-700">
                                            Termine in meinen Kalender eintragen
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Wir erstellen Kalenderereignisse für wichtige Fristen
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Compliance-Fortschritt</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Nach diesem Onboarding sind Sie auf dem richtigen Weg zur LKG-Compliance. Im Dashboard können Sie Ihren Fortschritt verfolgen.
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Start</span>
                                <span>15% abgeschlossen</span>
                                <span>Vollständige Compliance</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isComplete) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Herzlichen Glückwunsch!</h2>
                        <p className="text-gray-600 mt-2">
                            Sie haben die Grundlagen für Ihre LKG-Compliance erfolgreich geschaffen.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-left border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Ihre nächsten Schritte:</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                            <li>Sehen Sie sich Ihr personalisiertes Dashboard an</li>
                            <li>Starten Sie mit dem ersten Punkt Ihres Aktionsplans</li>
                            <li>Laden Sie Ihre erste Lieferanten-Selbstauskunft hoch</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg text-left border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Quick-Win für sofortige Verbesserung</h3>
                        <p className="text-sm text-gray-600">
                            Nutzen Sie unsere Vorlage, um heute noch die erste Selbstauskunft an Ihren wichtigsten Lieferanten zu senden.
                        </p>
                        <button
                            className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1 mx-auto"
                            onClick={() => alert("Vorlage wird heruntergeladen...")}
                        >
                            <ArrowRight size={16} /> Selbstauskunft-Vorlage herunterladen
                        </button>
                    </div>

                    <button
                        onClick={onComplete}
                        className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                    >
                        Zum Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Schritt {step} von {totalSteps}
                        </div>
                        <div className="text-sm text-gray-500">
                            LKG-Onboarding
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => showHelp(step)}
                            className="text-gray-500 hover:text-blue-600 p-1"
                            title="Hilfe zu diesem Schritt"
                        >
                            <HelpCircle size={20} />
                        </button>
                        <button
                            onClick={handleSkip}
                            className="text-gray-500 hover:text-blue-600 flex items-center gap-1 p-1"
                            title="Onboarding überspringen"
                        >
                            <SkipForward size={18} /> <span className="text-sm">Überspringen</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-200px)] pr-2 -mr-2">
                    {renderStepContent()}
                </div>

                <div className="mt-6 flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={handlePrevious}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Zurück
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        {step === totalSteps ? 'Abschließen' : 'Weiter'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}