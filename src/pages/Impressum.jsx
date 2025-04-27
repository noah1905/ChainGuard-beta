import React from 'react';

export default function Impressum() {
    return (
        <div className="max-w-3xl mx-auto p-6 text-sm text-gray-800">
            <h1 className="text-2xl font-semibold mb-4">Impressum</h1>

            <p className="mb-2">Angaben gemäß § 5 TMG:</p>

            <p className="mb-2">
                ChainGuard GmbH<br />
                Musterstraße 123<br />
                12345 Berlin<br />
                Deutschland
            </p>

            <p className="mb-4">
                Vertreten durch: Noah Meier<br />
                E-Mail: <a href="mailto:kontakt@chainguard.de" className="text-blue-600 underline">kontakt@chainguard.de</a>
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h2>
            <p>
                Noah Meier<br />
                Musterstraße 123<br />
                12345 Berlin
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">Haftungsausschluss</h2>
            <p className="mb-2">
                Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den
                Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-2">Streitschlichtung</h2>
            <p className="mb-2">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    https://ec.europa.eu/consumers/odr/
                </a>
            </p>
        </div>
    );
}

