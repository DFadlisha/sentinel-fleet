import { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { parseDate } from '../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function AddCar() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    // Manual Form State
    const [form, setForm] = useState({
        plateNumber: '',
        color: '',
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
                color: form.color.toUpperCase(),
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

    // --- EXCEL IMPORT LOGIC ---
    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert("Excel file is empty!");
                    setImporting(false);
                    return;
                }

                const batch = writeBatch(db);
                let count = 0;

                data.forEach((row) => {
                    // Normalize keys (handle case sensitivity or spaces)
                    const plate = row['Plate Number'] || row['plate'] || row['Plate'];

                    if (plate) {
                        // Helper to parse "d/M/yyyy" strict from Excel
                        const getExcelDate = (val) => {
                            if (!val) return null;
                            if (val instanceof Date) return val; // If Excel parsed it as a Date object already
                            return parseDate(String(val).trim()); // Use our existing strict 'dd/MM/yyyy' parser
                        };

                        const newDocRef = doc(collection(db, "cars"));
                        batch.set(newDocRef, {
                            plateNumber: String(plate).toUpperCase(),
                            color: String(row['Color'] || row['Car Color'] || 'UNKNOWN').toUpperCase(),
                            lastServiceDate: getExcelDate(row['Last Service Date'] || row['Last Service']),
                            roadTaxExpiry: getExcelDate(row['Roadtax Expiry'] || row['Roadtax']),
                            insuranceExpiry: getExcelDate(row['Insurance Expiry'] || row['Insurance']),
                            lastServiceMileage: Number(row['Last Service Mileage'] || row['Service Mileage'] || 0),
                            currentMileage: Number(row['Current Mileage'] || row['Mileage'] || 0),
                        });
                        count++;
                    }
                });

                await batch.commit();
                alert(`Successfully imported ${count} vehicles!`);
                navigate('/');
            } catch (err) {
                console.error("Excel Import Error:", err);
                alert("Failed to import Excel. Check format.");
            } finally {
                setImporting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsBinaryString(file);
    };

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
        <div className="p-4 max-w-lg mx-auto mt-8 mb-24">
            <div className="bg-sentinel-card p-8 rounded-xl shadow-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">Register New Unit</h2>

                    {/* Excel Import Button */}
                    <div>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleExcelUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded flex items-center gap-2 transition-colors uppercase tracking-wider"
                            disabled={importing}
                        >
                            {importing ? 'Importing...' : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Import Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Plate Number" name="plateNumber" placeholder="WLA 1234" />
                        <InputField label="Car Color" name="color" placeholder="Midnight Blue" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Last Svc Date (d/m/y)" name="lastServiceDate" placeholder="31/01/2025" />
                        <InputField label="Last Svc Mileage" name="lastServiceMileage" type="number" />
                    </div>

                    <InputField label="Current Mileage" name="currentMileage" type="number" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
