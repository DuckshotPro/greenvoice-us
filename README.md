
# InvoiceFlow Application

InvoiceFlow is a comprehensive platform for creating, sharing, and tracking professional invoices. This document guides you through setting up and running the application.

## Features

- Easy invoice creation with professional templates
- PDF generation and sharing options
- Analytics dashboard to track invoice performance
- Premium features including additional templates and tools

## Prerequisites

- Node.js (>=20)
- PostgreSQL (>=16)

## Local Development

Ensure you have Node.js and PostgreSQL installed. Clone the repository and run:

\`\`\`bash
npm install
npm run dev
\`\`\`

This will start the application on port 5000.

## Scripts

- **dev**: Starts the development server using Vite.
- **build**: Bundles the application for production.

## Deployment

The application is configured to deploy on Replit. Ensure all environment variables are set appropriately in the `.env` file, and use the deployment configuration defined in the workspace.

## Setup Environment Variables

Use the Secrets tool on Replit to store sensitive data like API keys.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

