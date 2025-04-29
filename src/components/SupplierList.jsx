import { useState } from 'react';
import { supabase } from '../supabaseClient';

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
        });
        setSelectedSupplier(supplier);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (!error) fetchSuppliers(user.id);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded shadow overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Lieferantenliste</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-md shadow-sm">
                <input
                    type="text"
                    placeholder="🔍 Lieferanten durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="Alle">Alle Risiken</option>
                    <option value="Hoch">Hoch ({riskStats.Hoch})</option>
                    <option value="Mittel">Mittel ({riskStats.Mittel})</option>
                    <option value="Niedrig">Niedrig ({riskStats.Niedrig})</option>
                </select>
                <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="Alle">Alle Branchen</option>
                    {[...new Set(suppliers.map((s) => s.industry))].map(
                        (industry) =>
                            industry && (
                                <option key={industry} value={industry}>
                                    {industry}
                                </option>
                            )
                    )}
                </select>
            </div>
            <div>
                <table className="min-w-[600px] w-full border text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Land</th>
                            <th className="p-2 border">Branche</th>
                            <th className="p-2 border" title="Risikostufe: Einschätzung der Risiken entlang der Lieferkette">Risikostufe ℹ️</th>
                            <th className="p-2 border">Notiz</th>
                            <th className="p-2 border">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!suppliers.length ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="text-center text-gray-500 text-sm py-8">
                                        <p>📭 Noch keine Lieferanten vorhanden.</p>
                                        <p className="mt-2">Füge deinen ersten Lieferanten über das Formular hinzu!</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-4 text-gray-500">
                                    Keine Lieferanten gefunden.
                                </td>
                            </tr>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td className="p-2 border">{supplier.name}</td>
                                    <td className="p-2 border">{supplier.country}</td>
                                    <td className="p-2 border">{supplier.industry}</td>
                                    <td className="p-2 border">{supplier.risk_level}</td>
                                    <td className="p-2 border">{supplier.note}</td>
                                    <td className="p-2 border whitespace-nowrap">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 transform transition-transform text-white px-4 py-2 rounded-md shadow-sm text-sm"
                                            >
                                                Bearbeiten
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="bg-red-500 hover:bg-red-600 active:scale-95 transform transition-transform text-white px-4 py-2 rounded-md shadow-sm text-sm"
                                            >
                                                Abbrechen
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="bg-red-500 hover:bg-red-600 active:scale-95 transform transition-transform text-white px-4 py-2 rounded-md shadow-sm text-sm"
                                                >
                                                    Löschen
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
