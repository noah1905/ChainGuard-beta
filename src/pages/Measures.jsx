import { useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import { supabase } from '../client.js';
import { isBefore, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Measures() {
  const [measures, setMeasures] = useState([]);
  const [newMeasure, setNewMeasure] = useState({
    description: '',
    supplier_id: '',
    due_date: ''
  });
  const [filter, setFilter] = useState('alle');
  const [sortAsc, setSortAsc] = useState(true);

  // Risikoanalyse Zustände
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskAnswers, setRiskAnswers] = useState({
    umwelt: false,
    kinderarbeit: false,
    arbeitsschutz: false,
    audit: false
  });
  const [riskScore, setRiskScore] = useState(null);

  // Überfällige offene Maßnahmen zählen
  const overdueCount = measures.filter(
    (m) =>
      m.due_date &&
      isBefore(parseISO(m.due_date), new Date()) &&
      m.status !== 'erledigt'
  ).length;

  const fetchMeasures = async () => {
    const { data, error } = await supabase
      .from('measures')
      .select('*, suppliers(name)')
      .order('due_date', { ascending: true });

    if (!error) setMeasures(data);
  };

  useEffect(() => {
    fetchMeasures();
  }, []);

  const handleAdd = async () => {
    if (!newMeasure.description || !newMeasure.supplier_id || !newMeasure.due_date) return;

    const { error } = await supabase.from('measures').insert([newMeasure]);
    if (!error) {
      setNewMeasure({ description: '', supplier_id: '', due_date: '' });
      fetchMeasures();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'offen' ? 'erledigt' : 'offen';
    const { error } = await supabase
      .from('measures')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchMeasures();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ChainGuard – Maßnahmenbericht', 14, 20);
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(
      'Die folgenden Maßnahmen wurden im Rahmen der Sorgfaltspflichten gemäß Lieferkettengesetz erfasst.',
      14,
      36
    );

    autoTable(doc, {
      startY: 44,
      head: [['Beschreibung', 'Lieferant', 'Fällig bis', 'Status']],
      body: measures.map((m) => [
        m.description,
        m.suppliers?.name || m.supplier_id,
        m.due_date || '',
        m.status
      ])
    });

    doc.save('massnahmenbericht.pdf');
  };

  return (
    <div className="p-6 text-gray-800">
      <div className="mb-4">
        <button
          onClick={() => setShowRiskModal(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Lieferanten-Risikoanalyse
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Maßnahmen</h1>
      {overdueCount > 0 && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
          ⚠️ {overdueCount} Maßnahme(n) überfällig – bitte prüfen!
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Neue Maßnahme</h2>
        <input
          type="text"
          placeholder="Beschreibung"
          value={newMeasure.description}
          onChange={(e) => setNewMeasure({ ...newMeasure, description: e.target.value })}
          className="border px-3 py-2 mr-2 rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Lieferanten-ID"
          value={newMeasure.supplier_id}
          onChange={(e) => setNewMeasure({ ...newMeasure, supplier_id: e.target.value })}
          className="border px-3 py-2 mr-2 rounded w-full mb-2"
        />
        <input
          type="date"
          value={newMeasure.due_date}
          onChange={(e) => setNewMeasure({ ...newMeasure, due_date: e.target.value })}
          className="border px-3 py-2 mr-2 rounded w-full mb-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Hinzufügen
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        {['alle', 'offen', 'erledigt'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              } hover:bg-blue-500 hover:text-white transition`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <button
          onClick={exportPDF}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          PDF-Bericht exportieren
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="text-sm text-blue-600 hover:underline"
        >
          Nach Fälligkeit {sortAsc ? '↓' : '↑'}
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="p-2">Beschreibung</th>
            <th className="p-2">Lieferant</th>
            <th className="p-2">Fällig bis</th>
            <th className="p-2">Status</th>
            <th className="p-2">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {measures
            .filter((m) => (filter === 'alle' ? true : m.status === filter))
            .sort((a, b) => {
              if (!a.due_date || !b.due_date) return 0;
              return sortAsc
                ? new Date(a.due_date) - new Date(b.due_date)
                : new Date(b.due_date) - new Date(a.due_date);
            })
            .map((m) => (
              <tr
                key={m.id}
                className={`border-b ${m.due_date && isBefore(parseISO(m.due_date), new Date()) && m.status !== 'erledigt'
                  ? 'bg-red-100'
                  : ''
                  }`}
              >
                <td className="p-2">{m.description}</td>
                <td className="p-2">{m.suppliers?.name || m.supplier_id}</td>
                <td className="p-2">
                  {m.due_date}
                  {m.due_date && isBefore(parseISO(m.due_date), new Date()) && m.status !== 'erledigt' && (
                    <span className="ml-2 text-xs text-red-600 font-semibold">Überfällig</span>
                  )}
                </td>
                <td className="p-2">{m.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => toggleStatus(m.id, m.status)}
                    className="text-blue-600 hover:underline"
                  >
                    {m.status === 'offen' ? 'Erledigt' : 'Rückgängig'}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
            <h2 className="text-xl font-semibold mb-4">Lieferanten-Risikoanalyse</h2>

            {[
              { key: 'umwelt', label: 'Hat der Lieferant ein Umweltzertifikat?' },
              { key: 'kinderarbeit', label: 'Gibt es eine Kinderarbeitsrichtlinie?' },
              { key: 'arbeitsschutz', label: 'Wird Arbeitsschutz regelmäßig geprüft?' },
              { key: 'audit', label: 'Wurde der Lieferant intern auditiert?' }
            ].map((q) => (
              <div key={q.key} className="mb-2">
                <label className="block mb-1 text-sm font-medium">{q.label}</label>
                <select
                  value={riskAnswers[q.key] ? 'ja' : 'nein'}
                  onChange={(e) =>
                    setRiskAnswers((prev) => ({
                      ...prev,
                      [q.key]: e.target.value === 'ja'
                    }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="nein">Nein</option>
                  <option value="ja">Ja</option>
                </select>
              </div>
            ))}

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  let score = 0;
                  Object.values(riskAnswers).forEach((answer) => {
                    if (!answer) score += 20;
                  });
                  setRiskScore(score);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Analyse durchführen
              </button>
              <button
                onClick={() => {
                  setShowRiskModal(false);
                  setRiskScore(null);
                }}
                className="text-gray-600 px-4 py-2"
              >
                Schließen
              </button>
            </div>

            {riskScore !== null && (
              <div className="mt-4 p-4 rounded bg-gray-100">
                <p className="text-sm font-medium">Risikowert: <strong>{riskScore} / 100</strong></p>
                <p className={`text-sm mt-1 ${riskScore > 60 ? 'text-red-600' : riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                  Risikostufe: {riskScore > 60 ? 'Hoch' : riskScore > 40 ? 'Mittel' : 'Niedrig'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}