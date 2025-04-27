import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient';

export function useAuditLogger(isAdmin) {
    const [auditLogs, setAuditLogs] = useState([]);
    const [logActionFilter, setLogActionFilter] = useState('');
    const [logUserFilter, setLogUserFilter] = useState('');

    useEffect(() => {
        if (isAdmin) {
            const fetchAuditLogs = async () => {
                const { data, error } = await supabase
                    .from('audit_log')
                    .select('*')
                    .order('timestamp', { ascending: false });
                if (!error && data) setAuditLogs(data);
            };
            fetchAuditLogs();
        }
    }, [isAdmin]);

    const handleAuditLogCSVExport = () => {
        const rows = [['Aktion', 'Benutzer', 'Zeitpunkt', 'Details']];
        auditLogs
            .filter(log => (!logActionFilter || log.action === logActionFilter) &&
                (!logUserFilter || log.user_id === logUserFilter))
            .forEach(log => {
                rows.push([
                    log.action,
                    log.user_id,
                    new Date(log.timestamp).toLocaleString('de-DE'),
                    JSON.stringify(log.details),
                ]);
            });

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'audit_logs.csv');
    };

    const handleAuditLogPDFExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Audit-Log Export', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        let y = 25;

        auditLogs
            .filter(log => (!logActionFilter || log.action === logActionFilter) &&
                (!logUserFilter || log.user_id === logUserFilter))
            .forEach(log => {
                const ts = new Date(log.timestamp).toLocaleString('de-DE');
                const lines = doc.splitTextToSize(`• ${log.action} – ${log.user_id.slice(0, 8)} – ${ts}\n${JSON.stringify(log.details)}`, 180);
                if (y + lines.length * 6 > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(lines, 10, y);
                y += lines.length * 6 + 4;
            });

        doc.save('audit_logs.pdf');
    };

    return {
        auditLogs,
        logActionFilter,
        setLogActionFilter,
        logUserFilter,
        setLogUserFilter,
        handleAuditLogCSVExport,
        handleAuditLogPDFExport,
    };
}