import React, { useEffect, useState, useRef } from 'react';
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Lieferanten-Dashboard</h1>
                <div className="flex flex-col items-end">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded shadow-sm transition"
                    >
                        Logout
                    </button>
                    {isAdmin && (
                        <span className="text-xs text-blue-700 font-medium mt-1">Admin-Modus aktiv</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center p-4 bg-red-100 rounded-lg shadow">
                    <div className="text-3xl mr-4">🟥</div>
                    <div>
                        <p className="text-lg font-semibold text-red-700">Hohes Risiko</p>
                        <p className="text-2xl font-bold">{riskStats.Hoch}</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-yellow-100 rounded-lg shadow">
                    <div className="text-3xl mr-4">🟨</div>
                    <div>
                        <p className="text-lg font-semibold text-yellow-700">Mittleres Risiko</p>
                        <p className="text-2xl font-bold">{riskStats.Mittel}</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-green-100 rounded-lg shadow">
                    <div className="text-3xl mr-4">🟩</div>
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