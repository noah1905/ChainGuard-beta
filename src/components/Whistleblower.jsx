import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Whistleblower() {
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            setFeedback('Bitte gib eine Nachricht ein.');
            return;
        }

        const { error } = await supabase.from('whistleblower_reports').insert([
            { message }
        ]);

        if (error) {
            setFeedback('Fehler beim Absenden der Meldung. Bitte versuche es erneut.');
        } else {
            setFeedback('Vielen Dank für deine anonyme Meldung!');
            setMessage('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Anonyme Meldung</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-4 resize-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                        rows="6"
                        placeholder="Beschreibe hier den Vorfall..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow-md transition"
                    >
                        Sicher übermitteln
                    </button>
                    {feedback && (
                        <div className="mt-4 text-center text-sm text-gray-700">{feedback}</div>
                    )}
                </form>
            </div>
        </div>
    );
}
