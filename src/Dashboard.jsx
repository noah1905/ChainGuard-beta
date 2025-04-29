import '@/styles/animations.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/supabaseClient.js';
import AddSupplierForm from '@/components/AddSupplierForm.jsx';
import SupplierList from '@/components/SupplierList.jsx';
import AuditLog from '@/components/AuditLog.jsx';
import SupplierDetailsModal from '@/components/SupplierDetailsModal.jsx';
import { useAuditLogger } from '@/hooks/useAuditLogger.js';
import Sidebar from '@/components/Sidebar.jsx';

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

    const location = useLocation();
    let pageTitle = "Dashboard";
    if (location.pathname.includes('suppliers')) pageTitle = "Lieferanten";
    else if (location.pathname.includes('audit')) pageTitle = "Audit Log";
    else if (location.pathname.includes('whistleblower')) pageTitle = "Whistleblower";

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
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
            <Sidebar />
            <div className="animate-fadein">
                <main className="ml-64 flex-1 px-8 py-10 text-gray-800 bg-white shadow-inner rounded-tl-3xl min-h-screen transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
                        <div className="flex items-center gap-6">
                            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">{pageTitle}</h1>
                        </div>
                        <div className="flex flex-col items-end mt-6 sm:mt-0">
                            {showOnboarding && (
                                <div className="mt-4 w-full sm:w-auto bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-lg font-semibold">Willkommen bei ChainGuard</h2>
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                        {[
                            { level: 'Hohes Risiko', count: riskStats.Hoch, bg: 'bg-red-100', text: 'text-red-700' },
                            { level: 'Mittleres Risiko', count: riskStats.Mittel, bg: 'bg-yellow-100', text: 'text-yellow-700' },
                            { level: 'Niedriges Risiko', count: riskStats.Niedrig, bg: 'bg-green-100', text: 'text-green-700' },
                        ].map(({ level, count, bg, text }) => (
                            <div
                                key={level}
                                className={`flex flex-col items-center justify-center p-6 rounded-3xl shadow-md text-center ${bg} hover:shadow-lg transition-shadow duration-300 ease-in-out`}
                            >
                                <p className={`text-sm font-medium uppercase ${text}`}>{level}</p>
                                <p className="text-4xl font-extrabold text-gray-900 mt-2">{count}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow p-8 mb-12">
                        <AddSupplierForm
                            user={user}
                            newSupplier={newSupplier}
                            setNewSupplier={setNewSupplier}
                            fetchSuppliers={fetchSuppliers}
                            setSuccessMessage={setSuccessMessage}
                        />

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
                    </div>

                    {successMessage && (
                        <div
                            ref={popupRef}
                            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300"
                        >
                            {successMessage}
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow p-8 mt-12">
                            <AuditLog
                                auditLogs={auditLogs}
                                logActionFilter={logActionFilter}
                                setLogActionFilter={setLogActionFilter}
                                logUserFilter={logUserFilter}
                                setLogUserFilter={setLogUserFilter}
                                handleAuditLogCSVExport={handleAuditLogCSVExport}
                                handleAuditLogPDFExport={handleAuditLogPDFExport}
                            />
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow p-8 mt-12">
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
                </main>
            </div>
        </div>
    );
}
