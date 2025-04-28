import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient.js';
import AddSupplierForm from '@/components/AddSupplierForm.jsx';
import SupplierList from '@/components/SupplierList.jsx';
import AuditLog from '@/components/AuditLog.jsx';
import SupplierDetailsModal from '@/components/SupplierDetailsModal.jsx';
import { useAuditLogger } from '@/hooks/useAuditLogger.js';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        country: '',
        industry: '',
        risk_level: '',
        note: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [riskStats, setRiskStats] = useState({ Hoch: 0, Mittel: 0, Niedrig: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('Alle');
    const [industryFilter, setIndustryFilter] = useState('Alle');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [fileUpload, setFileUpload] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('chainguard_onboarding') !== 'dismissed';
    });
    const navigate = useNavigate();
    const popupRef = useRef(null);

    const {
        auditLogs,
        logActionFilter,
        setLogActionFilter,
        logUserFilter,
        setLogUserFilter,
        handleAuditLogCSVExport,
        handleAuditLogPDFExport
    } = useAuditLogger(isAdmin);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('filters'));
        if (saved) {
            setSearchTerm(saved.searchTerm || '');
            setRiskFilter(saved.riskFilter || 'Alle');
            setIndustryFilter(saved.industryFilter || 'Alle');
        }
    }, []);

    useEffect(() => {
        if (!showOnboarding) {
            localStorage.setItem('chainguard_onboarding', 'dismissed');
        }
    }, [showOnboarding]);

    useEffect(() => {
        localStorage.setItem('filters', JSON.stringify({
            searchTerm,
            riskFilter,
            industryFilter,
        }));
    }, [searchTerm, riskFilter, industryFilter]);

    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
                fetchSuppliers(data.user.id);
            } else {
                navigate('/');
            }
        };
        getUser();
    }, []);

    const fetchSuppliers = async (userId) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', userId);
        if (!error) {
            setSuppliers(data);
            const stats = { Hoch: 0, Mittel: 0, Niedrig: 0 };
            data.forEach((s) => {
                if (s.risk_level && stats[s.risk_level] !== undefined) {
                    stats[s.risk_level]++;
                }
            });
            setRiskStats(stats);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const filteredSuppliers = suppliers.filter((s) =>
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (riskFilter === 'Alle' || s.risk_level === riskFilter) &&
        (industryFilter === 'Alle' || s.industry === industryFilter)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 text-gray-800 px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-40">
                        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">

                            <defs>
                                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#1a1a2e" />
                                    <stop offset="100%" stop-color="#16213e" />
                                </linearGradient>
                                <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#4361ee" />
                                    <stop offset="100%" stop-color="#3a0ca3" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>



                            <path d="M80,150 C120,100 160,200 200,100 C240,50 280,200 320,150" stroke="#4895ef" stroke-width="3" fill="none" stroke-dasharray="1, 5" stroke-linecap="round" filter="url(#glow)" />


                            <circle cx="80" cy="150" r="12" fill="url(#nodeGradient)" filter="url(#glow)" />
                            <circle cx="200" cy="100" r="14" fill="url(#nodeGradient)" filter="url(#glow)" />
                            <circle cx="320" cy="150" r="12" fill="url(#nodeGradient)" filter="url(#glow)" />


                            <path d="M80,150 L200,100 L320,150" stroke="#4cc9f0" stroke-width="2" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />


                            <circle cx="140" cy="180" r="10" fill="url(#nodeGradient)" filter="url(#glow)" />
                            <circle cx="260" cy="180" r="10" fill="url(#nodeGradient)" filter="url(#glow)" />


                            <path d="M80,150 L140,180" stroke="#4cc9f0" stroke-width="2" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />
                            <path d="M140,180 L260,180" stroke="#4cc9f0" stroke-width="2" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />
                            <path d="M260,180 L320,150" stroke="#4cc9f0" stroke-width="2" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />
                            <path d="M200,100 L140,180" stroke="#4cc9f0" stroke-width="1.5" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />
                            <path d="M200,100 L260,180" stroke="#4cc9f0" stroke-width="1.5" stroke-dasharray="8,4" filter="url(#glow)" fill="none" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">ChainGuard Dashboard</h1>
                </div>
                <div className="flex flex-col items-end mt-6 sm:mt-0">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        Logout
                    </button>
                    {showOnboarding && (
                        <div className="mt-4 w-full sm:w-auto bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold">Willkommen bei ChainGuard 🎉</h2>
                                    <p className="mt-1 text-sm">
                                        Starte, indem du deinen ersten Lieferanten hinzufügst. Du kannst Dateien anhängen, Risiken bewerten und Berichte exportieren.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowOnboarding(false)}
                                    className="text-sm text-blue-600 hover:text-blue-800 ml-4"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <span className="text-xs text-blue-700 font-medium mt-1">Admin-Modus aktiv</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                <div className="flex flex-col p-6 bg-red-50 rounded-xl shadow-md transform transition-transform hover:scale-105 hover:shadow-lg">
                    <div>
                        <p className="text-lg font-semibold text-red-700">Hohes Risiko</p>
                        <p className="text-2xl font-bold">{riskStats.Hoch}</p>
                    </div>
                </div>
                <div className="flex flex-col p-6 bg-yellow-50 rounded-xl shadow-md transform transition-transform hover:scale-105 hover:shadow-lg">
                    <div>
                        <p className="text-lg font-semibold text-yellow-700">Mittleres Risiko</p>
                        <p className="text-2xl font-bold">{riskStats.Mittel}</p>
                    </div>
                </div>
                <div className="flex flex-col p-6 bg-green-50 rounded-xl shadow-md transform transition-transform hover:scale-105 hover:shadow-lg">
                    <div>
                        <p className="text-lg font-semibold text-green-700">Niedriges Risiko</p>
                        <p className="text-2xl font-bold">{riskStats.Niedrig}</p>
                    </div>
                </div>
            </div>

            <AddSupplierForm
                user={user}
                newSupplier={newSupplier}
                setNewSupplier={setNewSupplier}
                fetchSuppliers={fetchSuppliers}
                setSuccessMessage={setSuccessMessage}
            />

            {successMessage && (
                <div
                    ref={popupRef}
                    className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300"
                >
                    {successMessage}
                </div>
            )}

            <div className="py-8">
                <SupplierList
                    suppliers={suppliers}
                    filteredSuppliers={filteredSuppliers}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    riskFilter={riskFilter}
                    setRiskFilter={setRiskFilter}
                    industryFilter={industryFilter}
                    setIndustryFilter={setIndustryFilter}
                    riskStats={riskStats}
                    isAdmin={isAdmin}
                    user={user}
                    fetchSuppliers={fetchSuppliers}
                    setSelectedSupplier={setSelectedSupplier}
                />
            </div>

            {isAdmin && (
                <AuditLog
                    auditLogs={auditLogs}
                    logActionFilter={logActionFilter}
                    setLogActionFilter={setLogActionFilter}
                    logUserFilter={logUserFilter}
                    setLogUserFilter={setLogUserFilter}
                    handleAuditLogCSVExport={handleAuditLogCSVExport}
                    handleAuditLogPDFExport={handleAuditLogPDFExport}
                />
            )}

            {isAdmin && (
                <div className="mt-12 bg-gray-50 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Whistleblower-Meldung</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            alert('Deine Meldung wurde sicher übermittelt! (Simulation)');
                        }}
                        className="flex flex-col gap-4"
                    >
                        <textarea
                            placeholder="Beschreibe den Vorfall vertraulich..."
                            className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                            rows="5"
                            required
                        ></textarea>
                        <button
                            type="submit"
                            className="self-start bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow transition"
                        >
                            Sicher Übermitteln
                        </button>
                    </form>
                </div>
            )}

            {selectedSupplier && (
                <SupplierDetailsModal
                    selectedSupplier={selectedSupplier}
                    setSelectedSupplier={setSelectedSupplier}
                    fileUpload={fileUpload}
                    setFileUpload={setFileUpload}
                />
            )}
        </div>
    );
}
