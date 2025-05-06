import { useState, useEffect } from 'react';
import { supabase } from '../client.js';

export default function Whistleblower() {
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState('');
    const [reports, setReports] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
                if (profile?.role === 'admin') {
                    fetchReports();
                }
            }
        };
        checkUser();
    }, []);

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('whistleblower_reports')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setReports(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            setFeedback('Bitte gib eine Nachricht ein.');
            return;
        }

        if (showConfirmation) {
            const { error } = await supabase.from('whistleblower_reports').insert([
                { message, status: 'Offen' }
            ]);
            if (error) {
                setFeedback('Fehler beim Absenden der Meldung. Bitte versuche es erneut.');
            } else {
                setFeedback('Vielen Dank für deine anonyme Meldung!');
                setMessage('');
                setShowConfirmation(false);
                if (isAdmin) fetchReports();
            }
        } else {
            setShowConfirmation(true);
        }
    };

    const updateReportStatus = async (id, newStatus) => {
        const { error } = await supabase
            .from('whistleblower_reports')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (!error) fetchReports();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Anonyme Meldung</h1>

                {/* Meldungsformular */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
                    <div className="relative">
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-4 resize-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                            rows="6"
                            placeholder="Beschreibe hier den Vorfall..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                        {feedback && !showConfirmation && (
                            <p className="mt-2 text-sm text-red-600">{feedback}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow-md transition disabled:bg-blue-400"
                        disabled={!message.trim() && !showConfirmation}
                    >
                        {showConfirmation ? 'Bestätigen und senden' : 'Sicher übermitteln'}
                    </button>
                    {showConfirmation && (
                        <p className="text-sm text-gray-600 mt-2">
                            Bist du sicher? Diese Meldung wird anonym übermittelt und kann nicht zurückgezogen werden.
                            <button
                                type="button"
                                onClick={() => setShowConfirmation(false)}
                                className="ml-2 text-red-600 hover:text-red-800"
                            >
                                Abbrechen
                            </button>
                        </p>
                    )}
                    {feedback && !showConfirmation && (
                        <div className="mt-4 text-center text-sm text-green-700">{feedback}</div>
                    )}
                </form>

                {/* Meldungsübersicht (für Admin) */}
                {isAuthenticated && isAdmin && reports.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Eingereichte Meldungen</h2>
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div key={report.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <p className="text-gray-700">{report.message}</p>
                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                        <span>Status: {report.status}</span>
                                        <span>Datum: {new Date(report.created_at).toLocaleDateString()}</span>
                                        {report.updated_at && <span>Letzte Änderung: {new Date(report.updated_at).toLocaleDateString()}</span>}
                                    </div>
                                    <select
                                        value={report.status}
                                        onChange={(e) => updateReportStatus(report.id, e.target.value)}
                                        className="mt-2 p-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="Offen">Offen</option>
                                        <option value="In Bearbeitung">In Bearbeitung</option>
                                        <option value="Abgeschlossen">Abgeschlossen</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {isAuthenticated && isAdmin && reports.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">Keine Meldungen vorhanden.</p>
                )}
            </div>
        </div>
    );
}