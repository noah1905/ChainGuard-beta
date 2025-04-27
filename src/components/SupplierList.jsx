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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border px-4 py-2 rounded"
                />
                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="w-full border px-4 py-2 rounded"
                >
                    <option value="Alle">Alle Risiken</option>
                    <option value="Hoch">Hoch ({riskStats.Hoch})</option>
                    <option value="Mittel">Mittel ({riskStats.Mittel})</option>
                    <option value="Niedrig">Niedrig ({riskStats.Niedrig})</option>
                </select>
                <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="w-full border px-4 py-2 rounded"
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
                            <th className="p-2 border">Risikostufe</th>
                            <th className="p-2 border">Notiz</th>
                            <th className="p-2 border">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map((supplier) => (
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
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                        >
                                            Bearbeiten
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                            >
                                                Löschen
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
