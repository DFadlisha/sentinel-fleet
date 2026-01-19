import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { parseDate } from '../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';

export default function AddCar() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        plateNumber: '',
        lastServiceDate: '',
        lastServiceMileage: '',
        currentMileage: '',
        roadTaxExpiry: '',
        insuranceExpiry: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Parse strings to Date Objects
            const lsDate = parseDate(form.lastServiceDate);
            const rtDate = parseDate(form.roadTaxExpiry);
            const inDate = parseDate(form.insuranceExpiry);

            if (!lsDate || !rtDate || !inDate) {
                alert("Invalid Date! Please use strict format: dd/mm/yyyy");
                return;
            }

            await addDoc(collection(db, "cars"), {
                plateNumber: form.plateNumber.toUpperCase(),
                lastServiceDate: lsDate,
                roadTaxExpiry: rtDate,
                insuranceExpiry: inDate,
                lastServiceMileage: Number(form.lastServiceMileage),
                currentMileage: Number(form.currentMileage),
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("System Error. Check console.");
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Reusable Input Component
    const InputField = ({ label, name, type = "text", placeholder }) => (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">{label}</label>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                onChange={handleChange}
                className="w-full bg-sentinel-bg border border-gray-600 text-white p-3 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                required
            />
        </div>
    );

    return (
        <div className="p-4 max-w-lg mx-auto mt-8">
            <div className="bg-sentinel-card p-8 rounded-xl shadow-2xl border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Register New Unit</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <InputField label="Plate Number" name="plateNumber" placeholder="WLA 1234" />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Last Svc Date (d/m/y)" name="lastServiceDate" placeholder="31/01/2025" />
                        <InputField label="Last Svc Mileage" name="lastServiceMileage" type="number" />
                    </div>

                    <InputField label="Current Mileage" name="currentMileage" type="number" />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Roadtax Exp (d/m/y)" name="roadTaxExpiry" placeholder="15/05/2026" />
                        <InputField label="Insurance Exp (d/m/y)" name="insuranceExpiry" placeholder="15/05/2026" />
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white p-4 rounded font-bold tracking-widest hover:brightness-110 shadow-lg mt-6 uppercase">
                        Initialize Unit
                    </button>
                </form>
            </div>
        </div>
    );
}
