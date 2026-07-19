# Phase 6 & 7 Architecture: Employees and Products Modules

## Phase 6: Employee Module Architecture

### Overview
The Employee module focuses on displaying the workforce. Following the SRS, it should not focus on attendance or tasks, but rather on skills, projects, and research contributions. For this phase, we will implement the list view.

### Components
- **`src/pages/Employees.tsx`**: A table or grid view of employees. We will implement a list view featuring the employee's name, designation, department, skills, and current project count.
- **Data Fetching (Future)**: Will use `useQuery` to fetch from the `users` collection.
- **UI Design**: Clean Apple-like list with avatars, subtle hover effects, and rounded edges.

### Edge Cases
- **Empty States**: If no employees are registered (e.g., in a new tenant), an empty state graphic and "Invite User" button should appear.
- **Role Visibility**: Scientists should see basic info of colleagues, but only Management/Admins should see performance metrics or edit roles.

---

## Phase 7: Products Module Architecture

### Overview
The core of the R&D tracking. Products have many stages (Idea -> Commercial Launch).

### Components
- **`src/pages/Products.tsx`**: A grid of product cards. Each card displays the product name, category, current stage (using a color-coded badge), assigned team members, and a progress bar or indicator.
- **Data Fetching (Future)**: Will use `useQuery` to fetch from the `products` collection.

### Edge Cases
- **Long Stage Names**: The UI must handle long stage names (e.g., "Commercial Validation") gracefully using truncation or wrapping.
- **Delayed/Blocked Status**: Products that are blocked need a prominent warning UI to grab management's attention within the "2 minutes" SLA mentioned in the prompt.