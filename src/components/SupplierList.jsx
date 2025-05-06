import { useState, useRef } from 'react';
import { differenceInMonths } from 'date-fns';
import { supabase } from '../client.js';
import { FileText, Trash2, Edit, ChevronRight, Download, Search } from 'lucide-react';

export default function SupplierList({
    suppliers,
    filteredSuppliers,
    searchTerm,
    setSearchTerm,
    riskFilter,
    setRiskFilter,
    industryFilter,
    setIndustryFilter,
    riskStats,
    isAdmin,
    user,
    fetchSuppliers,
    setSelectedSupplier,
}) {
    const [editSupplier, setEditSupplier] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState(''); // 'success' oder 'error'
    const [activeSwipeRow, setActiveSwipeRow] = useState(null);

    // Dokumenten-Upload States
    const [showDocModal, setShowDocModal] = useState(false);
    const [docFile, setDocFile] = useState(null);
    const [docExpiry, setDocExpiry] = useState('');
    const [activeDocSupplierId, setActiveDocSupplierId] = useState(null);

    // Ref zum Speichern der Startposition für Swipe
    const touchStartX = useRef(null);
    const swipeThreshold = 50; // Pixel-Schwellenwert für Swipe-Erkennung

    // Compute unique industries from suppliers
    const uniqueIndustries = [...new Set(suppliers.map((s) => s.industry).filter(Boolean))];

    const handleCancelEdit = () => {
        setEditSupplier(null);
        setSelectedSupplier(null);
    };

    const handleEdit = (supplier) => {
        setEditSupplier({
            id: supplier.id,
            name: supplier.name,
            country: supplier.country,
            industry: supplier.industry,
            risk_level: supplier.risk_level,
            note: supplier.note,
            last_updated: new Date().toISOString() // timestamp aktualisieren
        });
        setSelectedSupplier(supplier);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Möchtest du den Lieferanten ${name} wirklich löschen?`)) {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (!error) {
                fetchSuppliers(user.id);
                setStatusMessage('✅ Lieferant erfolgreich gelöscht.');
                setStatusType('success');
                setActiveSwipeRow(null); // Schließe Swipe-Menü
            } else {
                console.error('Error deleting supplier:', error);
                setStatusMessage('❌ Fehler beim Löschen des Lieferanten.');
                setStatusType('error');
            }

            // Nachricht nach 5 Sekunden wieder ausblenden
            setTimeout(() => {
                setStatusMessage('');
                setStatusType('');
            }, 5000);
        }
    };

    // Touch-Event-Handler für Swipe-Funktionalität
    const handleTouchStart = (e, supplierId) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e, supplierId) => {
        if (!touchStartX.current) return;

        const touchEndX = e.touches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        // Wenn nach links gewischt wird und der Schwellenwert überschritten ist
        if (diff > swipeThreshold) {
            setActiveSwipeRow(supplierId);
        }
        // Wenn nach rechts gewischt wird und aktives Swipe-Menü existiert
        else if (diff < -swipeThreshold && activeSwipeRow === supplierId) {
            setActiveSwipeRow(null);
        }
    };

    const handleTouchEnd = () => {
        touchStartX.current = null;
    };

    // Klick auf Zeile, aber nur wenn kein Swipe aktiv ist
    const handleRowClick = (supplier) => {
        if (activeSwipeRow !== supplier.id) {
            setSelectedSupplier(supplier);
        }
    };

    // Schließt das Swipe-Menü, wenn auf eine andere Zeile geklickt wird
    const handleTableClick = () => {
        if (activeSwipeRow !== null) {
            setActiveSwipeRow(null);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Name', 'Country', 'Industry', 'Risk Level', 'Note'];
        const csvRows = [
            headers.join(','),
            ...filteredSuppliers.map((s) =>
                [
                    s.name,
                    s.country,
                    s.industry,
                    s.risk_level,
                    s.note ? `"${s.note.replace(/"/g, '""')}"` : ''
                ].join(',')
            )
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'suppliers.csv');
        a.click();
    };

    const handleExportPDF = () => {
        // Placeholder for PDF export logic
        console.log('PDF export not implemented yet');
    };

    return (
        <div>
            {/* Search and filter controls moved to Dashboard parent component */}

            {filteredSuppliers.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Keine Lieferanten gefunden</h3>
                    <p className="text-gray-500">
                        Es wurden keine Lieferanten mit den gewählten Filterkriterien gefunden.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-xl overflow-hidden" onClick={handleTableClick}>
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Land
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Branche
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Risikostufe
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aktionen
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredSuppliers.map((supplier) => {
                                const isOutdated = supplier.last_updated && differenceInMonths(new Date(), new Date(supplier.last_updated)) >= 12;
                                return (
                                    <tr
                                        key={supplier.id}
                                        className={`hover:bg-blue-50 transition-colors relative ${activeSwipeRow === supplier.id ? 'bg-blue-50' : ''} ${isOutdated ? 'border-l-4 border-red-500 bg-red-50' : ''}`}
                                        onClick={() => handleRowClick(supplier)}
                                        onTouchStart={(e) => handleTouchStart(e, supplier.id)}
                                        onTouchMove={(e) => handleTouchMove(e, supplier.id)}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {supplier.name}
                                            {isOutdated && (
                                                <div className="text-xs text-red-600 mt-1">⚠️ nicht aktualisiert seit über 12 Monaten</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {supplier.country}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {supplier.industry}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${supplier.risk_level === 'Hoch'
                                                    ? 'bg-red-100 text-red-800'
                                                    : supplier.risk_level === 'Mittel'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                    }`}
                                            >
                                                {supplier.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSupplier(supplier);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="Details anzeigen"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(supplier);
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {/* Dokument hochladen Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDocSupplierId(supplier.id);
                                                        setShowDocModal(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    title="Dokument hochladen"
                                                >
                                                    Dokument
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(supplier.id, supplier.name);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Lieferant löschen"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Swipe-Actions (wird nur angezeigt, wenn die Zeile aktiv ist) */}
                                            <div
                                                className={`absolute right-0 top-0 bottom-0 flex items-center bg-white shadow-lg transform transition-transform ${activeSwipeRow === supplier.id ? 'translate-x-0' : 'translate-x-full'
                                                    }`}
                                                style={{ width: '150px' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(supplier);
                                                    }}
                                                    className="flex-1 h-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                                    title="Bearbeiten"
                                                >
                                                    <Edit size={18} className="mr-1" />
                                                    <span>Bearbeiten</span>
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(supplier.id, supplier.name);
                                                        }}
                                                        className="flex-1 h-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                        title="Löschen"
                                                    >
                                                        <Trash2 size={18} className="mr-1" />
                                                        <span>Löschen</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {statusMessage && (
                <div
                    className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white animate-slideInRight flex items-center ${statusType === 'success'
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                >
                    {statusMessage}
                </div>
            )}

            <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
                <span>
                    Zeige {filteredSuppliers.length} von {suppliers.length} Lieferanten
                </span>

                <div className="flex space-x-2">
                    <button
                        className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        onClick={handleExportCSV}
                    >
                        <Download size={16} />
                        CSV Export
                    </button>
                    <button
                        className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        onClick={handleExportPDF}
                    >
                        <Download size={16} />
                        PDF Export
                    </button>
                </div>
            </div>
            {/* Modal für Dokumenten-Upload */}
            {showDocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Dokument hochladen</h2>

                        <input
                            type="file"
                            onChange={(e) => setDocFile(e.target.files[0])}
                            className="mb-4"
                        />

                        <label className="block text-sm font-medium mb-1">Gültig bis</label>
                        <input
                            type="date"
                            value={docExpiry}
                            onChange={(e) => setDocExpiry(e.target.value)}
                            className="mb-4 w-full border px-3 py-2 rounded"
                        />

                        <div className="flex justify-between">
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                onClick={async () => {
                                    if (!docFile || !docExpiry || !activeDocSupplierId) return;

                                    const filePath = `${activeDocSupplierId}/${docFile.name}`;
                                    const { data, error: uploadError } = await supabase.storage
                                        .from('supplier-documents')
                                        .upload(filePath, docFile, { upsert: true });

                                    if (uploadError) {
                                        console.error('Upload-Fehler:', uploadError);
                                        return;
                                    }

                                    const { error: insertError } = await supabase
                                        .from('supplier_documents')
                                        .insert([
                                            {
                                                supplier_id: activeDocSupplierId,
                                                name: docFile.name,
                                                path: filePath,
                                                valid_until: docExpiry
                                            }
                                        ]);

                                    if (insertError) {
                                        console.error('Datenbankfehler:', insertError);
                                        return;
                                    }

                                    setShowDocModal(false);
                                    setDocFile(null);
                                    setDocExpiry('');
                                    setActiveDocSupplierId(null);
                                }}
                            >
                                Speichern
                            </button>
                            <button
                                className="text-gray-600 px-4 py-2"
                                onClick={() => {
                                    setShowDocModal(false);
                                    setDocFile(null);
                                    setDocExpiry('');
                                    setActiveDocSupplierId(null);
                                }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}