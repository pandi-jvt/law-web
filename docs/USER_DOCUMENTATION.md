# User Documentation

Complete guide for end users of the current Case Management application.

## Getting Started

Open the application in a browser. For local development, use `http://localhost:3005`. The frontend talks to the backend API at `http://localhost:9000`.

Log in with your username and password. The application uses secure token-based authentication and will redirect you to login if your session expires.

## Account Types

### Individual

Individual accounts are for solo users. An individual user can manage only their own clients, cases, and documents.

Individual users can:

- Create and view their own clients.
- Create and view their own cases.
- Upload and delete documents on their own cases.
- Change their own password.

### Group / Law Firm

Group accounts are for law firms and teams. A group has one `GROUP_ADMIN` and team members assigned to clients and cases.

Group roles:

- `GROUP_ADMIN`: full access inside the law firm; manages users and assignments.
- `LAWYER`: accesses assigned clients/cases; can upload and delete documents on assigned cases.
- `JUNIOR`: accesses assigned clients/cases; can upload documents on assigned cases.
- `CLERK`: accesses assigned clients/cases and documents; read-oriented role with no upload/delete document permission.

## Access Rules

The backend enforces all access rules. Hidden UI buttons are only a convenience.

- Individual users see only records they created.
- Group admins see all clients, cases, documents, and members in their law firm.
- Lawyers, juniors, and clerks see only assigned clients and cases.
- Only group admins assign users to clients and cases.
- Documents are visible only when the user can view the related case.
- Upload is allowed for individual users, group admins, lawyers, and juniors.
- Delete is allowed for individual users, group admins, and lawyers.

## Login and Registration

Registration collects email, username, full name, password, and optionally phone number. Login uses username and password.

Password reset depends on the backend reset configuration. If SMS/email providers are not configured, contact an administrator.

## Cases

The active Cases page lists only cases returned by the backend for the logged-in user. Create and delete actions appear only when the current user has the matching permission.

## Clients

Client access follows the account and assignment model. Individual users see their own clients. Group admins see all firm clients. Other group users see assigned clients.

## Documents

Documents belong to cases. Allowed upload file types are PDF, DOC, and DOCX. File size is controlled by backend configuration and defaults to 10 MB.

## Troubleshooting

- Missing data: confirm you are assigned to the client or case.
- Unauthorized action: your role does not permit that operation.
- Upload failed: check file type and size.
- Cannot connect locally: confirm backend `http://localhost:9000` is running and CORS allows the frontend origin.
