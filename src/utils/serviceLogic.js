import { addMonths, isAfter, differenceInDays } from 'date-fns';

export const getCarStatus = (car) => {
    const today = new Date();
    const alerts = [];
    let status = 'ACTIVE';

    // --- RULE 1: SERVICE (Time - 3 Months) ---
    if (car.lastServiceDate) {
        const lastService = car.lastServiceDate.toDate();
        const nextServiceDate = addMonths(lastService, 3);

        if (isAfter(today, nextServiceDate)) {
            status = 'CRITICAL';
            alerts.push('Service Overdue (Time limit)');
        }
    }

    // --- RULE 2: SERVICE (Mileage - 5000km Limit) ---
    if (car.currentMileage && car.lastServiceMileage) {
        const limit = car.lastServiceMileage + 5000;
        if (car.currentMileage >= limit) {
            status = 'CRITICAL';
            alerts.push(`Service Overdue (Mileage +${car.currentMileage - limit}km)`);
        }
    }

    // --- RULE 3: ROADTAX (1 Week Warning) ---
    if (car.roadTaxExpiry) {
        const expiry = car.roadTaxExpiry.toDate();
        const daysLeft = differenceInDays(expiry, today);

        if (daysLeft < 0) {
            status = 'CRITICAL';
            alerts.push('Roadtax EXPIRED');
        } else if (daysLeft <= 7) {
            status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            alerts.push(`Roadtax expires in ${daysLeft} days`);
        }
    }

    // --- RULE 4: INSURANCE (1 Week Warning) ---
    if (car.insuranceExpiry) {
        const expiry = car.insuranceExpiry.toDate();
        const daysLeft = differenceInDays(expiry, today);

        if (daysLeft < 0) {
            status = 'CRITICAL';
            alerts.push('Insurance EXPIRED');
        } else if (daysLeft <= 7) {
            status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
            alerts.push(`Insurance expires in ${daysLeft} days`);
        }
    }

    return { status, alerts };
};
