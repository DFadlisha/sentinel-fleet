const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { startOfDay, addDays, isSameDay } = require("date-fns");

admin.initializeApp();
const db = admin.firestore();

// "Sentinel Watchdog" - Runs every day at 09:00 KL Time
exports.sentinelDailyCheck = onSchedule("every day 09:00", async (event) => {
    const today = startOfDay(new Date());
    const warningDate = addDays(today, 7); // Exactly 7 days from now

    const snapshot = await db.collection('cars').get();

    snapshot.forEach(doc => {
        const car = doc.data();

        // 1. Check Roadtax
        if (car.roadTaxExpiry) {
            const expiry = car.roadTaxExpiry.toDate();
            if (isSameDay(expiry, warningDate)) {
                console.log(`[ALERT] Roadtax for ${car.plateNumber} expires in exactly 7 days.`);
                // You can add Email/Push Notification logic here
            }
        }

        // 2. Check Insurance
        if (car.insuranceExpiry) {
            const expiry = car.insuranceExpiry.toDate();
            if (isSameDay(expiry, warningDate)) {
                console.log(`[ALERT] Insurance for ${car.plateNumber} expires in exactly 7 days.`);
            }
        }
    });
});
