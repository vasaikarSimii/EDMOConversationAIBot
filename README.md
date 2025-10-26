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

## Acceptable Questions

You can ask the AI assistant any of the following:
- Who's missing financial documents?
- List applicants missing documents.
- Show priority applicants.
- List students with upcoming deadlines.
- Show students under review.
- Show students who are accepted.
- Show students who are rejected.
- List waitlisted students.
- Draft reminder emails for students missing documents.
- Mark student application as reviewed.
- What is the status of student [student name]?
- How many emails have been sent so far?
- Give me a Monday morning briefing of urgent applicants.

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn package manager

### Installation

1. Clone this repo or copy the code into your React project.
2. Place the `collection_field_name_description.xlsx` Excel file inside the `public` folder (`edmo-agent/public`).
3. Ensure your main component is `App.js` inside `src/` with the provided code.

### Running the App

