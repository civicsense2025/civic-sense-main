# Multi-LMS Integration for CivicSense

*Civic education that bridges institutional learning with community engagement*

## Overview

CivicSense now supports integration with multiple Learning Management Systems (LMS) to provide seamless civic education experiences for schools and educational institutions. This system supports both **Google Classroom** and **Clever** platforms.

## Supported Platforms

### Google Classroom
- **Full bi-directional integration** with automatic grade passback
- **Assignment creation** directly from CivicSense quizzes
- **Roster synchronization** with learning pods
- **Share-to-Classroom** buttons on quiz pages
- **Real-time grade sync** to Google Classroom gradebook

### Clever
- **Roster synchronization** with learning pods
- **Assignment creation** with CivicSense quiz links
- **Internal grade tracking** with downloadable reports
- **Section-based** student and teacher management
- **Share-to-Clever** functionality for educators

## Architecture

### Hybrid School-Pod System
```
District Level
├── Schools
│   ├── Courses/Sections
│   │   ├── Institutional Learning Pods
│   │   └── LMS Integration (Google Classroom OR Clever)
│   └── School-wide Events
└── District Programs
```

### Database Schema
The system uses a dedicated `school` schema for institutional data:
- `school.districts` - District-level organization
- `school.schools` - Individual schools
- `school.courses` - Courses/sections with LMS platform support
- `school.enrollments` - Student-teacher assignments
- `school.assignments` - CivicSense assignments in LMS
- `school.sync_logs` - Integration monitoring and debugging

## Implementation Guide

### 1. Database Setup

Run the migrations in order:
```bash
# Add multi-LMS support to existing tables
supabase db pull
supabase migration up --to 20240622_add_multi_lms_support

# If using new school schema (recommended for compliance)
supabase migration up --to 20240621_create_school_schema
supabase migration up --to 20240621_school_schema_rls_policies
supabase migration up --to 20240621_pod_school_integration
```

### 2. Environment Configuration

Add to your `.env.local`:
```bash
# Google Classroom (existing)
GOOGLE_CLASSROOM_CLIENT_ID=your_google_client_id
GOOGLE_CLASSROOM_CLIENT_SECRET=your_google_client_secret

# Clever Integration
CLEVER_CLIENT_ID=your_clever_client_id
CLEVER_CLIENT_SECRET=your_clever_client_secret
CLEVER_ENVIRONMENT=sandbox # or 'production'
CLEVER_REDIRECT_URI=https://your-domain.com/api/auth/clever/callback

# Multi-LMS Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. OAuth Setup

#### Google Classroom OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google Classroom API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

#### Clever OAuth
1. Go to [Clever Developer Dashboard](https://dev.clever.com/)
2. Create a new application
3. Configure OAuth settings
4. Set up webhook endpoints (optional)
5. Request production access

## API Endpoints

### Google Classroom Endpoints
```
POST /api/integrations/classroom/sync-roster
POST /api/integrations/classroom/create-assignment
POST /api/integrations/classroom/process-grades
GET  /api/integrations/classroom/import
```

### Clever Endpoints
```
POST /api/integrations/clever/sync-roster
POST /api/integrations/clever/create-assignment
POST /api/integrations/clever/process-grades
GET  /api/integrations/clever/import
```

## Components

### Unified LMS Integration Panel
```tsx
import { LMSIntegrationPanel } from '@/components/integrations/lms-integration-panel'

<LMSIntegrationPanel
  podId={podId}
  podName={podName}
  lmsPlatform="google_classroom" // or "clever"
  userRole={userRole}
  onUpdate={handleUpdate}
/>
```

### Share Buttons
```tsx
// Google Classroom
import { ClassroomShareButton } from '@/components/integrations/google-classroom-share-button'

// Clever
import { CleverShareButton } from '@/components/integrations/clever-share-button'
```

## Integration Services

### Google Classroom Integration
```typescript
import { GoogleClassroomIntegration } from '@/lib/integrations/google-classroom'

const classroom = new GoogleClassroomIntegration()
classroom.setAccessToken(token)
await classroom.syncRoster(podId)
```

### Clever Integration
```typescript
import { CleverIntegration } from '@/lib/integrations/clever'

