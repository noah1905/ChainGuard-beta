import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from '../client.js';

const countries = [
    { value: 'Deutschland', label: 'Deutschland' },
    { value: 'Österreich', label: 'Österreich' },
    { value: 'Schweiz', label: 'Schweiz' },
    { value: 'Frankreich', label: 'Frankreich' },
    { value: 'Italien', label: 'Italien' },
    { value: 'Spanien', label: 'Spanien' },
    { value: 'Niederlande', label: 'Niederlande' },
    { value: 'Belgien', label: 'Belgien' },
    { value: 'USA', label: 'USA' },
    { value: 'Kanada', label: 'Kanada' },
    { value: 'China', label: 'China' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Indien', label: 'Indien' },
    { value: 'Vereinigtes Königreich', label: 'Vereinigtes Königreich' }
];

export default function AddSupplierForm({ user, newSupplier, setNewSupplier, fetchSuppliers, setSuccessMessage }) {
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [consentGiven, setConsentGiven] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setFeedbackMessage('');

        const { id, ...rest } = newSupplier;
        const payload = { ...rest, user_id: user.id };

        let error;
        if (newSupplier.id) {
            ({ error } = await supabase
                .from('suppliers')
                .update(payload)
                .eq('id', newSupplier.id));
        } else {
            ({ error } = await supabase.from('suppliers').insert([payload]));
        }

        if (error) {
            setFeedbackMessage('❌ Fehler beim Speichern. Bitte versuche es erneut.');
            setIsSubmitting(false);
            return;
        }

        setNewSupplier({ name: '', country: '', industry: '', risk_level: '', risk_category: '', note: '' });
        fetchSuppliers(user.id);
        const successText = newSupplier.id ? '✅ Lieferant aktualisiert!' : '✅ Lieferant hinzugefügt!';
        setSuccessMessage(successText);
        setFeedbackMessage(successText);
        setIsSubmitting(false);
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
        <form onSubmit={handleSubmit} className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        placeholder="Name des Lieferanten"
                        required
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                        Land
                    </label>
                    <select
                        id="country"
                        required
                        value={newSupplier.country}
                        onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
                    >
                        <option value="">Land wählen...</option>
                        <option value="DE">Deutschland</option>
                        <option value="AT">Österreich</option>
                        <option value="CH">Schweiz</option>
                        {/* Weitere Länder */}
                    </select>
                </div>

                <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                        Branche
                    </label>
                    <input
                        type="text"
                        id="industry"
                        placeholder="z.B. Elektronik, Textil, Lebensmittel"
                        required
                        value={newSupplier.industry}
                        onChange={(e) => setNewSupplier({ ...newSupplier, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700 mb-1">
                        Risikostufe
                    </label>
                    <select
                        id="riskLevel"
                        required
                        value={newSupplier.riskLevel}
                        onChange={(e) => setNewSupplier({ ...newSupplier, riskLevel: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
                    >
                        <option value="">Risikostufe wählen</option>
                        <option value="Niedrig">Niedrig</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Hoch">Hoch</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="riskCategory" className="block text-sm font-medium text-gray-700 mb-1">
                        Gefährdungskategorie
                    </label>
                    <select
                        id="riskCategory"
                        value={newSupplier.risk_category || ''}
                        onChange={(e) => setNewSupplier({ ...newSupplier, risk_category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all"
                    >
                        <option value="">Kategorie wählen</option>
                        <option value="Menschenrechte">Menschenrechte</option>
                        <option value="Kinderarbeit">Kinderarbeit</option>
                        <option value="Umweltrisiken">Umweltrisiken</option>
                        <option value="Korruption">Korruption</option>
                        <option value="Diskriminierung">Diskriminierung</option>
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notiz (optional)
                </label>
                <textarea
                    id="notes"
                    placeholder="Zusätzliche Informationen zum Lieferanten..."
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="4"
                ></textarea>
            </div>

            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="dsgvo"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="dsgvo" className="ml-2 block text-sm text-gray-700">
                    Ich bestätige, dass die Angaben den <a href="#" className="text-blue-600 hover:text-blue-800">DSGVO-Richtlinien</a> entsprechen.
                </label>
            </div>

            <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-lg shadow-md transition-all duration-300 hover:shadow-lg flex items-center gap-2"
            >
                <span>Hinzufügen</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
        </form>
    );
}
