// Personal Health Record Manager using Nostr for storage and FHIR format
class PersonalHealthRecord {
    constructor() {
        // Nostr related properties
        this.nostrKeys = null;
        this.relayPool = null;
        this.connectedRelays = [];
        
        // Health data storage
        this.healthRecords = [];
        this.patientId = null;
        
        // Free Nostr relays for health data storage
        this.nostrRelays = [
            'wss://relay.damus.io',
            'wss://nos.lol',
            'wss://relay.nostr.band',
            'wss://nostr-pub.wellorder.net',
        ];
        
        this.log('🏥 Personal Health Record system initialized');
        
        // Auto-initialize
        setTimeout(() => this.generateKeys(), 500);
        setTimeout(() => this.connectToRelays(), 1500);
        setTimeout(() => this.loadHealthRecords().then(() => displayTimelineRecords()), 3500);
    }
    
    log(message) {
        console.log(message);
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${message}`;
        }
    }
    
    generateKeys() {
        try {
            const privateKey = NostrTools.generateSecretKey();
            const publicKey = NostrTools.getPublicKey(privateKey);
            
            this.nostrKeys = {
                private: privateKey,
                public: publicKey,
                npub: NostrTools.nip19.npubEncode(publicKey),
                nsec: NostrTools.nip19.nsecEncode(privateKey)
            };
            
            this.patientId = `patient-${publicKey.substring(0, 16)}`;
            this.log(`🔑 Generated new health identity: ${this.nostrKeys.npub}`);
            
            document.getElementById('publicKeyDisplay').textContent = this.nostrKeys.npub;
            this.updateConnectionStatus();
            return this.nostrKeys;
        } catch (error) {
            this.log(`❌ Error generating keys: ${error.message}`);
        }
    }
    
    async connectToRelays() {
        if (!this.nostrKeys) return this.log('❌ Generate identity first');
        
        try {
            this.log('🔌 Connecting to Nostr relays...');
            this.relayPool = new NostrTools.SimplePool();
            this.connectedRelays = [];
            
            const promises = this.nostrRelays.map(url => 
                this.relayPool.ensureRelay(url).then(relay => {
                    this.connectedRelays.push(url);
                    this.log(`✅ Connected to ${url}`);
                }).catch(err => this.log(`⚠️ Failed to connect to ${url}`))
            );
            await Promise.all(promises);
            
            if (this.connectedRelays.length === 0) throw new Error('Failed to connect to any relays');
            
            this.log(`🎉 Connected to ${this.connectedRelays.length} relays`);
            this.updateConnectionStatus();
            
        } catch (error) {
            this.log(`❌ Error connecting to relays: ${error.message}`);
        }
    }
    
    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        if (this.connectedRelays.length > 0 && this.nostrKeys) {
            statusElement.textContent = `🟢 Connected (${this.connectedRelays.length} Relays)`;
            statusElement.className = 'status connected';
        } else if (this.nostrKeys) {
            statusElement.textContent = '🟡 Connecting...';
            statusElement.className = 'status connecting';
        } else {
            statusElement.textContent = '🔴 No Identity';
            statusElement.className = 'status disconnected';
        }
    }
    
   // Key Management
    exportKeypair() {
        if (!this.nostrKeys) return alert('No keypair to export. Generate keys first.');
        
        const exportData = {
            keyType: 'Nostr Health Identity',
            patientId: this.patientId,
            npub: this.nostrKeys.npub,
            nsec: this.nostrKeys.nsec,
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `health-identity-${this.patientId}.json`;
        
        // Append to body, click, and then remove
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.log('🔐 Health identity keypair exported');
        }, 100);
    }
    
    importKeypair() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!data.nsec) throw new Error('Invalid key file: The file must contain an "nsec" property.');
                
                // Correctly decode the nsec string to get the private key
                const { type, data: privateKey } = NostrTools.nip19.decode(data.nsec);
                if (type !== 'nsec') throw new Error('Invalid nsec key format.');

                const publicKey = NostrTools.getPublicKey(privateKey);
                
                this.nostrKeys = {
                    private: privateKey,
                    public: publicKey,
                    npub: NostrTools.nip19.npubEncode(publicKey),
                    nsec: data.nsec
                };
                
                // Use patientId from file if it exists, otherwise generate a new one
                this.patientId = data.patientId || `patient-${publicKey.substring(0, 16)}`;
                
                document.getElementById('publicKeyDisplay').textContent = this.nostrKeys.npub;
                this.log('🔑 Health identity imported successfully');
                alert('✅ Keypair imported! Reloading data...');
                
                // Re-connect with the new identity and load its records
                await this.connectToRelays();
                await this.loadHealthRecords();

            } catch (error) {
                this.log(`❌ Error importing keypair: ${error.message}`);
                alert(`❌ Failed to import keypair:\n${error.message}`);
            }
        };
        
        input.click();
    }
    
    // FHIR Resource Creation
    createFHIRObservation(category, code, value, unit, notes = '') {
        const resource = {
            resourceType: "Observation",
            id: `obs-${Date.now()}`,
            status: "final",
            category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: category }] }],
            code: { coding: [{ system: "http://loinc.org", code: code.code, display: code.display }] },
            subject: { reference: `Patient/${this.patientId}` },
            effectiveDateTime: new Date().toISOString(),
        };
        if (value !== null && unit) {
            resource.valueQuantity = { value: parseFloat(value), unit: unit, system: "http://unitsofmeasure.org" };
        } else {
             resource.valueString = value;
        }
        if (notes) resource.note = [{ text: notes }];
        return resource;
    }
    
    createFHIRPatient(profileData = {}) {
        const patientResource = {
            resourceType: "Patient",
            id: this.patientId,
            identifier: [{ system: "https://nostr.com/pubkey", value: this.nostrKeys.public }],
            active: true,
        };
        if (profileData.firstName || profileData.lastName) {
            patientResource.name = [{
                use: "official",
                family: profileData.lastName,
                given: [profileData.firstName]
            }];
        }
        if (profileData.dob) patientResource.birthDate = profileData.dob;
        if (profileData.gender) patientResource.gender = profileData.gender;
        return patientResource;
    }
    
    // Record different data types
    async recordProfileData() {
        if (!this.nostrKeys) return;
        const profileData = {
            firstName: document.getElementById('profileFirstName').value,
            lastName: document.getElementById('profileLastName').value,
            dob: document.getElementById('profileDob').value,
            gender: document.getElementById('profileGender').value,
        };
        const fhirPatient = this.createFHIRPatient(profileData);
        const fhirBundle = {
            resourceType: 'Bundle', type: 'collection',
            entry: [{ resource: fhirPatient }]
        };
        await this.storeHealthData(fhirBundle, 'profile');
        this.log('👤 Profile data recorded and encrypted');
        setTimeout(() => displayTimelineRecords(), 500);
    }

    async recordNote() {
        if (!this.nostrKeys) return;
        const noteText = document.getElementById('noteText').value;
        if (!noteText) return alert('Note cannot be empty.');
        
        const fhirObservation = this.createFHIRObservation('social-history', { code: '48767-8', display: 'General note' }, noteText, null);
        const fhirBundle = {
            resourceType: 'Bundle', type: 'collection',
            entry: [{ resource: fhirObservation }]
        };
        await this.storeHealthData(fhirBundle, 'general-note');
        this.log('📝 Note recorded and encrypted');
        document.getElementById('noteText').value = '';
        setTimeout(() => displayTimelineRecords(), 500);
    }
    
    async recordVitalSigns() {
        if (!this.nostrKeys) return;
        const observations = [];
        const systolic = document.getElementById('systolic').value;
        const diastolic = document.getElementById('diastolic').value;
        if (systolic && diastolic) {
            observations.push(this.createFHIRObservation('vital-signs', { code: '85354-9', display: 'Blood pressure' }, null, null, `Systolic: ${systolic} mmHg, Diastolic: ${diastolic} mmHg`));
        }
        const heartRate = document.getElementById('heartRate').value;
        if (heartRate) {
            observations.push(this.createFHIRObservation('vital-signs', { code: '8867-4', display: 'Heart rate' }, heartRate, 'beats/min'));
        }
        const weight = document.getElementById('weight').value;
        if (weight) {
            const unit = document.getElementById('weightUnit').value === 'kg' ? 'kg' : '[lb_av]';
            observations.push(this.createFHIRObservation('vital-signs', { code: '29463-7', display: 'Body weight' }, weight, unit));
        }
        const oxygenSat = document.getElementById('oxygenSat').value;
        if (oxygenSat) {
             observations.push(this.createFHIRObservation('vital-signs', { code: '2708-6', display: 'Oxygen saturation' }, oxygenSat, '%'));
        }

        if(observations.length === 0) return alert("Please enter at least one vital sign.");

        const fhirBundle = { resourceType: 'Bundle', type: 'collection', entry: observations.map(obs => ({ resource: obs }))};
        await this.storeHealthData(fhirBundle, 'vital-signs');
        this.log('❤️ Vital signs recorded');
        setTimeout(() => displayTimelineRecords(), 500);
    }

    async recordActivity() {
        if (!this.nostrKeys) return;
        const observations = [];
        
        const activityType = document.getElementById('activityType').value;
        const duration = document.getElementById('activityDuration').value;
        const intensity = document.getElementById('activityIntensity').value;
        const steps = document.getElementById('activitySteps').value;
        const calories = document.getElementById('activityCalories').value;
        const notes = document.getElementById('activityNotes').value;
        
        if (activityType) {
            let activityDetails = `Activity: ${activityType}`;
            if (duration) activityDetails += `, Duration: ${duration} minutes`;
            if (intensity) activityDetails += `, Intensity: ${intensity}`;
            if (notes) activityDetails += `, Notes: ${notes}`;
            
            observations.push(this.createFHIRObservation('activity', 
                { code: '72133-2', display: 'Physical activity' }, 
                null, null, activityDetails));
        }
        
        if (steps) {
            observations.push(this.createFHIRObservation('activity', 
                { code: '55423-8', display: 'Steps' }, 
                steps, 'steps'));
        }
        
        if (calories) {
            observations.push(this.createFHIRObservation('activity', 
                { code: '41981-2', display: 'Calories burned' }, 
                calories, 'kcal'));
        }
        
        if (observations.length === 0) return alert("Please enter at least one activity metric.");
        
        const fhirBundle = { 
            resourceType: 'Bundle', 
            type: 'collection', 
            entry: observations.map(obs => ({ resource: obs }))
        };
        
        await this.storeHealthData(fhirBundle, 'activity');
        this.log('🏃‍♂️ Activity data recorded');
        setTimeout(() => displayTimelineRecords(), 500);
    }

    async recordMentalHealth() {
        if (!this.nostrKeys) return;
        const observations = [];
        
        const mood = document.getElementById('moodRating').value;
        const anxiety = document.getElementById('anxietyLevel').value;
        const stress = document.getElementById('stressLevel').value;
        const sleep = document.getElementById('sleepHours').value;
        const sleepQuality = document.getElementById('sleepQuality').value;
        const notes = document.getElementById('mentalHealthNotes').value;
        
        if (mood) {
            observations.push(this.createFHIRObservation('survey', 
                { code: '72133-2', display: 'Mood assessment' }, 
                mood, 'score', `Mood rating: ${mood}/10`));
        }
        
        if (anxiety) {
            observations.push(this.createFHIRObservation('survey', 
                { code: '72133-2', display: 'Anxiety level' }, 
                anxiety, 'score', `Anxiety level: ${anxiety}/10`));
        }
        
        if (stress) {
            observations.push(this.createFHIRObservation('survey', 
                { code: '72133-2', display: 'Stress level' }, 
                stress, 'score', `Stress level: ${stress}/10`));
        }
        
        if (sleep) {
            observations.push(this.createFHIRObservation('vital-signs', 
                { code: '93832-4', display: 'Sleep duration' }, 
                sleep, 'h'));
        }
        
        if (sleepQuality) {
            observations.push(this.createFHIRObservation('survey', 
                { code: '72133-2', display: 'Sleep quality' }, 
                sleepQuality, 'score', `Sleep quality: ${sleepQuality}/10`));
        }
        
        if (notes) {
            observations.push(this.createFHIRObservation('social-history', 
                { code: '48767-8', display: 'Mental health note' }, 
                notes, null));
        }
        
        if (observations.length === 0) return alert("Please enter at least one mental health metric.");
        
        const fhirBundle = { 
            resourceType: 'Bundle', 
            type: 'collection', 
            entry: observations.map(obs => ({ resource: obs }))
        };
        
        await this.storeHealthData(fhirBundle, 'mental-health');
        this.log('🧠 Mental health data recorded');
        setTimeout(() => displayTimelineRecords(), 500);
    }

    async recordLabData() {
        if (!this.nostrKeys) return;
        const observations = [];
        
        const glucose = document.getElementById('glucose').value;
        const cholesterol = document.getElementById('cholesterol').value;
        const hdl = document.getElementById('hdl').value;
        const ldl = document.getElementById('ldl').value;
        const hemoglobin = document.getElementById('hemoglobin').value;
        const whiteBloodCells = document.getElementById('whiteBloodCells').value;
        const labNotes = document.getElementById('labNotes').value;
        
        if (glucose) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '33747-0', display: 'Glucose' }, 
                glucose, 'mg/dL'));
        }
        
        if (cholesterol) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '2093-3', display: 'Total cholesterol' }, 
                cholesterol, 'mg/dL'));
        }
        
        if (hdl) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '2085-9', display: 'HDL cholesterol' }, 
                hdl, 'mg/dL'));
        }
        
        if (ldl) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '2089-1', display: 'LDL cholesterol' }, 
                ldl, 'mg/dL'));
        }
        
        if (hemoglobin) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '718-7', display: 'Hemoglobin' }, 
                hemoglobin, 'g/dL'));
        }
        
        if (whiteBloodCells) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '6690-2', display: 'White blood cells' }, 
                whiteBloodCells, 'K/uL'));
        }
        
        if (labNotes) {
            observations.push(this.createFHIRObservation('laboratory', 
                { code: '48767-8', display: 'Lab notes' }, 
                labNotes, null));
        }
        
        if (observations.length === 0) return alert("Please enter at least one lab value.");
        
        const fhirBundle = { 
            resourceType: 'Bundle', 
            type: 'collection', 
            entry: observations.map(obs => ({ resource: obs }))
        };
        
        await this.storeHealthData(fhirBundle, 'lab-results');
        this.log('🔬 Lab data recorded');
        setTimeout(() => displayTimelineRecords(), 500);
    }
    
    // Storage and Retrieval
    async storeHealthData(fhirBundle, category) {
        if (!this.nostrKeys) throw new Error('No health identity available');
        
        try {
            this.log(`Encrypting ${category} data...`);
            const encryptedData = await NostrTools.nip04.encrypt(this.nostrKeys.private, this.nostrKeys.public, JSON.stringify(fhirBundle));
            
            const event = NostrTools.finalizeEvent({
                kind: 31000,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['d', `${category}-${Date.now()}`], ['t', 'health-record'], ['t', category]],
                content: encryptedData,
            }, this.nostrKeys.private);
            
            this.healthRecords.push({
                id: event.id, category,
                timestamp: new Date(event.created_at * 1000).toISOString(),
                data: fhirBundle
            });
            
            if (this.connectedRelays.length > 0) {
                await this.relayPool.publish(this.connectedRelays, event);
                this.log(`📡 Event for ${category} published to ${this.connectedRelays.length} relays`);
            }
        } catch (error) {
            this.log(`❌ Error storing health data: ${error.message}`);
        }
    }

    async loadHealthRecords() {
        if (!this.nostrKeys) return this.log('❌ No identity to load records for');
        this.log('🔍 Loading encrypted health records...');
        
        if (this.connectedRelays.length > 0) {
            const events = await this.relayPool.querySync(this.connectedRelays, {
                kinds: [31000],
                authors: [this.nostrKeys.public],
                '#t': ['health-record']
            });
            
            this.log(`📥 Found ${events.length} records on relays`);
            this.healthRecords = []; // Clear local cache before loading
            
            for (const event of events) {
                try {
                    const decrypted = await NostrTools.nip04.decrypt(this.nostrKeys.private, this.nostrKeys.public, event.content);
                    const fhirBundle = JSON.parse(decrypted);
                    const category = event.tags.find(t => t[0] === 't' && t[1] !== 'health-record')?.[1] || 'unknown';
                    this.healthRecords.push({
                        id: event.id, category,
                        timestamp: new Date(event.created_at * 1000).toISOString(),
                        data: fhirBundle
                    });
                } catch (e) {
                    this.log(`⚠️ Could not decrypt event ${event.id.substring(0, 8)}`);
                }
            }
            this.log(`✅ Decrypted ${this.healthRecords.length} records`);
            displayTimelineRecords();
        }
    }
    
    async exportHealthData() {
        if (this.healthRecords.length === 0) return alert('No records to export');
        const exportData = {
            patientId: this.patientId,
            publicKey: this.nostrKeys.npub,
            records: this.healthRecords.map(r => ({ ...r }))
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `health-records-${this.patientId}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.log(`📤 Exported ${this.healthRecords.length} health records`);
    }
}

