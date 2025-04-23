import React from 'react';
import { useState } from "react";

export default function ChainGuardLandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // Hier könntest du später z. B. eine API oder ein Newsletter-Tool anbinden
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          ChainGuard – Lieferketten-Compliance einfach gemacht
        </h1>
        <p className="text-lg md:text-xl mb-8">
          Digitale Lösung für das Lieferkettensorgfaltspflichtengesetz – speziell für KMU.
        </p>
        {!submitted ? (
          <form
            action="https://formspree.io/f/manoydkl"
            method="POST"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Deine E-Mail für die Beta"
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full sm:w-80"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Beta beitreten
            </button>
          </form>
        ) : (
          <p className="text-green-500 font-medium text-lg mt-4">Danke! Du bist vorgemerkt.</p>
        )}
      </section>

      {/* Gesetz-Erklärung */}
      <section className="px-6 py-16 bg-white dark:bg-gray-900 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Was ist das Lieferkettengesetz?</h2>
        <p className="text-lg">
          Das Lieferkettensorgfaltspflichtengesetz (LkSG) verpflichtet Unternehmen in Deutschland dazu, ab 2026 menschenrechtliche und umweltbezogene Risiken in ihren globalen Lieferketten zu identifizieren, zu minimieren und darüber zu berichten. Unternehmen ab 1.000 Mitarbeitenden sind betroffen – und müssen aktiv Maßnahmen treffen.
        </p>
      </section>

      {/* Lösung durch ChainGuard */}
      <section className="px-6 py-16 bg-blue-50 dark:bg-gray-800 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Wie ChainGuard dich unterstützt</h2>
        <ul className="space-y-4 text-lg">
          <li>✅ Automatisierte Lieferantenerfassung & Kommunikation</li>
          <li>✅ Integrierte Risikoanalyse & Scoring nach Region/Branche</li>
          <li>✅ Fragebogen-Versand mit Antworttracking</li>
          <li>✅ Compliance-Berichte für Behörden & Management</li>
          <li>✅ Whistleblower-Funktion (optional erweiterbar)</li>
        </ul>
      </section>

      {/* Screenshot-Bereich */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">So sieht ChainGuard aus</h2>
        <img
          src="/chainguard-mockup.png"
          alt="ChainGuard Mockup"
          className="mx-auto rounded-2xl shadow-xl"
        />
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        © 2025 ChainGuard. Made with ❤️ in Germany. | Impressum | Datenschutz
      </footer>
    </div>
  );
}