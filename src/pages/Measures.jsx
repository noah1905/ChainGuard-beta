import { useEffect, useState } from 'react';
import { supabase } from '../client';

export default function Measures() {
  const [measures, setMeasures] = useState([]);
  const [newMeasure, setNewMeasure] = useState({
    description: '',
    supplier_id: '',
    due_date: ''
  });
  const [filter, setFilter] = useState('alle');

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

  return (
    <div className="p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Maßnahmen</h1>

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
            .filter((m) =>
              filter === 'alle' ? true : m.status === filter
            )
            .map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{m.description}</td>
                <td className="p-2">{m.suppliers?.name || m.supplier_id}</td>
                <td className="p-2">{m.due_date}</td>
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
    </div>
  );
}