const clever = new CleverIntegration()
clever.setAccessToken(token)
await clever.syncRoster(podId)
```

## Workflow Examples

### Teacher Workflow
1. **Connect to LMS**: Teacher selects Google Classroom or Clever
2. **Authenticate**: OAuth flow completes
3. **Select Course**: Choose course/section to link
4. **Sync Roster**: Import students into learning pod
5. **Create Assignments**: Share CivicSense quizzes as assignments
6. **Grade Sync**: Automatic or manual grade processing

### Student Workflow
1. **Join Pod**: Added automatically via roster sync
2. **Access Assignment**: Click link from LMS
3. **Complete Quiz**: Take CivicSense quiz
4. **Receive Grade**: Score appears in LMS gradebook (Google Classroom)

## Key Features

### Multi-Platform Support
- **Platform Selection**: Choose between Google Classroom and Clever
- **Unified Interface**: Same UI for both platforms
- **Platform-Specific Features**: Leverage unique capabilities of each LMS

### Grade Management
- **Google Classroom**: Automatic grade passback to gradebook
- **Clever**: Internal tracking with exportable reports
- **Flexible Scoring**: Configurable point values and rubrics

### Roster Synchronization
- **Automatic Sync**: Regular roster updates
- **Permission-Based**: Role-based access control
- **Conflict Resolution**: Handle enrollment changes gracefully

### Assignment Creation
- **One-Click Sharing**: Share quizzes directly to LMS
- **Customizable**: Set due dates, points, descriptions
- **Tracking**: Monitor completion and engagement

## Security & Privacy

### Data Protection
- **FERPA Compliance**: Educational data privacy protection
- **COPPA Compliance**: Children's online privacy protection
- **Minimal Data**: Only sync necessary information
- **Secure Storage**: Encrypted data transmission and storage

### Access Control
- **Role-Based**: Teachers, parents, admins only
- **Permission Checks**: Verify LMS permissions
- **Audit Trail**: Complete sync and access logging

## Monitoring & Analytics

### Sync Monitoring
- **Success Rates**: Track sync completion
- **Error Handling**: Detailed error reporting
- **Performance Metrics**: Sync speed and reliability
- **Automated Retries**: Resilient sync operations

### Usage Analytics
- **Engagement Tracking**: Student participation rates
- **Performance Metrics**: Quiz completion and scores
- **LMS Comparison**: Platform-specific insights
- **Institutional Reporting**: District and school-level data

## Troubleshooting

### Common Issues

#### Connection Failures
- **Symptom**: Cannot connect to LMS
- **Solution**: Check OAuth credentials and scopes
- **Debug**: Review API keys and redirect URIs

#### Sync Errors
- **Symptom**: Roster sync fails
- **Solution**: Verify permissions and API access
- **Debug**: Check sync logs and error messages

#### Grade Passback Issues
- **Symptom**: Grades not appearing in LMS
- **Solution**: Check assignment linking and permissions
- **Debug**: Review grade processing logs

### Debug Tools
- **Sync Logs**: View detailed sync operations
- **API Response**: Check raw API responses
- **Permission Audit**: Verify user and LMS permissions
- **Test Endpoints**: Validate API connectivity

## Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Test integrations
npm run test:integrations
```

### Testing
```bash
# Run all tests
npm test

# Test specific integration
npm run test:classroom
npm run test:clever

# E2E tests
npm run test:e2e
```

## Deployment

### Production Checklist
- [ ] OAuth credentials configured
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] SSL certificates valid
- [ ] Webhook endpoints configured
- [ ] Monitoring alerts set up
- [ ] Backup procedures in place

### Scaling Considerations
- **Rate Limiting**: Respect LMS API limits
- **Caching**: Cache frequently accessed data
- **Queue Processing**: Handle batch operations
- **Load Balancing**: Distribute API requests

## Support

### Resources
- **Documentation**: Full API and component docs
- **Examples**: Sample implementations
- **Community**: Discord support channel
- **Professional**: Enterprise support available

### Reporting Issues
1. Check existing documentation
2. Review troubleshooting guide
3. Search GitHub issues
4. Create detailed bug report
5. Include logs and environment info

## Roadmap

### Upcoming Features
- **Canvas Integration**: Support for Canvas LMS
- **Schoology Integration**: Additional LMS platform
- **Advanced Analytics**: Deeper learning insights
- **Mobile Apps**: Native mobile support
- **Offline Sync**: Offline-first capabilities

### Long-term Vision
- **Universal LMS**: Support all major LMS platforms
- **AI-Powered**: Intelligent assignment recommendations
- **Adaptive Learning**: Personalized civic education paths
- **Global Scale**: Multi-language and multi-region support

---

## Quick Start

1. **Choose Platform**: Select Google Classroom or Clever
2. **Configure OAuth**: Set up authentication
3. **Run Migrations**: Apply database changes
4. **Import Courses**: Connect to existing classes
5. **Sync Rosters**: Import students and teachers
6. **Create Assignments**: Share your first CivicSense quiz
7. **Monitor Results**: Track engagement and learning

**Ready to transform civic education in your school?** [Get started with the setup guide](./docs/SETUP-GUIDE.md) 