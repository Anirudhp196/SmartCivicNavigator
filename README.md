Smart Civic Navigator Technical Description

**Project Proposal**

Smart Civic Navigator is a Progressive Web App (PWA) designed to help community members discover and engage with local social services such as food banks, mental health support, housing resources, and more. The platform will also empower small nonprofits by enabling them to accept donations, gather volunteers, and manage their engagement—all within an ethical, accessible, and fair tech environment. Furthermore, the app will include geospatial search for public services based on location and need, fairness-aware recommender system that explains its choices, secure flows for making donations and signing up to volunteer, nonprofit-facing dashboard to manage service visibility, volunteer interest, and donations and weekly community insight reports for platform stakeholders.

**Technical Stack**

Frontend \+ Backend

* React: The frontend will be all react. The app has been created using npx create-react-app to begin with.  
* Tailwind CSS: Utility-first CSS framework ideal for building accessible, mobile-first UIs.  
* PWA Setup: Offline capabilities, installability, mobile UX parity.  
* MongoDB \+ Node.js \+ Express: Lightweight and performant backend framework.

ML & Recommender System

* Python (scikit-learn, Fairlearn): For training the recommendation engine and fairness analysis.  
* FastAPI: Lightweight Python API to expose ML models as microservices.

Third-Party Services

* Stripe or PayPal: For donation transactions.  
* Google Calendar API: To allow nonprofits to manage and publish volunteer slots.  
* Sentry: For error tracking.  
* AWS CloudWatch: Monitoring and logging.

Deployment & DevOps

* Docker: Containerization for microservices.  
* AWS Fargate: Serverless containers for scalable backend and ML microservices.  
* GitHub Actions: CI/CD workflows.

**Data Models**

User Model

* userId (UUID)  
* email (String, unique)  
* name (String)  
* location (Geolocation coordinates)  
* isNonProfit (Boolean)  
* organizationName (String, nullable)  
* role (Enum: resident, nonprofit-admin)

Service Model

* serviceId (UUID)  
* name (String)  
* description (Text)  
* category (Enum)  
* location (Geolocation)  
* hours (JSON or Array)  
* ownerId (Foreign key to User)

Recommendation Model

* recommendationId (UUID)  
* userId (Foreign key to User)  
* serviceId (Foreign key to Service)  
* score (Float)  
* biasMetadata (JSON with fairness annotations)

Donation Model

* donationId (UUID)  
* userId (Foreign key to User)  
* organizationId (Foreign key to User)  
* amount (Float)  
* timestamp (Datetime)

VolunteerSignup Model

* signupId (UUID)  
* userId (Foreign key to User)  
* eventId (Foreign key to Event)  
* status (Enum: confirmed, pending, canceled)

**Backend Development Steps**

1. Set up Express app with TypeScript and Docker support.  
2. Initialize MongoDB connection using Mongoose and configure schemas.  
3. Define models for users, services, donations, recommendations, and signups.  
4. Set up JWT-based authentication and role-based authorization middleware.  
5. Implement geospatial service search using APIs  
6. Build routes for user, service, donation, and volunteer CRUD operations.  
7. Integrate FastAPI ML microservice for service recommendations with fairness metadata.  
8. Add Stripe or PayPal donation flow with webhook event handling.  
9. Integrate Google Calendar API for volunteer scheduling.  
10. Add Redis for caching common geolocation/recommendation queries.  
11. Write tests using Jest and Supertest for API endpoints.

**Frontend Development Steps**

1. Set up a React \+ Tailwind project.  
2. Create project folder structure with pages, components, services, hooks.  
3. Design and implement:  
   * Home page with search bar and featured services.  
   * Map-based results view (e.g. Google Maps API).  
   * Service detail page with calendar view and contact info.  
   * Auth pages (signup/login).  
   * Profile and dashboard pages (different for nonprofits and residents).  
4. Create reusable API service and context-based state management (e.g. Zustand or Context API).  
5. Integrate donation and volunteer flow using modal-based UX.  
6. Add micro-feedback (loading, success messages, animations).  
7. Configure offline mode, caching, and installability (PWA requirements).

**Special Considerations**

* Security: Secure JWT tokens, HTTPS for all endpoints, Stripe webhooks with signature validation.  
* Performance: Redis caching, lazy loading of map markers, paginated results.  
* Accessibility: Fully WCAG 2.1 compliant; screen reader support and semantic markup.  
* Mobile-First: Design components and layouts for small screens first.  
* Testing: Unit \+ integration tests for frontend (Jest), backend (Jest \+ Supertest), and ML microservices (Pytest).  
* Deployment Workflow: CI/CD with GitHub Actions, Docker containers deployed to AWS Fargate, environment secrets managed via AWS Secrets Manager.

**API Keys and Configuration**

* `MONGODB_URI`: MongoDB connection string  
* `REDIS_URL`: Redis cache endpoint  
* `JWT_SECRET`: JWT signing key  
* `STRIPE_SECRET_KEY` / `PAYPAL_SECRET`: Payment processing  
* `GOOGLE_CALENDAR_API_KEY`: Calendar embed and integration  
* `ML_API_URL`: FastAPI ML microservice URL  
* `SENTRY_DSN`: Error tracking configuration