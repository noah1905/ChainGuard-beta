import { Link } from 'react-router-dom';

export default function Danke() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-green-600 mb-6">Danke für deine Anmeldung!</h1>
            <p className="text-lg text-gray-700 mb-8 text-center">
                Wir haben deine Anfrage erhalten. Wir melden uns in Kürze bei dir.
            </p>
            <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition"
            >
                Zurück zur Startseite
            </Link>
        </div>
    );
}