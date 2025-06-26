# CivicSense Platform

> **Civic education that politicians don't want you to have.**

CivicSense transforms passive observers into confident, informed participants in democracy by revealing uncomfortable truths about how power actually works in America.

## 🏛️ Mission & Values

- **Truth Over Comfort**: Expose how power actually flows vs. how it appears
- **Clarity Over Politeness**: Direct, evidence-based communication 
- **Action Over Passive Consumption**: Connect learning to real civic engagement
- **Evidence Over Opinion**: All content backed by verifiable sources
- **Systems Thinking**: Reveal systemic patterns, not surface solutions

## 🚀 Platform Overview

CivicSense is a full-stack civic education platform built with:
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mobile**: React Native + Expo (coming soon)
- **AI**: OpenAI GPT-4 for content generation and analysis
- **Styling**: Tailwind CSS with custom design system

## 📱 Core Platform Features

### 🎯 Quiz & Assessment System
| Feature | Status | Description |
|---------|--------|-------------|
| **Quiz Engine** | ✅ **Active** | Core quiz functionality with progress tracking |
| **Civics Test** | ✅ **Active** | Official civics knowledge assessment |
| **Skills Assessment** | ✅ **Active** | Civic skills evaluation framework |
| **Multiplayer Quizzes** | 🚧 **Beta** | Real-time competitive learning |
| **Quiz Sessions** | ✅ **Active** | Persistent quiz state management |

### 📚 Content & Learning
| Feature | Status | Description |
|---------|--------|-------------|
| **Topics & Categories** | ✅ **Active** | Organized civic education content |
| **Collections** | ✅ **Active** | Curated content bundles |
| **Scenarios** | ✅ **Active** | Interactive civic engagement simulations |
| **Glossary** | ✅ **Active** | Civic terms and definitions |
| **News Integration** | 🚧 **Beta** | Current events with civic context |

### 👥 Social & Community
| Feature | Status | Description |
|---------|--------|-------------|
| **Learning Pods** | ✅ **Active** | Group learning and discussion |
| **User Profiles** | ✅ **Active** | Progress tracking and achievements |
| **Bookmarks** | ✅ **Active** | Save and organize content |
| **Feedback System** | ✅ **Active** | User feedback and improvement tracking |

### 🏛️ Government Data Integration
| Feature | Status | Description |
|---------|--------|-------------|
| **Congressional Data** | ✅ **Active** | Bills, votes, committee data |
| **Public Figures** | ✅ **Active** | Politician profiles and voting records |
| **Legislative Tracking** | 🚧 **Beta** | Real-time bill monitoring |
| **Representative Lookup** | ✅ **Active** | Find your representatives |

## 🛠️ Admin & Management Tools

### 📊 Analytics & Insights
| Tool | Status | Description |
|------|--------|-------------|
| **User Analytics** | ✅ **Active** | User engagement and learning metrics |
| **Content Analytics** | ✅ **Active** | Content performance tracking |
| **Quiz Analytics** | ✅ **Active** | Question difficulty and effectiveness |
| **Congressional Analytics** | ✅ **Active** | Government data insights |

### 🤖 AI-Powered Tools
| Tool | Status | Description |
|------|--------|-------------|
| **Content Generation** | ✅ **Active** | AI-generated quiz questions and topics |
| **News Agent** | 🚧 **Beta** | Automated news analysis and packaging |
| **Bill Analysis** | ✅ **Active** | Legislative document processing |
| **Collection Organizer** | ✅ **Active** | Smart content curation |
| **Unified AI Tools** | 🚧 **Development** | Centralized AI orchestration |

### 📝 Content Management
| Tool | Status | Description |
|------|--------|-------------|
| **Question Topics Manager** | ✅ **Active** | Create and manage quiz topics |
| **Survey Builder** | ✅ **Active** | Custom survey creation |
| **Media Management** | ✅ **Active** | Image and media organization |
| **Translation System** | 🚧 **Beta** | Multi-language content |
| **Scheduled Content** | ✅ **Active** | Content publishing automation |

## 🗂️ Directory Structure

