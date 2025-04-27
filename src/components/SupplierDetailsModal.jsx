import React from 'react';
import { supabase } from '../supabaseClient';
import SupplierAttachments from './SupplierAttachments';

export default function SupplierDetailsModal({
    selectedSupplier,
    setSelectedSupplier,
    fileUpload,
    setFileUpload,
}) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-2 py-6 sm:py-12 overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl relative border border-gray-100">
                <button
                    onClick={() => setSelectedSupplier(null)}
                    className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                    ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Lieferantendetails</h2>
                <p><strong>Name:</strong> {selectedSupplier.name}</p>
                <p><strong>Land:</strong> {selectedSupplier.country}</p>
                <p><strong>Branche:</strong> {selectedSupplier.industry}</p>
                <p><strong>Risikostufe:</strong> {selectedSupplier.risk_level}</p>
                <p><strong>Notiz:</strong> {selectedSupplier.note || '—'}</p>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-sm w-full">
                        Datei anhängen
                    </label>
                    <input
                        type="file"
                        onChange={(e) => setFileUpload(e.target.files[0])}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        title="Datei hochladen und an Lieferant anhängen"
                        onClick={async () => {
                            if (!fileUpload || !selectedSupplier?.id) return;
                            const { data, error } = await supabase.storage
                                .from('attachments')
                                .upload(`${selectedSupplier.id}/${fileUpload.name}`, fileUpload, {
                                    cacheControl: '3600',
                                    upsert: true,
                                });
                            if (!error) {
                                alert('Datei erfolgreich hochgeladen!');
                                setFileUpload(null);
                            } else {
                                alert('Fehler beim Hochladen der Datei.');
                            }
                        }}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow-sm active:scale-95 transform transition-transform"
                    >
                        Datei hochladen
                    </button>
                    <button
                        title="Letzte hochgeladene Datei herunterladen"
                        onClick={async () => {
                            if (!selectedSupplier?.id) return;
                            const { data, error } = await supabase.storage
                                .from('attachments')
                                .list(`${selectedSupplier.id}`, { limit: 100 });
                            if (error) {
                                alert('Fehler beim Laden der Anhänge.');
                                return;
                            }
                            if (data.length === 0) {
                                alert('Keine Dateien vorhanden.');
                                return;
                            }
                            const fileName = data[0].name;
                            const { data: downloadData, error: downloadError } = await supabase.storage
                                .from('attachments')
                                .download(`${selectedSupplier.id}/${fileName}`);

                            if (downloadError) {
                                alert('Download fehlgeschlagen.');
                            } else {
                                const url = URL.createObjectURL(downloadData);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = fileName;
                                a.click();
                                URL.revokeObjectURL(url);
                            }
                        }}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow-sm active:scale-95 transform transition-transform"
                    >
                        Datei herunterladen
                    </button>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-sm w-full">Anhänge:</label>
                        <ul className="space-y-1 text-sm text-blue-700 underline">
                            {selectedSupplier?.id && (
                                <React.Suspense fallback={<p>Lade Dateien...</p>}>
                                    <SupplierAttachments supplierId={selectedSupplier.id} />
                                </React.Suspense>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}