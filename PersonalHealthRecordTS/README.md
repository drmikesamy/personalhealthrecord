# Personal Health Record - HTMX + TypeScript Version

A modern, secure, and decentralized Personal Health Record (PHR) system built with HTMX, TypeScript, and Nostr protocol for data storage. This version uses FHIR standards for health data interoperability.

## Features

### 🔐 **Secure & Decentralized**
- **Nostr Protocol**: Uses the Nostr decentralized protocol for data storage
- **End-to-End Encryption**: All health data is encrypted before storage
- **Self-Sovereign Identity**: You control your own cryptographic keys
- **No Central Authority**: Data is distributed across multiple relays

### 🏥 **FHIR Compliant**
- **FHIR R4 Standard**: All health data stored in FHIR format
- **Interoperability**: Compatible with healthcare systems worldwide
- **LOINC Codes**: Uses standardized medical terminology
- **Structured Data**: Consistent, machine-readable health records

### 📊 **Comprehensive Health Tracking**
- **Profile Management**: Personal demographics and basic information
- **Vital Signs**: Blood pressure, heart rate, weight, oxygen saturation
- **Activity Tracking**: Exercise, steps, calories, duration, intensity
- **Mental Health**: Mood, anxiety, stress levels, sleep tracking
- **Lab Results**: Blood work, cholesterol, glucose, hemoglobin
- **General Notes**: Free-form health observations and notes

### 🎨 **Modern User Experience**
- **HTMX Integration**: Dynamic updates without page refreshes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Timeline updates instantly when new data is added
- **Intuitive Interface**: Clean, medical-grade user interface
- **Accessibility**: Screen reader friendly and keyboard navigable

## Technology Stack

### Frontend
- **HTML5**: Semantic markup for accessibility
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **HTMX**: Dynamic HTML updates and form handling
- **TypeScript**: Type-safe client-side logic
- **Nostr-Tools**: Cryptographic operations and relay communication

### Backend
- **Node.js**: JavaScript runtime for server
- **Express.js**: Web framework for API endpoints
- **TypeScript**: Type-safe server-side development
- **CORS**: Cross-origin resource sharing support

### Data Standards
- **FHIR R4**: Healthcare data exchange standard
- **LOINC**: Laboratory and clinical terminology
- **Nostr Protocol**: Decentralized communication protocol
- **NIP-04**: Nostr encryption standard

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with ES2020 support

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Or Start Production Server**
   ```bash
   npm start
   ```

5. **Open Browser**
   ```
   http://localhost:3000
   ```

### Static File Serving (Development)
For quick testing without the Node.js server:
```bash
npm run serve
```

## Project Structure

```
PersonalHealthRecordTS/
├── src/
│   ├── server.ts          # Express server with HTMX endpoints
│   └── client.ts          # TypeScript client-side logic
├── dist/                  # Compiled JavaScript output
├── index.html             # Main application interface
├── client.js              # Compiled client-side JavaScript
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Key Differences from Original Version

### 🔄 **HTMX Integration**
- **Server-Side Rendering**: HTML fragments generated on server
- **Progressive Enhancement**: Works without JavaScript
- **Reduced Client Complexity**: Less frontend state management
- **Faster Interactions**: Optimized for quick form submissions

### 📝 **TypeScript Benefits**
- **Type Safety**: Compile-time error checking
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Maintainability**: Clearer code structure and documentation
- **Team Development**: Easier collaboration with defined interfaces

### 🏗️ **Architecture Improvements**
- **Separation of Concerns**: Clear client/server boundaries
- **API-First Design**: RESTful endpoints for all operations
- **Modular Components**: Reusable TypeScript classes
- **Error Handling**: Comprehensive error management

## API Endpoints

### Health Record Operations
- `GET /api/timeline` - Retrieve health timeline
- `POST /api/record/profile` - Update patient profile
- `POST /api/record/note` - Add health note
- `POST /api/record/vitals` - Record vital signs
- `POST /api/record/activity` - Log physical activity
- `POST /api/record/mental-health` - Mental health check-in
- `POST /api/record/lab` - Laboratory results

### Key Management
- `POST /api/export-keys` - Export cryptographic keys

## Data Security

### 🔐 **Encryption**
All health data is encrypted using NIP-04 standard before being stored on Nostr relays. Only you have the private key to decrypt your data.

### 🔑 **Key Management**
- Keys are generated locally in your browser
- Private keys never leave your device
- Export functionality for backup purposes
- Import capability for data recovery

### 🌐 **Decentralized Storage**
Data is stored across multiple Nostr relays:
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`
- `wss://nostr-pub.wellorder.net`

## Development

### 🛠️ **Building**
```bash
# Compile TypeScript
npm run build

# Watch mode for development
npm run dev
```

### 🧪 **Testing**
The application includes:
- Type checking via TypeScript compiler
- Runtime error handling
- Console logging for debugging
- Visual debug panel in UI

### 🔧 **Customization**
- Modify `src/server.ts` for backend changes
- Update `src/client.ts` for frontend logic
- Adjust `index.html` for UI modifications
- Configure `tsconfig.json` for TypeScript settings

## Healthcare Standards Compliance

### 📋 **FHIR Implementation**
- **Patient Resource**: Demographics and identity
- **Observation Resource**: All measurements and assessments
- **Bundle Resource**: Collection of related resources
- **Code Systems**: LOINC for laboratory data, SNOMED for clinical terms

### 🏥 **Medical Terminology**
- Standardized units of measure (UCUM)
- Clinical terminology (LOINC codes)
- Observation categories (vital-signs, laboratory, survey, etc.)
- Structured data format for interoperability

## Privacy & Compliance

### 🔒 **Privacy by Design**
- No central database or user accounts
- Cryptographic identity management
- Client-side encryption before transmission
- User-controlled data retention and deletion

### ⚖️ **Regulatory Considerations**
While this is a personal health record system, users should be aware:
- Not intended for emergency medical situations
- Should complement, not replace, professional healthcare
- Data backup and recovery is user responsibility
- Consult healthcare providers for medical decisions

## Roadmap

### 🚀 **Planned Features**
- [ ] Data visualization and trends
- [ ] Export to standard formats (PDF, FHIR JSON)
- [ ] Integration with wearable devices
- [ ] Medication tracking
- [ ] Appointment scheduling
- [ ] Healthcare provider sharing
- [ ] Multi-language support
- [ ] Advanced analytics and insights

### 🔧 **Technical Improvements**
- [ ] Offline support with service workers
- [ ] Real-time sync across devices
- [ ] Advanced encryption options
- [ ] Plugin architecture for extensions
- [ ] Mobile application (React Native)
- [ ] Desktop application (Electron)

## Contributing

This is a demonstration project showcasing modern web technologies for healthcare applications. Contributions, suggestions, and feedback are welcome.

### 📝 **Development Guidelines**
- Follow TypeScript best practices
- Maintain FHIR standard compliance
- Ensure accessibility standards (WCAG 2.1)
- Test across multiple browsers
- Document all API changes

## License

This project is intended for educational and demonstration purposes. Please ensure compliance with local healthcare regulations before using in production environments.

## Support

For questions, issues, or feature requests, please refer to the project documentation or create an issue in the repository.

---

**⚠️ Important Medical Disclaimer**: This application is for personal health record keeping only. It is not intended for medical diagnosis, treatment, or emergency situations. Always consult with qualified healthcare professionals for medical advice.
