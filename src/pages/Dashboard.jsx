import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatDate } from '../utils/dateHelpers';
import { getCarStatus } from '../utils/serviceLogic';

export default function Dashboard() {
    const [cars, setCars] = useState([]);

    useEffect(() => {
        // Real-time listener for database changes
        const unsubscribe = onSnapshot(collection(db, 'cars'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCars(list);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 mt-4">
                <h2 className="text-2xl font-bold text-gray-200 tracking-tight">Live Fleet Status</h2>
                <span className="bg-sentinel-card px-3 py-1 rounded text-xs text-gray-400 font-mono border border-gray-700">
                    UNITS: {cars.length}
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cars.map(car => {
                    const { status, alerts } = getCarStatus(car);

                    // Logic to determine card colors
                    let borderClass = 'border-gray-700';
                    let statusColor = 'bg-sentinel-green text-black';

                    if (status === 'CRITICAL') {
                        borderClass = 'border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                        statusColor = 'bg-red-600 text-white animate-pulse';
                    } else if (status === 'WARNING') {
                        borderClass = 'border-yellow-600';
                        statusColor = 'bg-yellow-500 text-black';
                    }

                    return (
                        <div key={car.id} className={`bg-sentinel-card rounded-xl border-l-4 p-5 ${borderClass} relative overflow-hidden transition-transform hover:scale-[1.02]`}>

                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-black text-white tracking-tight">{car.plateNumber}</h3>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider ${statusColor}`}>
                                    {status}
                                </span>
                            </div>

                            {/* Data Rows */}
                            <div className="space-y-3 text-sm text-gray-400 font-mono">
                                <div className="flex justify-between border-b border-gray-700 pb-1">
                                    <span>Current Mileage</span>
                                    <span className="text-white">{car.currentMileage?.toLocaleString() ?? 0} km</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-1">
                                    <span>Last Service</span>
                                    <span className="text-white">{formatDate(car.lastServiceDate)}</span>
                                </div>
                                <div className="flex justify-between pb-1">
                                    <span>Roadtax Exp</span>
                                    <span className="text-white">{formatDate(car.roadTaxExpiry)}</span>
                                </div>
                            </div>

                            {/* Alerts Footer */}
                            {alerts.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-dashed border-gray-600 bg-red-900/10 -mx-5 px-5 pb-1">
                                    {alerts.map((msg, i) => (
                                        <div key={i} className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wide mb-2">
                                            <span>⚠️</span> {msg}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
