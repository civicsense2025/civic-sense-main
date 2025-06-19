# CivicSense School Schema Architecture

## Overview

CivicSense uses a dedicated `school` schema to handle all educational institution data, separate from the general civic learning platform. This architectural decision provides better data isolation, security, compliance, and scalability for educational use cases.

## Why a Separate Schema?

### 1. **Data Isolation & Security**
- **Educational data separation**: Student and teacher data is isolated from general civic learning data
- **FERPA compliance**: Educational records have different privacy requirements than general user data
- **COPPA compliance**: Better protection for student data under age 13
- **Granular permissions**: School-specific RLS policies separate from general platform policies

### 2. **Scalability & Performance**
- **Independent scaling**: School data can be scaled separately from civic learning data
- **Optimized queries**: Indexes and queries optimized specifically for educational workflows
- **Future database separation**: Could be moved to dedicated education databases if needed
- **Multi-tenancy**: Better support for multiple school districts with isolated data

### 3. **Compliance & Governance**
- **Educational regulations**: Easier to implement FERPA, COPPA, and state education regulations
- **Data retention**: Different retention policies for educational vs. general civic data
- **Audit trails**: Comprehensive logging of all educational data access and modifications
- **Export capabilities**: Easier to export school data for compliance or migration

### 4. **Integration Flexibility**
- **Google Classroom**: Dedicated tables for Classroom-specific data and sync operations
- **Future LMS integrations**: Canvas, Blackboard, Schoology can be added without affecting core platform
- **SIS integration**: Student Information Systems can sync with dedicated school tables
- **Assessment platforms**: Integration with educational assessment tools

## Schema Structure

### Core Tables

#### `school.districts`
- School district information
- Used for multi-district deployments
- Contains district-wide settings and policies

```sql
CREATE TABLE school.districts (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL, -- e.g., "LAUSD"
  state text NOT NULL,
  contact_email text,
  domain text, -- Email domain for auto-verification
  settings jsonb DEFAULT '{}'
);
```

#### `school.schools`
- Individual schools within districts
- Allows for district-wide and school-specific configurations

```sql
CREATE TABLE school.schools (
  id uuid PRIMARY KEY,
  district_id uuid REFERENCES school.districts(id),
  name text NOT NULL,
  code text NOT NULL, -- School code within district
  address jsonb,
  principal_email text,
  settings jsonb DEFAULT '{}'
);
```

#### `school.user_profiles`
- Extended user profiles for educational context
- Links to main `auth.users` table
- Contains school-specific roles and information

```sql
CREATE TABLE school.user_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  school_district_id uuid REFERENCES school.districts(id),
  student_id text, -- School's internal student ID
  employee_id text, -- School's internal employee ID
  role school_user_role NOT NULL DEFAULT 'student',
  grade_level text,
  graduation_year integer,
  parent_email text,
  emergency_contact jsonb
);
```

#### `school.courses`
- Classroom courses (linked to Google Classroom or other LMS)
- Contains course-specific settings and metadata

```sql
CREATE TABLE school.courses (
  id uuid PRIMARY KEY,
  school_id uuid REFERENCES school.schools(id),
  google_classroom_id text,
  name text NOT NULL,
  description text,
  section text,
  subject text,
  grade_level text,
  teacher_id uuid REFERENCES auth.users(id),
  academic_year text NOT NULL,
  semester text,
  is_active boolean DEFAULT true
);
```

#### `school.enrollments`
- Student and teacher enrollments in courses
- Supports multiple roles (student, teacher, TA, observer)

```sql
CREATE TABLE school.enrollments (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES school.courses(id),
  user_id uuid REFERENCES auth.users(id),
  role course_role NOT NULL DEFAULT 'student',
  enrollment_date timestamptz DEFAULT now(),
  status enrollment_status DEFAULT 'active',
  grade_override text
);
```

### Integration Tables

#### `school.course_pod_links`
- Links classroom courses to CivicSense learning pods
- Enables bi-directional sync between educational and civic learning contexts

```sql
CREATE TABLE school.course_pod_links (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES school.courses(id),
  pod_id uuid REFERENCES public.learning_pods(id),
  sync_enabled boolean DEFAULT true,
  grade_passback_enabled boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id)
);
```

#### `school.assignments`
- Classroom assignments linked to CivicSense content
- Supports grade passback to LMS systems

```sql
CREATE TABLE school.assignments (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES school.courses(id),
  google_classroom_assignment_id text,
  title text NOT NULL,
  description text,
  topic_id text, -- CivicSense topic/quiz ID
  quiz_type text,
  max_points integer DEFAULT 100,
  due_date timestamptz,
  created_by uuid REFERENCES auth.users(id)
);
```

#### `school.submissions`
- Student submissions and grades
- Links to CivicSense quiz attempts for automatic grading

```sql
CREATE TABLE school.submissions (
  id uuid PRIMARY KEY,
  assignment_id uuid REFERENCES school.assignments(id),
  student_id uuid REFERENCES auth.users(id),
  quiz_attempt_id uuid, -- Links to public.user_quiz_attempts
  score numeric(5,2),
  max_score numeric(5,2),
  submitted_at timestamptz,
  graded_at timestamptz,
  grade_synced_at timestamptz, -- When synced back to LMS
  feedback text
);
```

### Monitoring & Logging

#### `school.sync_logs`
- Comprehensive logging of all sync operations
- Supports troubleshooting and compliance auditing

