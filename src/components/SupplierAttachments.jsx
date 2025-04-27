import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SupplierAttachments({ supplierId }) {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchFiles = async () => {
            const { data, error } = await supabase.storage
                .from('attachments')
                .list(`${supplierId}`, { limit: 100 });
            if (!error) {
                setFiles(data);
            }
        };
        fetchFiles();
    }, [supplierId]);

    const handleDownload = async (fileName) => {
        const { data, error } = await supabase.storage
            .from('attachments')
            .download(`${supplierId}/${fileName}`);
        if (!error) {
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <>
            {files.map(file => {
                const categoryPart = file.name?.split('_')[0] || '';
                const label = file.name ? file.name.replace(/^[^_]+_/, '') : file.name;
                return (
                    <li key={file.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b py-2">
                        <div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase mr-2">{categoryPart}</span>
                                <button
                                    onClick={() => handleDownload(file.name)}
                                    className="hover:text-blue-900"
                                >
                                    {label}
                                </button>
                            </div>
                            {file.created_at && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Hochgeladen am: {new Date(file.created_at).toLocaleDateString('de-DE')} {new Date(file.created_at).toLocaleTimeString('de-DE')}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={async () => {
                                const { error } = await supabase.storage
                                    .from('attachments')
                                    .remove([`${supplierId}/${file.name}`]);
                                if (!error) {
                                    setFiles(prev => prev.filter(f => f.name !== file.name));
                                } else {
                                    alert('Fehler beim Löschen der Datei.');
                                }
                            }}
                            className="text-red-600 hover:text-red-800 text-xs mt-2 sm:mt-0 sm:ml-4"
                        >
                            Löschen
                        </button>
                    </li>
                );
            })}
        </>
    );
}