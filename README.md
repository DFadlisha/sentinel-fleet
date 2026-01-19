# 🚚 Sentinel Fleet Command

**Sentinel Fleet Command** is a modern, mobile-first fleet management application built for efficiency and simplicity. It allows fleet managers to track vehicle status, monitor expiry dates (Roadtax & Insurance), and manage incident reports directly from their mobile devices.

## 🚀 Key Features

*   **Live Fleet Status**:
    *   Real-time monitoring of all vehicles.
    *   Visual indicators for expiry status (Green = OK, Yellow = Warning, Red = Critical).
    *   **Pull-to-Refresh** to instantly update data.
*   **Smart Expiry Notifications**:
    *   **Client-Side Local Notifications**: Get notified automatically 7 days before any Roadtax or Insurance expires. No server configuration required.
*   **Incident Reporting**:
    *   Submit incident reports (Accidents, Breakdowns, etc.) with details and photos (future scope).
    *   **Direct Sharing**: Instantly share report summaries via **WhatsApp** or **Email** with a single tap.
*   **Easy Unit Registration**:
    *   Manually add vehicles with strict date validation (dd/mm/yyyy).
    *   **Excel Import**: Bulk upload vehicles by importing an Excel (.xlsx) file. Supports customizable columns like Place, Color, Last Service, etc.
*   **Offline First Design**: Built as a PWA (Progressive Web App) with Capacitor, ready for Android and iOS.

## 🛠 Tech Stack

*   **Frontend**: React.js + Vite
*   **Styling**: Tailwind CSS
*   **Mobile Engine**: Capacitor (Android/iOS)
*   **Database**: Firebase Firestore (NoSQL)
*   **Notifications**: @capacitor/local-notifications
*   **Deployment**: Firebase Hosting (Free Tier)

## 📱 How to Run

### Local Development
```bash
npm install
npm run dev
```

### Build for Android
```bash
npm run build
npx cap sync android
npx cap open android
# Or run on emulator directly:
npx cap run android --target <emulator_id>
```

### Build for iOS
1.  Ensure you are on macOS with Xcode installed.
2.  Run `npx cap sync ios`.
3.  Open Xcode (`npx cap open ios`) and build/archive for your device.

## 📂 Project Structure

*   `src/pages`: Main application views (Dashboard, AddCar, ReportIncident).
*   `src/components`: Reusable UI components (Navbar, BottomNav).
*   `src/utils`: Helper functions (Date parsing, Notifications logic).
*   `src/firebase.js`: Firebase configuration and initialization.

---
*Built for NES SOLUTION AND NETWORK SDN BHD.*
