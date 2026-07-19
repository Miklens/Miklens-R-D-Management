# Software Requirements Specification (SRS)
## Enterprise AI Powered Research & Development Management Platform for Miklens Bio Pvt Ltd.

### 1. Introduction
This document outlines the Software Requirements Specification for the Enterprise AI-Powered Research & Development Management Platform for Miklens Bio Pvt Ltd. This platform is NOT an HR system, attendance system, or task management system. It is a comprehensive R&D Intelligence Platform designed to track employees, products, research, experiments, trials, documents, reports, innovation, progress, and AI insights through an Executive Dashboard. The goal is to provide a premium, interconnected experience akin to platforms built by Microsoft, Google, Apple, Atlassian, and Notion.

### 2. Primary Goals
- **Management Visibility:** Management must be able to understand what every employee is doing, product status, existing problems, progress, and changes over time (daily, weekly, monthly, yearly), and identify what requires attention—all within 2 minutes.
- **Employee Efficiency:** Employees should spend less than 5 minutes daily updating their work.
- **Automation:** All other processes should be automated using AI.
- **Performance Philosophy:** Employee performance is NOT calculated using attendance or task counts. It measures research effort, knowledge creation, problem solving, innovation, experiment quality, documentation, contribution, and product maturity. Scientific failures are treated as valuable learning opportunities that increase knowledge rather than reduce performance.

### 3. Application Modules
- Dashboard
- Employee Management & Profile
- Research Log
- Products, Projects, Experiments & Trials (Field & Laboratory)
- Observations
- Task Management & Milestones
- Documents, Images, Videos, Research Papers, Protocols
- Approvals & Notifications
- Calendar
- Reports & Analytics
- AI Insights
- Settings & Audit Logs

### 4. User Roles & Permissions
- **Admin:** Full access to all modules, settings, user management, and audit logs.
- **Management:** Access to executive dashboards, reports, analytics, AI insights, and all read/approve workflows.
- **Scientist:** Access to their research logs, assigned projects/products, experiments, trials, and personal dashboard/profile. Permissions are strictly role-based.

### 5. Workflows
#### 5.1 Employee Workflow
- Employees complete a **Daily Research Log** instead of long reports (max 3-5 minutes).
- **Log Components:** Date, Product, Experiment, Today's Objective, Activities Performed, Observations, Problems, Achievements, Next Steps, Time Spent, Attachments (Images/Documents), Completion Status, Estimated Product Stage, Confidence Level, and AI Notes.

#### 5.2 Product Workflow
- **Product Attributes:** Name, Category, Description, Target Market, Current Stage, Assigned Team, Timeline, Budget, Research/Experiment History, Documents, Photos, Approvals, Risks, Dependencies, AI Summary.
- **Stages:** Idea -> Literature Review -> Research -> Raw Material Selection -> Prototype -> Formulation -> Optimization -> Lab Testing -> Shelf Life -> Greenhouse Trial -> Field Trial -> Commercial Validation -> Packaging -> Registration -> Production Ready -> Commercial Launch -> Completed.
- **Progress Calculation:** Automatically calculated from completed milestones (never manually entered).

#### 5.3 Experiment System
- Every experiment belongs to a product.
- **Experiment Attributes:** Number, Version, Objective, Hypothesis, Materials, Procedure, Observations, Results (Success, Failure, Partial Success), Root Cause, Next Action, Photos, Documents, Lab Readings, AI Analysis.
- Multiple failed experiments contribute to product knowledge, not negative performance.

### 6. AI Engine Requirements
- Automatically analyze daily logs to generate Daily, Weekly, Monthly, Quarterly, and Yearly Summaries.
- **Understanding Capabilities:** Progress, Delays, Risks, Repeated Failures, Success Patterns, Product Maturity, Employee Workload, Knowledge Growth, and Innovation.
- **Recommendations:** Predict expected completion, suggest next experiments, detect bottlenecks/repeated failures, and recommend management actions.

### 7. Executive Dashboard & Employee Profile
- **Executive Dashboard:** Instant view of Total Employees, Active Today, Active/Completed/Delayed/Blocked Products, Critical Risks, Upcoming Deadlines, Experiments Completed, Success/Failure Rates, Innovation Index, Average Product Maturity, Department Performance, Research Productivity, Overall Progress, Top Contributors, Products Needing Attention, Recent Achievements, and Budget/Resource Utilization. All KPIs must be clickable.
- **Employee Profile:** Designation, Skills, Experience, Projects/Products, Research Areas, Timeline, Achievements, Current Work, Logs, Performance Graph, Experiment History, Documents, and AI Summary.

### 8. Analytics & Reports
- **Analytics:** Daily to Yearly data using Line, Area, Pie, Bar, Radar, Heatmap, Trend, Timeline, and Comparison charts. Comparisons for Departments, Employees, Products, and Research.
- **Reports:** Generate Employee, Product, Experiment, Weekly/Monthly/Quarterly/Annual, Executive, Department, and Research reports. Exportable to PDF, Excel, Word, and Print.

### 9. Non-Functional Requirements
- **UI Design:** Modern Apple-inspired design, premium animations, glassmorphism, rounded cards, professional typography, responsive, fast, accessible, Dark/Light Mode. Dashboard styling akin to Power BI, Notion, Linear, and Jira.
- **Security:** Firebase Authentication, Firestore Security Rules, Audit Logs, Version History, File Security, Activity Tracking.
- **Tech Stack Constraints:** React 19, Vite, TailwindCSS, Firebase (Auth, Firestore, Storage, Functions), React Router, React Query, Framer Motion, Recharts, React Hook Form, Zod, Material Symbols, PWA, Offline Support, Realtime Sync.