// Global instance
let healthRecord = null;

document.addEventListener('DOMContentLoaded', () => {
    healthRecord = new PersonalHealthRecord();
});

// Global UI functions
function recordProfileData() { healthRecord?.recordProfileData(); }
function recordNote() { healthRecord?.recordNote(); }
function recordVitalSigns() { healthRecord?.recordVitalSigns(); }
// Mock other record functions for now
function recordActivity() { healthRecord?.recordActivity(); }
function recordMentalHealth() { healthRecord?.recordMentalHealth(); }
function recordLabData() { healthRecord?.recordLabData(); }

function loadHealthRecords() { healthRecord?.loadHealthRecords(); }
function exportHealthData() { healthRecord?.exportHealthData(); }

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(i => { if (i.type !== 'select-one') i.value = ''; });
    }
}

function openProfileModal() {
    // Find the latest profile record
    const profileRecords = healthRecord.healthRecords.filter(r => r.category === 'profile').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (profileRecords.length > 0) {
        const patientResource = profileRecords[0].data.entry[0].resource;
        if(patientResource.name && patientResource.name[0]) {
            document.getElementById('profileFirstName').value = patientResource.name[0].given ? patientResource.name[0].given[0] : '';
            document.getElementById('profileLastName').value = patientResource.name[0].family || '';
        }
        document.getElementById('profileDob').value = patientResource.birthDate || '';
        document.getElementById('profileGender').value = patientResource.gender || '';
    }
    openModal('profileModal');
}


