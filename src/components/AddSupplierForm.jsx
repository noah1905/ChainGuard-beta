import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient'; // Update to use the @ alias

export default function AddSupplierForm({ user, newSupplier, setNewSupplier, fetchSuppliers, setSuccessMessage }) {
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [consentGiven, setConsentGiven] = useState(false);

    const handleChange = (e) => {
        setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        const { id, ...rest } = newSupplier;
        const payload = { ...rest, user_id: user.id };

        let error;
        if (newSupplier.id) {
            ({ error } = await supabase
                .from('suppliers')
                .update(payload)
                .eq('id', newSupplier.id));
            if (error) {
                setFeedbackMessage('Fehler beim Hinzufügen des Lieferanten. Bitte versuche es erneut.');
                return;
            }
        } else {
            ({ error } = await supabase.from('suppliers').insert([payload]));
            if (error) {
                setFeedbackMessage('Fehler beim Hinzufügen des Lieferanten. Bitte versuche es erneut.');
                return;
            }
        }

        setNewSupplier({ name: '', country: '', industry: '', risk_level: '', note: '' });
        fetchSuppliers(user.id);
        const successText = newSupplier.id ? 'Lieferant aktualisiert!' : 'Lieferant hinzugefügt!';
        setSuccessMessage(successText);
        setFeedbackMessage(successText);
    };

    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    useEffect(() => {
        if (newSupplier?.id) {
            setConsentGiven(true); // optional: vorausgewählte Zustimmung
        }
    }, [newSupplier]);

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-4 sm:p-6 rounded shadow mb-6 space-y-4"
        >
            <h2 className="text-xl font-semibold">Neuen Lieferanten hinzufügen</h2>
            {feedbackMessage && (
                <div className={`mb-4 px-4 py-2 rounded ${feedbackMessage.includes('Fehler')
                    ? 'bg-red-100 border border-red-400 text-red-800'
                    : 'bg-green-100 border border-green-400 text-green-800'
                    }`}>
                    {feedbackMessage}
                </div>
            )}
            <input
                type="text"
                name="name"
                value={newSupplier.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full border px-4 py-2 rounded text-sm"
                required
            />
            <input
                type="text"
                name="country"
                value={newSupplier.country}
                onChange={handleChange}
                placeholder="Land"
                className="w-full border px-4 py-2 rounded text-sm"
            />
            <input
                type="text"
                name="industry"
                value={newSupplier.industry}
                onChange={handleChange}
                placeholder="Branche"
                className="w-full border px-4 py-2 rounded text-sm"
            />
            <input
                type="text"
                name="risk_level"
                value={newSupplier.risk_level}
                onChange={handleChange}
                placeholder="Risikostufe (z. B. Hoch, Mittel, Niedrig)"
                className="w-full border px-4 py-2 rounded text-sm"
            />
            <textarea
                name="note"
                value={newSupplier.note}
                onChange={handleChange}
                placeholder="Notiz (optional)"
                className="w-full border px-4 py-2 rounded text-sm"
            />
            <div className="flex items-start space-x-2">
                <input
                    type="checkbox"
                    id="consent"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1"
                    required
                />
                <label htmlFor="consent" className="text-sm text-gray-700">
                    Ich bestätige, dass die Angaben den <a href="/datenschutz" className="text-blue-600 underline">DSGVO-Richtlinien</a> entsprechen.
                </label>
            </div>
            <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={!consentGiven}
            >
                {newSupplier?.id ? 'Aktualisieren' : 'Hinzufügen'}
            </button>
        </form>
    );
}
