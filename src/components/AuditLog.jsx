import React from 'react';

export default function AuditLog({
    auditLogs,
    logActionFilter,
    setLogActionFilter,
    logUserFilter,
    setLogUserFilter,
    handleAuditLogCSVExport,
    handleAuditLogPDFExport,
}) {
    return (
        <div className="bg-white p-6 rounded shadow mt-10">
            <h2 className="text-xl font-semibold mb-4">Audit-Log</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <select
                    value={logActionFilter}
                    onChange={e => setLogActionFilter(e.target.value)}
                    className="w-full sm:w-1/4 px-4 py-2 border rounded"
                >
                    <option value="">Alle Aktionen</option>
                    {[...new Set(auditLogs.map(l => l.action))].map(action => (
                        <option key={action} value={action}>{action}</option>
                    ))}
                </select>
                <select
                    value={logUserFilter}
                    onChange={e => setLogUserFilter(e.target.value)}
                    className="w-full sm:w-1/4 px-4 py-2 border rounded"
                >
                    <option value="">Alle Benutzer</option>
                    {[...new Set(auditLogs.map(l => l.user_id))].map(uid => (
                        <option key={uid} value={uid}>{uid.slice(0, 8)}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleAuditLogCSVExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    CSV exportieren
                </button>
                <button
                    onClick={handleAuditLogPDFExport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                    PDF exportieren
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Aktion</th>
                            <th className="p-2 border">Benutzer</th>
                            <th className="p-2 border">Zeitpunkt</th>
                            <th className="p-2 border">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs
                            .filter(log => (!logActionFilter || log.action === logActionFilter) &&
                                (!logUserFilter || log.user_id === logUserFilter))
                            .map(log => (
                                <tr key={log.id}>
                                    <td className="p-2 border">{log.action}</td>
                                    <td className="p-2 border">{log.user_id.slice(0, 8)}</td>
                                    <td className="p-2 border">{new Date(log.timestamp).toLocaleString('de-DE')}</td>
                                    <td className="p-2 border text-xs break-all">{JSON.stringify(log.details)}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}