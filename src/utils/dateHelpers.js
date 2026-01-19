import { format, parse, isValid } from 'date-fns';

// Converts user input "31/01/2026" -> Date Object
export const parseDate = (dateString) => {
    const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsed) ? parsed : null;
};

// Converts Date Object/Timestamp -> "31/01/2026"
export const formatDate = (dateInput) => {
    if (!dateInput) return '---';
    // Handle Firebase Timestamps automatically
    const dateObj = dateInput.toDate ? dateInput.toDate() : dateInput;
    return format(dateObj, 'dd/MM/yyyy');
};