window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// Timeline display functions
function updateTimelineStats() {
    const total = healthRecord?.healthRecords?.length || 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = healthRecord?.healthRecords?.filter(r => new Date(r.timestamp) > weekAgo).length || 0;
    const categories = new Set(healthRecord?.healthRecords?.map(r => r.category) || []).size;
    
    document.getElementById('totalRecords').textContent = total;
    document.getElementById('thisWeek').textContent = thisWeek;
    document.getElementById('categories').textContent = categories;
}

function getCategoryInfo(category) {
    const map = {
        'profile': { emoji: '👤', title: 'Profile Updated', color: '#3498db' },
        'general-note': { emoji: '📝', title: 'General Note', color: '#f39c12' },
        'vital-signs': { emoji: '❤️', title: 'Vital Signs', color: '#e74c3c' },
        'activity': { emoji: '🏃‍♂️', title: 'Activity', color: '#2ecc71' },
        'mental-health': { emoji: '🧠', title: 'Mental Health', color: '#9b59b6' },
        'lab-results': { emoji: '🔬', title: 'Lab Results', color: '#1abc9c' }
    };
    return map[category] || { emoji: '📊', title: category, color: '#7f8c8d' };
}

function formatTimelineDetails(record) {
    let details = '';
    if (record.category === 'profile') {
        const patient = record.data.entry[0].resource;
        let name = 'Anonymous';
        if(patient.name && patient.name[0]) {
            name = [patient.name[0].given, patient.name[0].family].join(' ').trim();
        }
        return `<span class="metric">Name: ${name}</span><span class="metric">DOB: ${patient.birthDate || 'N/A'}</span>`;
    }
    if (record.category === 'general-note') {
        return `"${record.data.entry[0].resource.valueString}"`;
    }
    
    record.data.entry?.forEach(entry => {
        const obs = entry.resource;
        const code = obs.code?.coding?.[0]?.display || 'Measurement';
        const value = obs.valueQuantity ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}` : obs.valueString;
        const note = obs.note?.[0]?.text;
        if (value) details += `<span class="metric">${code}: ${value}</span> `;
        if (note) details += `<span class="metric">${note}</span> `;
    });
    return details || '<span class="metric">Data recorded</span>';
}

function displayTimelineRecords() {
    const timeline = document.getElementById('healthTimeline');
    if (!timeline || !healthRecord?.healthRecords) return;
    
    const records = [...healthRecord.healthRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (records.length === 0) {
        timeline.innerHTML = `<div class="empty-timeline"><h3>🌟 Start Your Health Journey</h3><p>Click a button above to record your first health data entry!</p></div>`;
    } else {
        timeline.innerHTML = records.map(record => {
            const date = new Date(record.timestamp);
            const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const catInfo = getCategoryInfo(record.category);
            
            return `
                <div class="timeline-item" style="border-left-color: ${catInfo.color}">
                    <div class="timeline-date">${formattedDate}, ${formattedTime}</div>
                    <span class="timeline-category" style="background-color: ${catInfo.color}">${catInfo.title}</span>
                    <div class="timeline-content">
                        <h4>${catInfo.emoji} ${catInfo.title}</h4>
                        <div class="timeline-details">${formatTimelineDetails(record)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    updateTimelineStats();
}