# Buying Target Tracker

A modern React application to help you track your buying targets and savings progress. Set financial goals, add budget amounts, and visualize your progress toward purchasing the items you want.

## Features

- **Create buying targets**: Add items with target prices
- **Track budget progress**: Add budget amounts to work toward your goals
- **Visual progress tracking**: Progress bars showing how close you are to your target
- **Budget history**: Keep track of when and how much you've added to each target
- **Data persistence**: All data is saved using IndexedDB and persists between sessions
- **Cloud synchronization**: Sign in to sync data across devices using Firebase
- **Modern UI**: Clean, responsive design with smooth interactions
- **Target prioritization**: Newly added targets and recently updated targets appear at the top
- **Recent activity first**: Budget history shows most recent additions first
- **Easy removal**: Delete targets with confirmation
- **Security**: Sensitive API keys are protected using environment variables

## Screenshots

![Buying Target Tracker Screenshot](./screenshots/screenshot.png)

## How It Works

- Add a new buying target with a name and target price
- Add budget amounts to track your progress
- See how much more you need to reach each target
- Visual progress bars show your advancement
- History logs keep track of your budget additions
- Data persists in your browser even after closing the tab

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Firebase project (for cloud synchronization features)

### Installation

1. Clone or download the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. For cloud synchronization features, set up environment variables:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your Firebase configuration in the `.env` file
   - **Important**: The `.env` file is gitignored and should never be committed to version control as it contains sensitive API keys

### Firebase Setup (Optional but Recommended)

To use cloud synchronization features, you'll need to set up a Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database:
   - Navigate to "Firestore Database" in the sidebar
   - Click "Create Database"
   - Choose your location (e.g., us-central1)
   - Set up security rules (for testing, start with rules that allow read/write access)
4. Enable Authentication:
   - Navigate to "Authentication" in the sidebar
   - Click "Get Started"
   - Enable "Google" as a sign-in provider
5. Add a web app to your Firebase project to get the configuration
6. Copy the configuration values to your `.env` file
7. The app supports Google authentication by default for secure user data synchronization

### Security Features

This project includes robust security measures to protect sensitive information:

- **Environment Variables**: All API keys and Firebase configuration are stored in `.env` files that are gitignored
- **Secure Configuration**: Firebase configuration is loaded from environment variables at runtime
- **Graceful Fallback**: When Firebase is unavailable, the app continues to work with local IndexedDB storage
- **Data Isolation**: Each user's data is properly isolated with user-specific queries

### Data Synchronization

The app seamlessly synchronizes data between local storage and Firebase:

- **Local Storage**: Uses IndexedDB for persistent local data storage
- **Cloud Sync**: When signed in, data syncs to Firestore for cross-device access
- **Offline Support**: Works offline and syncs when connection is restored
- **Real-time Updates**: Changes are reflected in real-time when online

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Shortcuts

- **Add Target**: Fill in the target name and price, then click "Add Target"
- **Add Budget**: Enter an amount in the budget field and click "Add"
- **Delete Target**: Click the "×" button in the top-right corner of a target
- **View Progress**: Progress bars and percentage values show your progress toward each target

## Technology Stack

- **Frontend**: React 18
- **Styling**: CSS with modern flexbox and grid layouts
- **Local Database**: IndexedDB via the idb library for browser-based persistence
- **Cloud Database**: Firebase Firestore for cross-device synchronization
- **Authentication**: Firebase Authentication with Google Sign-In
- **Security**: Environment variables for sensitive API keys
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure

```
buying-target/
├── public/
│   └── vite.svg
├── src/
│   ├── config/
│   │   └── firebase.js    # Firebase configuration with environment variables
│   ├── utils/
│   │   ├── db.js          # IndexedDB database utilities
│   │   ├── auth.js        # Firebase authentication utilities
│   │   └── firebaseDb.js  # Firebase Firestore utilities
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── .env                   # Environment variables (gitignored)
├── .env.example          # Example environment variables file
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Future Enhancements

- User authentication with Google SSO
- Cloud synchronization across devices
- Export data functionality
- Budget forecasting and planning tools

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue to discuss changes or improvements.

## License

This project is open source and available under the [MIT License](LICENSE).