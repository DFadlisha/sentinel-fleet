import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { parseDate } from '../utils/dateHelpers';

export default function ReportIncident() {
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedCarId, setSelectedCarId] = useState('');
    const [incidentType, setIncidentType] = useState('Accident');
    const [severity, setSeverity] = useState('Medium');
    const [description, setDescription] = useState('');
    const [incidentDate, setIncidentDate] = useState('');

    useEffect(() => {
        // Fetch cars for the dropdown
        const unsubscribe = onSnapshot(collection(db, 'cars'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCars(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCarId) {
            alert("Please select a vehicle.");
            return;
        }

        const dateObj = parseDate(incidentDate);
        if (!dateObj) {
            alert("Invalid Date! Please use format: dd/mm/yyyy");
            return;
        }

        const selectedCar = cars.find(c => c.id === selectedCarId);

        try {
            await addDoc(collection(db, "incidents"), {
                carId: selectedCarId,
                plateNumber: selectedCar.plateNumber,
                type: incidentType,
                severity: severity,
                description: description,
                date: dateObj,
                status: 'OPEN', // OPEN, RESOLVED
                timestamp: new Date()
            });

            alert("Incident Report Submitted Successfully.");
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("Error submitting report.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Fleet Data...</div>;

    return (
        <div className="p-4 max-w-lg mx-auto mt-4 mb-20">
            <div className="bg-sentinel-card p-6 rounded-xl shadow-2xl border border-red-900/30">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                    <div className="bg-red-600 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Report Incident</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Vehicle Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Affected Vehicle</label>
                        <select
                            value={selectedCarId}
                            onChange={(e) => setSelectedCarId(e.target.value)}
                            className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500 font-mono"
                            required
                        >
                            <option value="">-- Select Vehicle --</option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>{car.plateNumber}</option>
                            ))}
                        </select>
                    </div>

                    {/* Incident Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Type</label>
                            <select
                                value={incidentType}
                                onChange={(e) => setIncidentType(e.target.value)}
                                className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500"
                            >
                                <option value="Accident">Accident</option>
                                <option value="Breakdown">Breakdown</option>
                                <option value="Damage">Ext. Damage</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Severity</label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Date of Incident (d/m/y)</label>
                        <input
                            type="text"
                            value={incidentDate}
                            placeholder="31/01/2026"
                            onChange={(e) => setIncidentDate(e.target.value)}
                            className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500 font-mono"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Description of Damage</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            placeholder="Describe what happened..."
                            className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-4">
                        <button type="submit" className="w-full bg-red-600 text-white p-4 rounded-lg font-bold tracking-widest hover:bg-red-700 shadow-lg uppercase flex items-center justify-center gap-2">
                            <span>Save Report</span>
                        </button>
                    </div>

                    {/* External Sharing */}
                    <div className="border-t border-gray-800 pt-6 mt-6">
                        <p className="text-center text-gray-500 text-xs uppercase tracking-widest mb-4 font-bold">Or Submit Externally</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!selectedCarId) return alert("Select a vehicle first!");
                                    const car = cars.find(c => c.id === selectedCarId);
                                    const text = `*INCIDENT REPORT*\n\n*Vehicle:* ${car.plateNumber}\n*Type:* ${incidentType}\n*Severity:* ${severity}\n*Date:* ${incidentDate}\n*Description:* ${description}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                <span>WhatsApp</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!selectedCarId) return alert("Select a vehicle first!");
                                    const car = cars.find(c => c.id === selectedCarId);
                                    const subject = `Incident Report: ${car.plateNumber}`;
                                    const body = `Vehicle: ${car.plateNumber}%0D%0AType: ${incidentType}%0D%0ASeverity: ${severity}%0D%0ADate: ${incidentDate}%0D%0ADescription: ${description}`;
                                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                                }}
                                className="bg-gray-100 hover:bg-white text-gray-900 p-3 rounded font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Email</span>
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