```sql
CREATE TABLE school.sync_logs (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES school.courses(id),
  pod_id uuid REFERENCES public.learning_pods(id),
  sync_type sync_type NOT NULL,
  sync_status sync_status DEFAULT 'pending',
  records_processed integer DEFAULT 0,
  records_successful integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  started_by uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

## Security Model

### Row Level Security (RLS)

All tables in the school schema implement comprehensive RLS policies:

#### User Profile Access
- Users can view and update their own school profiles
- Teachers can view profiles of students in their courses
- Administrators can view profiles within their district

#### Course Access
- Teachers can manage their own courses
- Students can view courses they're enrolled in
- District administrators can view all courses in their district

#### Assignment & Grade Access
- Teachers can manage assignments for their courses
- Students can view their own assignments and grades
- Parents can view their children's assignments and grades (when properly linked)

#### Sync Log Access
- Teachers can view sync logs for their courses
- Pod administrators can view sync logs for their pods
- District administrators can view all sync logs in their district

### Data Privacy

#### FERPA Compliance
- Educational records are isolated in the school schema
- Access is strictly controlled through RLS policies
- Comprehensive audit logging of all data access
- Data retention policies can be implemented per district

#### COPPA Compliance
- Enhanced protections for users under 13
- Parental consent workflows can be implemented
- Restricted data collection for minors
- Secure data handling procedures

## Integration Workflows

### Google Classroom Integration

#### 1. Course Import
```typescript
// Import a Google Classroom course
const courseId = await classroom.importCourse(
  googleClassroomId,
  schoolId,
  podId // Optional: link to existing learning pod
)
```

#### 2. Roster Sync
```typescript
// Sync students and teachers from Google Classroom
const result = await classroom.syncRoster(courseId)
console.log(`Added ${result.studentsAdded} students, ${result.teachersAdded} teachers`)
```

#### 3. Assignment Creation
```typescript
// Create assignment in Google Classroom linked to CivicSense content
const assignmentId = await classroom.createAssignment(
  courseId,
  'Constitutional Rights Quiz',
  'Complete this quiz to test your knowledge of constitutional rights',
  'constitutional-rights', // CivicSense topic ID
  new Date('2024-12-15'), // Due date
  100 // Max points
)
```

#### 4. Grade Passback
```typescript
// Process pending grades and send to Google Classroom
const result = await classroom.processGrades(courseId)
console.log(`Processed ${result.processed} grades, ${result.successful} successful`)
```

### Future LMS Integrations

The schema is designed to support additional LMS integrations:

- **Canvas**: Add `canvas_course_id` and `canvas_assignment_id` fields
- **Blackboard**: Add `blackboard_course_id` and `blackboard_assignment_id` fields
- **Schoology**: Add `schoology_course_id` and `schoology_assignment_id` fields

## API Endpoints

### Course Management
- `POST /api/integrations/classroom/import` - Import Google Classroom course
- `POST /api/integrations/classroom/sync-roster` - Sync course roster
- `GET /api/integrations/classroom/courses` - List linked courses

### Assignment Management
- `POST /api/integrations/classroom/create-assignment` - Create assignment
- `GET /api/integrations/classroom/assignments` - List assignments
- `PUT /api/integrations/classroom/assignments/:id` - Update assignment

### Grade Management
- `POST /api/integrations/classroom/process-grades` - Process pending grades
- `GET /api/integrations/classroom/grades` - List grades
- `POST /api/integrations/classroom/submit-grade` - Submit individual grade

### Monitoring
- `GET /api/integrations/classroom/sync-status` - Get sync status and logs
- `GET /api/integrations/classroom/health` - Check integration health

## Migration Strategy

### From Public Schema
If you have existing classroom integration data in the public schema:

1. **Data Migration**: Run migration scripts to move data to school schema
2. **API Updates**: Update API endpoints to use school schema
3. **RLS Migration**: Apply new RLS policies
4. **Testing**: Comprehensive testing of all integration workflows

### New Installations
For new CivicSense installations:

1. **Run Migrations**: Apply school schema migrations
2. **Configure Districts**: Set up school districts and schools
3. **User Setup**: Create school user profiles
4. **Integration Setup**: Configure Google Classroom or other LMS integrations

## Monitoring & Maintenance

### Health Checks
- Monitor sync operation success rates
- Track API response times
- Verify data consistency between CivicSense and LMS
- Monitor RLS policy performance

### Compliance Auditing
- Regular reviews of data access logs
- Verification of privacy policy compliance
- Assessment of data retention practices
- Security vulnerability assessments

### Performance Optimization
- Index optimization for large school deployments
- Query performance monitoring
- Database connection pooling
- Caching strategies for frequently accessed data

## Best Practices

### Development
1. **Always use the school schema** for educational data
2. **Implement proper error handling** for LMS API calls
3. **Use transactions** for multi-step operations
4. **Log all sync operations** for troubleshooting
5. **Test with real classroom data** when possible

### Security
1. **Follow principle of least privilege** for RLS policies
2. **Regularly audit data access** patterns
3. **Implement proper authentication** for LMS integrations
4. **Use encrypted connections** for all external API calls
5. **Regularly rotate API keys** and access tokens

### Compliance
1. **Document all data flows** for compliance reviews
2. **Implement data retention policies** per district requirements
3. **Provide data export capabilities** for user requests
4. **Maintain audit logs** for regulatory compliance
5. **Regular privacy impact assessments** for new features

## Conclusion

The school schema architecture provides CivicSense with a robust, scalable, and compliant foundation for educational integrations. By separating educational data from general civic learning data, we can:

- Better serve educational institutions with specialized features
- Maintain compliance with educational privacy regulations
- Scale educational and civic learning features independently
- Provide enhanced security and data protection for students and teachers

This architecture positions CivicSense to become the leading platform for civic education in schools while maintaining the flexibility to serve general civic learning audiences. 