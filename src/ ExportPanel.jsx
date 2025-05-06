import { useState } from 'react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Download } from 'lucide-react';

const ExportPanel = ({ suppliers }) => {
    const [exportType, setExportType] = useState('csv');

    const handleExport = () => {
        if (!suppliers || suppliers.length === 0) {
            alert('Keine Daten zum Exportieren vorhanden.');
            return;
        }

        if (exportType === 'csv') {
            const csvData = suppliers.map(s => ({
                Name: s.name,
                Land: s.country,
                Branche: s.industry,
                Risikostufe: s.risk_level,
                Notizen: s.note || '',
                Risikoscore: s.risk_score || 0
            }));
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `lieferanten_${new Date().toISOString()}.csv`);
            link.click();
            URL.revokeObjectURL(url);
        } else if (exportType === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Lieferanten-Export', 20, 20);
            doc.setFontSize(12);
            doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);

            const tableData = suppliers.map(s => [
                s.name,
                s.country,
                s.industry,
                s.risk_level,
                s.risk_score || 0
            ]);
            doc.autoTable({
                startY: 40,
                head: [['Name', 'Land', 'Branche', 'Risikostufe', 'Risikoscore']],
                body: tableData,
            });

            doc.save(`lieferanten_export_${new Date().toISOString()}.pdf`);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Exportieren</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                        <input
                            type="radio"
                            value="csv"
                            checked={exportType === 'csv'}
                            onChange={(e) => setExportType(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">CSV</span>
                    </label>
                    <label className="flex items-center gap-1">
                        <input
                            type="radio"
                            value="pdf"
                            checked={exportType === 'pdf'}
                            onChange={(e) => setExportType(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">PDF</span>
                    </label>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    <Download size={16} />
                    Exportieren
                </button>
            </div>
        </div>
    );
};

export default ExportPanel;