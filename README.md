# Hourly Checklist

A modern, responsive web application for managing hourly task checklists with progress tracking, authentication, and data persistence.

## Features

- **Hourly Task Management**: Create and manage checklists that reset every hour
- **Progress Tracking**: Visual progress bars and completion statistics
- **Historical Data**: View and edit past hourly progress with navigation
- **User Authentication**: Secure login with Firebase Authentication
- **Data Persistence**: Cloud storage with Firebase Firestore
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Real-time Timer**: Countdown to next hourly reset
- **Drag & Drop**: Reorder checklist items with intuitive drag and drop
- **Data Migration**: Seamless migration from local storage to cloud storage

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mwijanarko1/hourly.git
cd hourly
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore
   - Copy your Firebase config and add it to your environment variables

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Sign Up/Login**: Create an account or sign in to sync your data across devices
2. **Add Tasks**: Use the "Add Item" form to create your hourly checklist items
3. **Track Progress**: Check off completed tasks and watch your progress bar update
4. **View History**: Navigate through past hours to see your completion history
5. **Reset Hourly**: Manually reset your checklist for the new hour
6. **Customize**: Access settings to configure your preferences

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature-specific components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Firebase configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue in the repository.
