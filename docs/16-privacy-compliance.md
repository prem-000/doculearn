# Privacy Compliance Guide

This document provides detailed guidance for GDPR compliance and privacy best practices.

---

## 1. GDPR Compliance Implementation

### 1.1 Right to Access (Article 15)

**Implementation**: User data export functionality

```typescript
// app/api/user/export/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const deviceId = request.headers.get('x-device-id') || 'anonymous';

  // Gather all user data for this device
  const [settings, nodes, memory, apiUsage] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', deviceId).single(),
    supabase.from('node_graph_sync').select('*').eq('user_id', deviceId),
    supabase.from('user_memory').select('*').eq('user_id', deviceId),
    supabase.from('api_key_usage').select('key_index, status, request_count, last_used').eq('user_id', deviceId)
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    device_id: deviceId,
    settings: settings.data,
    question_history: nodes.data,
    learning_memory: memory.data,
    api_usage: apiUsage.data,
    note: 'Document content and embeddings are stored locally in your browser and are not included in this export.'
  };

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="doculearn-data-${deviceId}.json"`,
      'Content-Type': 'application/json'
    }
  });
}
```

### 1.2 Right to Erasure (Article 17)

**Implementation**: Complete cloud data deletion

```typescript
// app/api/user/delete/route.ts
export async function DELETE(request: Request) {
  const supabase = createServerClient();
  const deviceId = request.headers.get('x-device-id') || 'anonymous';

  // Delete all data for this device
  await supabase.from('node_graph_sync').delete().eq('user_id', deviceId);
  await supabase.from('user_memory').delete().eq('user_id', deviceId);
  await supabase.from('api_key_usage').delete().eq('user_id', deviceId);
  await supabase.from('user_settings').delete().eq('user_id', deviceId);

  // Also clear local IndexedDB (handled client-side after this response)

  return NextResponse.json({ 
    success: true,
    message: 'All cloud data for this device deleted permanently'
  });
}
```

### 1.3 Right to Data Portability (Article 20)

**Implementation**: Export in machine-readable format

```typescript
// app/api/user/export-portable/route.ts
export async function GET(request: Request) {
  const supabase = createServerClient();
  const deviceId = request.headers.get('x-device-id') || 'anonymous';
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json'; // json, csv

  const nodes = await supabase
    .from('node_graph_sync')
    .select('*')
    .eq('user_id', deviceId);

  if (format === 'csv') {
    const csv = convertToCSV(nodes.data);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="doculearn-questions-${deviceId}.csv"`
      }
    });
  }

  // Default: JSON
  return NextResponse.json(nodes.data);
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}
```

### 1.4 Consent Management

**Implementation**: Granular privacy controls

```typescript
// app/api/user/consent/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient();
  const deviceId = request.headers.get('x-device-id') || 'anonymous';

  const { consent_type, granted } = await request.json();
  
  // Valid consent types
  const validTypes = ['cloud_sync', 'analytics'];
  if (!validTypes.includes(consent_type)) {
    return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 });
  }

  // Update consent
  await supabase
    .from('user_consents')
    .upsert({
      user_id: deviceId,
      consent_type,
      granted,
      updated_at: new Date().toISOString()
    });

  // If cloud sync disabled, delete synced data
  if (consent_type === 'cloud_sync' && !granted) {
    await supabase.from('node_graph_sync').delete().eq('user_id', deviceId);
    await supabase.from('user_memory').delete().eq('user_id', deviceId);
  }

  return NextResponse.json({ success: true });
}
```

### 1.5 Consent Database Schema

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,            -- device/session identifier
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);
```

---

## 2. Privacy Policy Template

### Required Sections

```markdown
# Privacy Policy for DocuLearn AI

**Last Updated**: [Date]

## 1. Data We Collect

### 1.1 Identity Information
- No account required (no login)
- Device ID stored locally in browser

### 1.2 Usage Data (Optional, with consent)
- Questions asked (stored locally by default)
- Learning progress (stored locally by default)
- API usage statistics (for key management only)

### 1.3 Data We DO NOT Collect
- ❌ No email address or account credentials
- ❌ Document content (never leaves your browser)
- ❌ Document filenames (stored locally only)
- ❌ Browsing history
- ❌ Device information
- ❌ Location data
- ❌ Analytics or tracking data

## 2. How We Use Your Data

### 2.1 Essential Uses
- API key management (encrypted storage)
- Service functionality (answering questions)

### 2.2 Optional Uses (Requires Consent)
- Cloud sync of Q&A history
- Learning progress tracking
- Weak area identification

## 3. Data Storage

### 3.1 Local Storage (Browser)
- Document content: Stored in browser memory only
- Parsed text: IndexedDB (your device)
- Embeddings: IndexedDB (your device)
- Q&A history: IndexedDB (your device, optionally synced)

### 3.2 Cloud Storage (Supabase)
- API keys: Encrypted in Supabase PostgreSQL
- Q&A history: Only if cloud sync enabled
- Learning memory: Only if cloud sync enabled

### 3.3 Third-Party Services
- **Google Gemini API**: Receives text chunks (not full documents) for answering questions
- **Ollama**: If configured, runs locally on your machine (no data sent externally)

## 4. Data Sharing

We DO NOT:
- ❌ Sell your data
- ❌ Share data with advertisers
- ❌ Use data for marketing
- ❌ Share data with third parties (except as required by law)

We DO share:
- ✅ Text chunks with Google Gemini API (for answering questions only)
- ✅ Data with law enforcement if legally required

## 5. Your Rights (GDPR)

You have the right to:
- ✅ Access your data (Settings → Export Data)
- ✅ Delete your data (Settings → Delete All Cloud Data)
- ✅ Correct your data (Settings → Update Profile)
- ✅ Port your data (Settings → Export in CSV/JSON)
- ✅ Withdraw consent (Settings → Privacy Controls)
- ✅ Object to processing (contact us)

## 6. Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Q&A history (local) | Until browser data cleared |
| Q&A history (cloud) | Until device data deleted or sync disabled |
| API usage logs | 90 days |
| Security logs | 1 year |

## 7. Security Measures

- 🔒 API keys encrypted at rest (pgcrypto)
- 🔒 HTTPS only (TLS 1.3)
- 🔒 No user accounts — no credentials to steal
- 🔒 Regular security audits

## 8. Children's Privacy

DocuLearn AI is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected data from a child under 13, contact us immediately.

## 9. Changes to This Policy

We will notify you of material changes via:
- Email notification
- In-app banner
- Updated "Last Updated" date

## 10. Contact Us

For privacy concerns or data requests:
- Email: privacy@doculearn.app
- Data Protection Officer: dpo@doculearn.app
- Address: [Your address for GDPR compliance]

## 11. Legal Basis for Processing (GDPR)

| Processing Activity | Legal Basis |
|---------------------|-------------|
| API key storage | Contract performance |
| Cloud sync | Consent (opt-in) |
| Security logging | Legitimate interest |
| Legal compliance | Legal obligation |
```

---

## 3. Cookie Policy

### Cookies Used by DocuLearn AI

```markdown
# Cookie Policy

## Essential Cookies (Always Active)

None. DocuLearn AI does not use session cookies or authentication cookies.

## Optional Cookies (Requires Consent)

None. We do not use analytics or marketing cookies.

## Third-Party Cookies

None. We do not embed third-party trackers.

## Managing Cookies

You can clear cookies via:
- Browser settings
- DocuLearn Settings → Clear Session
```

---

## 4. Terms of Service Template

```markdown
# Terms of Service

## 1. Acceptance of Terms

By using DocuLearn AI, you agree to these Terms of Service.

## 2. Service Description

DocuLearn AI is a document reading assistant that:
- Processes documents locally in your browser
- Answers questions using AI (Gemini or Ollama)
- Optionally syncs Q&A history to cloud

## 3. User Responsibilities

You agree to:
- ✅ Use the service legally and ethically
- ✅ Not abuse API rate limits
- ✅ Not use the service with illegal or harmful content

You agree NOT to:
- ❌ Attempt to hack or exploit the service
- ❌ Use the service for illegal purposes
- ❌ Violate others' intellectual property rights

## 4. API Key Usage

- You are responsible for your own Gemini API keys
- We encrypt and store keys securely
- We are not liable for Google API charges
- You must comply with Google's API Terms of Service

## 5. Data Processing

- Documents are processed locally (never uploaded)
- Text chunks are sent to AI APIs for answering
- See Privacy Policy for full details

## 6. Service Availability

- We strive for 99.9% uptime
- We are not liable for service interruptions
- We may perform maintenance with notice

## 7. Intellectual Property

- You retain ownership of your documents
- We do not claim rights to your content
- Our code and design are proprietary

## 8. Limitation of Liability

DocuLearn AI is provided "as is" without warranties. We are not liable for:
- Data loss (use backups)
- AI answer accuracy (verify important information)
- Third-party service failures (Gemini, Ollama)
- Indirect or consequential damages

## 9. Termination

We may block device IDs that:
- Violate these Terms
- Abuse the service
- Engage in illegal activity

You may delete your data anytime via Settings → Delete All Cloud Data.

## 10. Changes to Terms

We will notify you of material changes via email and in-app notice.

## 11. Governing Law

These Terms are governed by [Your jurisdiction] law.

## 12. Contact

For questions: legal@doculearn.app
```

---

## 5. Privacy-First UI Components

### Privacy Dashboard Component

```tsx
// components/PrivacyDashboard.tsx
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function PrivacyDashboard() {
  const [cloudSync, setCloudSync] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const handleExportData = async () => {
    const response = await fetch('/api/user/export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doculearn-data.json';
    a.click();
  };

  const handleDeleteData = async () => {
    const confirmed = confirm(
      'Are you sure? This will permanently delete all your cloud data.'
    );
    if (!confirmed) return;

    const response = await fetch('/api/user/delete', {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Cloud data deleted. Your local data will be cleared now.');
      // Clear IndexedDB locally too
    } else {
      alert('Failed to delete data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Cloud Sync</h3>
              <p className="text-sm text-gray-600">
                Sync Q&A history and learning progress to cloud
              </p>
            </div>
            <Switch checked={cloudSync} onCheckedChange={setCloudSync} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Usage Analytics</h3>
              <p className="text-sm text-gray-600">
                Help improve DocuLearn with anonymous usage data
              </p>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Your Data</h2>
        
        <div className="space-y-2">
          <Button onClick={handleExportData} variant="outline" className="w-full">
            📥 Export All Data (JSON)
          </Button>
          
          <Button onClick={handleExportData} variant="outline" className="w-full">
            📊 Export Q&A History (CSV)
          </Button>
          
          <Button 
            onClick={handleDeleteData} 
            variant="destructive" 
            className="w-full"
          >
            🗑️ Delete All Cloud Data Permanently
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Privacy Information</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
          <p>✅ Documents never leave your browser</p>
          <p>✅ API keys encrypted at rest</p>
          <p>✅ Optional cloud sync (disabled by default)</p>
          <p>✅ No tracking or analytics (unless enabled)</p>
          <p>✅ GDPR compliant</p>
        </div>
      </section>
    </div>
  );
}
```

---

## 6. Compliance Checklist

### Pre-Launch GDPR Compliance

- [ ] Privacy Policy published and accessible
- [ ] Cookie Policy published (if using cookies)
- [ ] Terms of Service published
- [ ] Consent management implemented
- [ ] Data export functionality working
- [ ] Data deletion functionality working
- [ ] Data portability (CSV/JSON export) working
- [ ] Privacy dashboard accessible to users
- [ ] Data retention policies documented
- [ ] Data Processing Agreement (DPA) prepared for B2B
- [ ] Data Protection Impact Assessment (DPIA) completed
- [ ] Data breach notification procedure documented
- [ ] User rights request procedure documented
- [ ] Privacy by design principles applied
- [ ] Data minimization verified
- [ ] Legal review completed

### Ongoing Compliance

- [ ] Privacy Policy reviewed annually
- [ ] User consent records maintained
- [ ] Data retention policies enforced
- [ ] Security measures audited regularly
- [ ] Staff trained on GDPR compliance
- [ ] Data breach response plan tested
- [ ] User rights requests handled within 30 days
- [ ] Third-party processors audited (Supabase, Google)

---

**Next**: Implement these privacy features during Week 9-10 (Polish phase) as outlined in `10-build-plan.md`.
