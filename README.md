# Personal Health Record System
###(For demo/evaluation purposes only, not for production or professional use)###
## Decentralized Health Data Storage using Nostr + FHIR R4

A comprehensive quantified self health tracking system that stores encrypted health data on the Nostr network using the FHIR R4 standard for medical data interoperability.

## 🏥 Features

### Core Architecture
- **Decentralized Storage**: Uses Nostr network for distributed, censorship-resistant health data storage
- **FHIR R4 Compliance**: All health data follows HL7 FHIR Release 4 standard for medical interoperability
- **End-to-End Encryption**: All health data encrypted using NIP-04 standard with your private key
- **Multi-Relay Redundancy**: Data stored across multiple Nostr relays for high availability
- **Self-Sovereign Identity**: You control your health identity and data completely

### Health Data Categories

#### 📊 Vital Signs
- Blood Pressure (Systolic/Diastolic)
- Heart Rate (BPM)
- Body Temperature (°F)
- Weight (lbs)
- Oxygen Saturation (%)

#### 🔬 Health Observations
- Blood Glucose levels
- Sleep Duration tracking
- Exercise Duration
- Mood Score (1-10 scale)
- Pain Level assessment (0-10 scale)
- Energy Level tracking (1-10 scale)
- Stress Level monitoring (1-10 scale)
- Daily Steps count
- Water Intake (oz)
- Caffeine Intake (mg)

#### 💊 Medications
- Medication name and dosage
- Frequency and timing
- Start/End dates
- Prescribing physician
- Notes and side effects

#### 🩺 Health Conditions
- Condition name and description
- Severity assessment (Mild/Moderate/Severe)
- Status tracking (Active/Resolved/Inactive)
- Onset and resolution dates
- Diagnosing physician
- Clinical notes

## 🔐 Privacy & Security

### Data Encryption
- All health data encrypted using **NIP-04** standard before transmission
- Encryption uses your Nostr private key - only you can decrypt your data
- Even relay operators cannot read your health information

### Identity Management
- Self-generated Nostr keypair creates your health identity
- Public key (npub) serves as your health record identifier
- Private key (nsec) required to decrypt and access your data
- Import/Export functionality for key backup and portability

### Data Sovereignty
- **You own your data** - no central authority can access or control it
- Data persists across multiple Nostr relays globally
- Can export all data in FHIR-compliant JSON format
- Compatible with any FHIR-supporting healthcare system

## 🚀 Getting Started

### 1. Generate Health Identity
- Click "Generate New Identity" to create your health keypair
- Your public key (npub) will be displayed - this identifies your health record
- **Important**: Export and securely store your private key for data recovery

### 2. Record Health Data
Use the tabbed interface to record different types of health data:

#### Vital Signs Tab
```
- Enter blood pressure readings
- Record heart rate measurements  
- Log body temperature
- Track weight changes
- Monitor oxygen saturation
```

#### Observations Tab
```
- Select observation type from dropdown
- Enter numerical value with appropriate unit
- Add contextual notes
- Submit to encrypted storage
```

#### Medications Tab
```
- Enter medication name and dosage
- Select frequency (daily, weekly, etc.)
- Set start/end dates
- Add prescribing physician info
```

#### Conditions Tab
```
- Record diagnosed conditions
- Set severity and status
- Track onset/resolution dates
- Add physician and clinical notes
```

### 3. View & Manage Records
- **Refresh Records**: Load your encrypted health data from Nostr relays
- **Export All**: Download complete health record in FHIR JSON format
- **Clear Display**: Remove records from view (doesn't delete from storage)

## 🌐 Technical Architecture

### FHIR R4 Resources
The system creates standards-compliant FHIR resources:

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-abc123...",
        "identifier": [
          {
            "system": "https://nostr.com",
            "value": "npub1..."
          }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "category": "vital-signs",
        "code": "blood-pressure",
        "valueQuantity": {
          "value": 120,
          "unit": "mmHg"
        }
      }
    }
  ]
}
```

### Nostr Integration
- **Event Kind**: 31000 (Parameterized Replaceable Events)
- **Encryption**: NIP-04 encrypted payloads
- **Tags**: Categorized by health data type (`d:vital-signs`, `d:medications`, etc.)
- **Relays**: Distributed across multiple public Nostr relays

### Data Flow
1. Health data entered via web interface
2. Converted to FHIR R4 compliant JSON structure  
3. Encrypted using NIP-04 with user's private key
4. Signed and published to multiple Nostr relays
5. Retrieved and decrypted for display using private key

## 🔧 Development Setup

### Prerequisites
- Modern web browser with JavaScript enabled
- HTTP server for local development (Python, Node.js, etc.)

### Local Development
```bash
# Clone the repository
cd PersonalHealthRecord

# Start local HTTP server
python3 -m http.server 8081

# Open in browser
http://localhost:8081
```

### Dependencies
- **Nostr Tools**: `nostr-tools@2.7.2` for Nostr protocol implementation
- **Browser APIs**: Crypto API for key generation, Local Storage for caching

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+  
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features
- WebCrypto API for encryption
- WebSocket support for relay connections
- Local Storage for caching
- Modern JavaScript (ES2020+)

## 🏥 Healthcare Integration

### FHIR Compliance
- Full FHIR R4 standard compliance
- Compatible with Epic, Cerner, and other FHIR-enabled systems
- Export format accepted by most Electronic Health Record (EHR) systems

### Data Portability
- Export all data in standard FHIR JSON format
- Import to any FHIR-compatible healthcare system
- Share specific records with healthcare providers
- Maintain complete data ownership and control

## ⚠️ Important Notes

### Data Backup
- **Always backup your private key (nsec)** - loss means permanent data loss
- Export health data regularly as additional backup
- Consider multiple secure storage locations for private key

### Medical Disclaimer
- This system is for personal health tracking only
- **Not intended for medical diagnosis or treatment**
- Always consult healthcare professionals for medical decisions
- Data accuracy depends on user input

### Privacy Considerations
- Health data is highly sensitive - protect your private key
- Consider using dedicated device/browser for health record access
- Be aware of local laws regarding health data storage and transmission

## 🔗 Related Technologies

- **Nostr Protocol**: https://nostr.com
- **FHIR R4 Standard**: https://hl7.org/fhir/R4/
- **NIP-04 Encryption**: https://github.com/nostr-protocol/nips/blob/master/04.md
- **Nostr Tools Library**: https://github.com/nbd-wtf/nostr-tools

## 📄 License

This project is open source and available under the MIT License.

---

*Built with ❤️ for health data sovereignty and privacy*