### `/app` - Main Application
```
app/
├── (auth)/              # Authentication flows
├── (dashboard)/         # User dashboard
├── admin/              # Admin interface
├── api/                # API endpoints
├── quiz/               # Quiz system
├── multiplayer/        # Real-time features
├── assessment/         # Skill assessments
├── topics/             # Content topics
├── collections/        # Content collections
├── scenarios/          # Interactive scenarios
├── congress/           # Congressional data
├── public-figures/     # Politician profiles
├── learning-pods/      # Group learning
├── onboarding/         # User onboarding
└── settings/           # User preferences
```

### `/components` - Reusable Components
```
components/
├── ui/                 # Design system components
├── quiz/               # Quiz-specific components
├── multiplayer/        # Real-time components
├── auth/               # Authentication components
├── admin/              # Admin interface components
├── congressional/      # Government data components
├── learning-pods/      # Group learning components
└── accessibility/      # Accessibility utilities
```

### `/lib` - Core Services & Utilities
```
lib/
├── ai/                 # AI tools and agents
├── services/           # Business logic services
├── supabase/           # Database layer
├── integrations/       # External API integrations
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🔗 API Endpoints

### Authentication & User Management
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login  
- `GET /api/user/profile` - User profile data
- `PUT /api/user/preferences` - Update user settings

### Quiz & Assessment System
- `GET /api/quiz/[topicId]` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz attempt
- `GET /api/civics-test/questions` - Civics test questions
- `POST /api/assessment/skills` - Skills assessment

### Content & Learning
- `GET /api/topics` - List all topics
- `GET /api/topics/[topicId]` - Topic details
- `GET /api/collections` - Content collections
- `GET /api/scenarios` - Interactive scenarios

### Congressional Data
- `GET /api/congressional/bills` - Congressional bills
- `GET /api/congressional/members` - Congress members
- `GET /api/congressional/votes` - Voting records

### Admin Tools
- `POST /api/admin/ai-tools` - AI content generation
- `GET /api/admin/analytics/users` - User analytics
- `POST /api/admin/collections/suggest` - AI collection suggestions

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and profiles
- **question_topics** - Quiz topic organization
- **questions** - Individual quiz questions
- **user_quiz_attempts** - Quiz completion tracking
- **collections** - Content collections
- **learning_pods** - Group learning spaces

### Congressional Data
- **congressional_bills** - Bills and legislation
- **congressional_members** - House and Senate members
- **congressional_votes** - Voting records
- **committee_hearings** - Committee proceedings

### Content Management
- **categories** - Content categorization
- **surveys** - Custom surveys and forms
- **glossary_terms** - Civic terminology
- **scenarios** - Interactive civic scenarios

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- OpenAI API key

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# External APIs
CONGRESS_API_KEY=your_congress_key
PROPUBLICA_API_KEY=your_propublica_key
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/civic-sense-main.git
cd civic-sense-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run accessibility tests
npm run test:a11y

# Run end-to-end tests
npm run test:e2e
```

## 📊 Current Status

### ✅ Production Ready
- Core quiz functionality
- User authentication and profiles
- Congressional data integration
- Basic admin tools
- Content management system

### 🚧 Beta/Testing
- Multiplayer quiz system
- AI content generation
- Advanced analytics
- Translation system
- News integration

### 🔄 In Development
- Mobile app (React Native)
- Advanced AI orchestration
- Enhanced learning pods
- Gamification features
- Advanced civic scenarios

### 📋 Planned Features
- Teacher/classroom integration
- Advanced progress tracking
- Civic action tracking
- Community challenges
- API for third-party integrations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes following our coding standards
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **Accessibility**: WCAG 2.1 AA compliance required
- **Testing**: Comprehensive test coverage
- **Performance**: Core Web Vitals optimization
- **Security**: Regular security audits

### Content Standards
- All content must reveal uncomfortable truths about power
- Use active voice that assigns responsibility
- Name specific institutions and officials
- Provide actionable civic engagement steps
- Include verifiable source citations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://civicsense.com
- **Documentation**: https://docs.civicsense.com
- **API Documentation**: https://api.civicsense.com/docs
- **Support**: support@civicsense.com

---

**Remember**: We're not building a typical app. We're building civic education that politicians don't want people to have. Every technical decision should advance democratic participation.

*This is code that strengthens democracy. Build it well.* 