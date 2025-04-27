import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setMessage("");

        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            const sessionCheck = await supabase.auth.getSession();

            if (error || !sessionCheck.data.session) {
                setMessage("Fehler: Login nicht erfolgreich.");
            } else {
                navigate("/dashboard");
            }
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                setMessage("Fehler: " + error.message);
            } else {
                setMessage("Registrierung erfolgreich. Bitte bestätige deine E-Mail.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">
                    {isLogin ? "Login" : "Registrieren"}
                </h1>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="E-Mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
                    >
                        {isLogin ? "Einloggen" : "Registrieren"}
                    </button>
                </form>
                <p className="text-sm mt-4 text-center">
                    {isLogin ? "Noch kein Konto?" : "Schon registriert?"} {" "}
                    <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Jetzt registrieren" : "Zum Login wechseln"}
                    </button>
                </p>
                {message && (
                    <p className="mt-4 text-sm text-center text-green-500 dark:text-green-400">{message}</p>
                )}
            </div>
        </div>
    );
}
