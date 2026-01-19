import { LocalNotifications } from '@capacitor/local-notifications';
import { differenceInDays, subDays } from 'date-fns';

export const scheduleCleanNotifications = async (cars) => {
    // 1. Cancel all existing notifications to avoid duplicates when data refreshes
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
    }

    const notifications = [];
    let idCounter = 1;

    cars.forEach(car => {
        // --- Schedule Roadtax Warning (7 Days Before) ---
        if (car.roadTaxExpiry) {
            const expiry = car.roadTaxExpiry.toDate();
            const warningDate = subDays(expiry, 7); // Notify 7 days before

            // Only schedule if the warning date is in the future
            if (differenceInDays(warningDate, new Date()) > 0) {
                notifications.push({
                    title: "⚠️ Roadtax Expiring Soon!",
                    body: `The Roadtax for ${car.plateNumber} will expire in 7 days.`,
                    id: idCounter++,
                    schedule: { at: warningDate },
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                });
            }
        }

        // --- Schedule Insurance Warning (7 Days Before) ---
        if (car.insuranceExpiry) {
            const expiry = car.insuranceExpiry.toDate();
            const warningDate = subDays(expiry, 7);

            if (differenceInDays(warningDate, new Date()) > 0) {
                notifications.push({
                    title: "📄 Insurance Expiring Soon!",
                    body: `The Insurance for ${car.plateNumber} will expire in 7 days.`,
                    id: idCounter++,
                    schedule: { at: warningDate },
                });
            }
        }
    });

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[Sentintel] Scheduled ${notifications.length} local notifications.`);
    }
};

export const requestNotificationPermission = async () => {
    const result = await LocalNotifications.requestPermissions();
    return result.display;
};
