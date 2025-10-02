# Personal Health Record System
###(For demo/evaluation purposes only, not for production or professional use)###

Demo: https://drmikesamy.github.io/personalhealthrecord/


## Decentralized Health Data Storage using Nostr + FHIR R4

A comprehensive quantified self health tracking system that stores encrypted health data on the Nostr network using the FHIR R4 standard for medical data interoperability.

## Features

### Core Architecture
- **Decentralized Storage**: Uses Nostr network for distributed, censorship-resistant health data storage
- **FHIR R4 Compliance**: All health data follows HL7 FHIR Release 4 standard for medical interoperability
- **End-to-End Encryption**: All health data encrypted using NIP-04 standard with your private key
- **Multi-Relay Redundancy**: Data stored across multiple Nostr relays for high availability
- **Self-Sovereign Identity**: You control your health identity and data completely

## Privacy & Security

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

This project is open source and available under the MIT License.
