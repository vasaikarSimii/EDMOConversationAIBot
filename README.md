# EDMO Agentforce AI Admissions Counselor

An intelligent AI assistant for university admissions counselors that reads applicant data from an Excel file, answers natural language queries, tracks document submission statuses, ranks priority applicants by urgency, drafts personalized reminder emails, and allows updating application statuses.

## Features

- Loads applicant data from `collection_field_name_description.xlsx` (Excel format), reading core applicant info such as full name, email, application status, missing documents, and deadlines.
- Supports natural language queries about:
  - Missing documents (e.g., "Who’s missing financial documents?")
  - Priority applicant listing by urgency and deadlines
  - Application status filtering (e.g., listing applicants "Under Review", "Accepted", "Rejected", etc.)
  - Drafting personalized reminder emails for missing documents with deadline information
- Provides a user-friendly chat-based interface and side panel showing priority applicants and email drafts.
- Supports application status updates, mimicking counselor actions in the admissions pipeline.
- React-based front-end with Excel data fetching and dynamic UI updates.

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn package manager

### Installation

1. Clone this repo or copy the code into your React project.
2. Place the `collection_field_name_description.xlsx` Excel file inside the `public` folder (`edmo-agent/public`).
3. Ensure your main component is `App.js` inside `src/` with the provided code.

### Running the App
npm install
npm start 


The app will fetch applicant data from the Excel file, process it, and be ready to answer questions and assist counselors in admissions workflows.

## Usage

- Ask questions like:
  - "Who's missing financial documents?"
  - "List priority applicants."
  - "Show students under review."
  - "Draft reminder emails."
- Select a student from the priority list to draft or edit an email.
- Approve and simulate sending emails.
- The app tracks emails sent count and dynamically updates lists.

## Custom Actions

The app includes simulated core actions inspired by Salesforce invocable methods:

- **Find Priority Applicants:** Ranks applicants by urgency and deadline for counselor focus.
- **Draft Personalized Email:** Generates email drafts tailored to the student’s missing documents and deadlines.
- **Update Application Status:** Simulates marking documents reviewed and updating the student's application pipeline stage.

## File Structure

- `public/collection_field_name_description.xlsx` - Excel file with applicant data.
- `src/App.js` - Main React component implementing the AI assistant logic and UI.

## Technologies Used

- React.js for front-end UI
- lucide-react for icons
- xlsx library to parse Excel files in browser
- Modern JavaScript (ES6+)

## Limitations

- The app runs fully in the browser; no backend integration or persistent database.
- Excel file format must match expected schema.
- Application status update is local simulation only.

## Future Improvements

- Add backend integration to fetch live CRM data.
- Add user authentication and role management.
- Add email sending through SMTP or 3rd party API.
- Improve NLP understanding with advanced models.

