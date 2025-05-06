import React from 'react';

export default function Privacy() {
    return (
        <div className="max-w-3xl mx-auto p-6 text-sm text-gray-800">
            <h1 className="text-2xl font-semibold mb-4">Datenschutzerklärung</h1>

            <p className="mb-2">
                Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich
                auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003).
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">1. Allgemeines zur Datenverarbeitung</h2>
            <p className="mb-2">
                Personenbezogene Daten werden nur im notwendigen Umfang gespeichert, verarbeitet und nicht ohne Ihre ausdrückliche
                Zustimmung weitergegeben.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">2. Kontaktaufnahme</h2>
            <p className="mb-2">
                Bei Kontaktaufnahme mit uns (z. B. via Formular oder E-Mail) werden Ihre Angaben zwecks Bearbeitung der Anfrage
                gespeichert.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">3. Ihre Rechte</h2>
            <ul className="list-disc list-inside mb-4">
                <li>Auskunft über Ihre gespeicherten Daten</li>
                <li>Berichtigung, Löschung oder Einschränkung der Verarbeitung</li>
                <li>Widerspruch gegen die Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
                <li>Beschwerde bei der Datenschutzbehörde</li>
            </ul>

            <p>
                Bei Fragen zum Datenschutz erreichen Sie uns unter{' '}
                <a href="mailto:kontakt@chainguard.de" className="text-blue-600 underline">kontakt@chainguard.de</a>.
            </p>
        </div>
    );
}
