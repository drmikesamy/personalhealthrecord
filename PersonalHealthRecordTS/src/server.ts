import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface HealthRecord {
    id: string;
    category: string;
    timestamp: string;
    data: FHIRBundle;
}

interface FHIRBundle {
    resourceType: 'Bundle';
    type: 'collection';
    entry: Array<{ resource: any }>;
}

interface FHIRObservation {
    resourceType: 'Observation';
    id: string;
    status: 'final';
    category: Array<{ coding: Array<{ system: string; code: string }> }>;
    code: { coding: Array<{ system: string; code: string; display: string }> };
    subject: { reference: string };
    effectiveDateTime: string;
    valueQuantity?: { value: number; unit: string; system: string };
    valueString?: string;
    note?: Array<{ text: string }>;
}

class HealthRecordServer {
    private app: express.Application;
    private healthRecords: HealthRecord[] = [];
    private patientId: string = 'patient-demo-' + Date.now();

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static('.'));
    }

    private setupRoutes(): void {
        // Serve static files
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });

        // API Routes
        this.app.get('/api/timeline', this.getTimeline.bind(this));
        this.app.post('/api/record/profile', this.recordProfile.bind(this));
        this.app.post('/api/record/note', this.recordNote.bind(this));
        this.app.post('/api/record/vitals', this.recordVitals.bind(this));
        this.app.post('/api/record/activity', this.recordActivity.bind(this));
        this.app.post('/api/record/mental-health', this.recordMentalHealth.bind(this));
        this.app.post('/api/record/lab', this.recordLab.bind(this));
        this.app.post('/api/export-keys', this.exportKeys.bind(this));
    }

    private createFHIRObservation(
        category: string,
        code: { code: string; display: string },
        value: string | null,
        unit: string | null,
        notes: string = ''
    ): FHIRObservation {
        const resource: FHIRObservation = {
            resourceType: "Observation",
            id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: "final",
            category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: category }] }],
            code: { coding: [{ system: "http://loinc.org", code: code.code, display: code.display }] },
            subject: { reference: `Patient/${this.patientId}` },
            effectiveDateTime: new Date().toISOString(),
        };

        if (value !== null && unit) {
            resource.valueQuantity = { 
                value: parseFloat(value), 
                unit: unit, 
                system: "http://unitsofmeasure.org" 
            };
        } else if (value !== null) {
            resource.valueString = value;
        }

        if (notes) {
            resource.note = [{ text: notes }];
        }

        return resource;
    }

    private createFHIRPatient(profileData: any): any {
        const patientResource = {
            resourceType: "Patient",
            id: this.patientId,
            identifier: [{ system: "https://demo.health-record.local", value: this.patientId }],
            active: true,
        };

        if (profileData.firstName || profileData.lastName) {
            (patientResource as any).name = [{
                use: "official",
                family: profileData.lastName || '',
                given: profileData.firstName ? [profileData.firstName] : []
            }];
        }

        if (profileData.dob) (patientResource as any).birthDate = profileData.dob;
        if (profileData.gender) (patientResource as any).gender = profileData.gender;

        return patientResource;
    }

    private storeHealthData(fhirBundle: FHIRBundle, category: string): HealthRecord {
        const record: HealthRecord = {
            id: uuidv4(),
            category,
            timestamp: new Date().toISOString(),
            data: fhirBundle
        };

        this.healthRecords.push(record);
        console.log(`📡 Stored ${category} record: ${record.id}`);
        return record;
    }

    private getTimeline(req: express.Request, res: express.Response): void {
        try {
            const records = [...this.healthRecords].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            if (records.length === 0) {
                res.send(`
                    <div class="empty-timeline">
                        <h3>🌟 Start Your Health Journey</h3>
                        <p>Click a button above to record your first health data entry!</p>
                    </div>
                `);
                return;
            }

            const timelineHtml = records.map(record => {
                const date = new Date(record.timestamp);
                const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const catInfo = this.getCategoryInfo(record.category);

                return `
                    <div class="timeline-item" style="border-left-color: ${catInfo.color}">
                        <div class="timeline-date">${formattedDate}, ${formattedTime}</div>
                        <span class="timeline-category" style="background-color: ${catInfo.color}">${catInfo.title}</span>
                        <div class="timeline-content">
                            <h4>${catInfo.emoji} ${catInfo.title}</h4>
                            <div class="timeline-details">${this.formatTimelineDetails(record)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Update stats
            const total = this.healthRecords.length;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const thisWeek = this.healthRecords.filter(r => new Date(r.timestamp) > weekAgo).length;
            const categories = new Set(this.healthRecords.map(r => r.category)).size;

            res.send(`
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-number">${total}</span>
                        <small>Total Records</small>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${thisWeek}</span>
                        <small>This Week</small>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${categories}</span>
                        <small>Categories</small>
                    </div>
                </div>
                <h3 style="margin-bottom: 1.5rem;">📊 Health Timeline</h3>
                ${timelineHtml}
            `);

        } catch (error) {
            console.error('Error getting timeline:', error);
            res.status(500).send('<div class="error">Error loading timeline</div>');
        }
    }

    private getCategoryInfo(category: string): { emoji: string; title: string; color: string } {
        const map: Record<string, { emoji: string; title: string; color: string }> = {
            'profile': { emoji: '👤', title: 'Profile Updated', color: '#3498db' },
            'general-note': { emoji: '📝', title: 'General Note', color: '#f39c12' },
            'vital-signs': { emoji: '❤️', title: 'Vital Signs', color: '#e74c3c' },
            'activity': { emoji: '🏃‍♂️', title: 'Activity', color: '#2ecc71' },
            'mental-health': { emoji: '🧠', title: 'Mental Health', color: '#9b59b6' },
            'lab-results': { emoji: '🔬', title: 'Lab Results', color: '#1abc9c' }
        };
        return map[category] || { emoji: '📊', title: category, color: '#7f8c8d' };
    }

    private formatTimelineDetails(record: HealthRecord): string {
        let details = '';
        
        if (record.category === 'profile') {
            const patient = record.data.entry[0].resource;
            let name = 'Anonymous';
            if (patient.name && patient.name[0]) {
                const nameObj = patient.name[0];
                name = [nameObj.given?.join(' '), nameObj.family].filter(Boolean).join(' ').trim();
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

    private recordProfile(req: express.Request, res: express.Response): void {
        try {
            const { firstName, lastName, dob, gender } = req.body;
            const fhirPatient = this.createFHIRPatient({ firstName, lastName, dob, gender });
            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{ resource: fhirPatient }]
            };

            this.storeHealthData(fhirBundle, 'profile');
            console.log('👤 Profile data recorded');
            
            // Return updated timeline
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording profile:', error);
            res.status(500).send('<div class="error">Error recording profile</div>');
        }
    }

    private recordNote(req: express.Request, res: express.Response): void {
        try {
            const { noteText } = req.body;
            if (!noteText) {
                res.status(400).send('<div class="error">Note cannot be empty</div>');
                return;
            }

            const fhirObservation = this.createFHIRObservation(
                'social-history', 
                { code: '48767-8', display: 'General note' }, 
                noteText, 
                null
            );
            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{ resource: fhirObservation }]
            };

            this.storeHealthData(fhirBundle, 'general-note');
            console.log('📝 Note recorded');
            
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording note:', error);
            res.status(500).send('<div class="error">Error recording note</div>');
        }
    }

    private recordVitals(req: express.Request, res: express.Response): void {
        try {
            const { systolic, diastolic, heartRate, weight, weightUnit, oxygenSat } = req.body;
            const observations: FHIRObservation[] = [];

            if (systolic && diastolic) {
                observations.push(this.createFHIRObservation(
                    'vital-signs',
                    { code: '85354-9', display: 'Blood pressure' },
                    null,
                    null,
                    `Systolic: ${systolic} mmHg, Diastolic: ${diastolic} mmHg`
                ));
            }

            if (heartRate) {
                observations.push(this.createFHIRObservation(
                    'vital-signs',
                    { code: '8867-4', display: 'Heart rate' },
                    heartRate,
                    'beats/min'
                ));
            }

            if (weight) {
                const unit = weightUnit === 'kg' ? 'kg' : '[lb_av]';
                observations.push(this.createFHIRObservation(
                    'vital-signs',
                    { code: '29463-7', display: 'Body weight' },
                    weight,
                    unit
                ));
            }

            if (oxygenSat) {
                observations.push(this.createFHIRObservation(
                    'vital-signs',
                    { code: '2708-6', display: 'Oxygen saturation' },
                    oxygenSat,
                    '%'
                ));
            }

            if (observations.length === 0) {
                res.status(400).send('<div class="error">Please enter at least one vital sign</div>');
                return;
            }

            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: observations.map(obs => ({ resource: obs }))
            };

            this.storeHealthData(fhirBundle, 'vital-signs');
            console.log('❤️ Vital signs recorded');
            
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording vitals:', error);
            res.status(500).send('<div class="error">Error recording vitals</div>');
        }
    }

    private recordActivity(req: express.Request, res: express.Response): void {
        try {
            const { activityType, duration, intensity, steps, calories, notes } = req.body;
            const observations: FHIRObservation[] = [];

            if (activityType) {
                let activityDetails = `Activity: ${activityType}`;
                if (duration) activityDetails += `, Duration: ${duration} minutes`;
                if (intensity) activityDetails += `, Intensity: ${intensity}`;
                if (notes) activityDetails += `, Notes: ${notes}`;

                observations.push(this.createFHIRObservation(
                    'activity',
                    { code: '72133-2', display: 'Physical activity' },
                    null,
                    null,
                    activityDetails
                ));
            }

            if (steps) {
                observations.push(this.createFHIRObservation(
                    'activity',
                    { code: '55423-8', display: 'Steps' },
                    steps,
                    'steps'
                ));
            }

            if (calories) {
                observations.push(this.createFHIRObservation(
                    'activity',
                    { code: '41981-2', display: 'Calories burned' },
                    calories,
                    'kcal'
                ));
            }

            if (observations.length === 0) {
                res.status(400).send('<div class="error">Please enter at least one activity metric</div>');
                return;
            }

            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: observations.map(obs => ({ resource: obs }))
            };

            this.storeHealthData(fhirBundle, 'activity');
            console.log('🏃‍♂️ Activity data recorded');
            
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording activity:', error);
            res.status(500).send('<div class="error">Error recording activity</div>');
        }
    }

    private recordMentalHealth(req: express.Request, res: express.Response): void {
        try {
            const { mood, anxiety, stress, sleep, sleepQuality, notes } = req.body;
            const observations: FHIRObservation[] = [];

            if (mood) {
                observations.push(this.createFHIRObservation(
                    'survey',
                    { code: '72133-2', display: 'Mood assessment' },
                    mood,
                    'score',
                    `Mood rating: ${mood}/10`
                ));
            }

            if (anxiety) {
                observations.push(this.createFHIRObservation(
                    'survey',
                    { code: '72133-2', display: 'Anxiety level' },
                    anxiety,
                    'score',
                    `Anxiety level: ${anxiety}/10`
                ));
            }

            if (stress) {
                observations.push(this.createFHIRObservation(
                    'survey',
                    { code: '72133-2', display: 'Stress level' },
                    stress,
                    'score',
                    `Stress level: ${stress}/10`
                ));
            }

            if (sleep) {
                observations.push(this.createFHIRObservation(
                    'vital-signs',
                    { code: '93832-4', display: 'Sleep duration' },
                    sleep,
                    'h'
                ));
            }

            if (sleepQuality) {
                observations.push(this.createFHIRObservation(
                    'survey',
                    { code: '72133-2', display: 'Sleep quality' },
                    sleepQuality,
                    'score',
                    `Sleep quality: ${sleepQuality}/10`
                ));
            }

            if (notes) {
                observations.push(this.createFHIRObservation(
                    'social-history',
                    { code: '48767-8', display: 'Mental health note' },
                    notes,
                    null
                ));
            }

            if (observations.length === 0) {
                res.status(400).send('<div class="error">Please enter at least one mental health metric</div>');
                return;
            }

            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: observations.map(obs => ({ resource: obs }))
            };

            this.storeHealthData(fhirBundle, 'mental-health');
            console.log('🧠 Mental health data recorded');
            
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording mental health:', error);
            res.status(500).send('<div class="error">Error recording mental health</div>');
        }
    }

    private recordLab(req: express.Request, res: express.Response): void {
        try {
            const { glucose, cholesterol, hdl, ldl, hemoglobin, whiteBloodCells, notes } = req.body;
            const observations: FHIRObservation[] = [];

            if (glucose) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '33747-0', display: 'Glucose' },
                    glucose,
                    'mg/dL'
                ));
            }

            if (cholesterol) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '2093-3', display: 'Total cholesterol' },
                    cholesterol,
                    'mg/dL'
                ));
            }

            if (hdl) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '2085-9', display: 'HDL cholesterol' },
                    hdl,
                    'mg/dL'
                ));
            }

            if (ldl) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '2089-1', display: 'LDL cholesterol' },
                    ldl,
                    'mg/dL'
                ));
            }

            if (hemoglobin) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '718-7', display: 'Hemoglobin' },
                    hemoglobin,
                    'g/dL'
                ));
            }

            if (whiteBloodCells) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '6690-2', display: 'White blood cells' },
                    whiteBloodCells,
                    'K/uL'
                ));
            }

            if (notes) {
                observations.push(this.createFHIRObservation(
                    'laboratory',
                    { code: '48767-8', display: 'Lab notes' },
                    notes,
                    null
                ));
            }

            if (observations.length === 0) {
                res.status(400).send('<div class="error">Please enter at least one lab value</div>');
                return;
            }

            const fhirBundle: FHIRBundle = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: observations.map(obs => ({ resource: obs }))
            };

            this.storeHealthData(fhirBundle, 'lab-results');
            console.log('🔬 Lab data recorded');
            
            this.getTimeline(req, res);
        } catch (error) {
            console.error('Error recording lab data:', error);
            res.status(500).send('<div class="error">Error recording lab data</div>');
        }
    }

    private exportKeys(req: express.Request, res: express.Response): void {
        // This is a demo endpoint - in real implementation, this would handle Nostr key export
        res.json({ message: 'Key export functionality would be implemented on client side' });
    }

    public start(port: number = 3000): void {
        this.app.listen(port, () => {
            console.log(`🏥 Personal Health Record server running on http://localhost:${port}`);
            console.log(`📊 HTMX + TypeScript version with FHIR compliance`);
        });
    }
}

// Start the server
const server = new HealthRecordServer();
server.start();
