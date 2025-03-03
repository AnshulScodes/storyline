# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/dc5b54a2-1ebb-4dab-8551-2aef3343c9ce

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/dc5b54a2-1ebb-4dab-8551-2aef3343c9ce) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- jsPDF (for PDF generation)
- jspdf-autotable (for table generation in PDFs)

## Features

### PDF Export
The application includes a comprehensive PDF export feature that allows users to generate and download various types of reports:
- Complete Report (all data)
- Personas Report (personas and stories)
- Insights Report (metrics and insights)
- Individual Persona Reports (detailed reports for specific personas)

All PDF generation occurs in the browser, ensuring user data privacy and security. For more details, see [PDF_EXPORT_README.md](PDF_EXPORT_README.md).

### Data-Driven User Personas
The application creates user personas that are directly connected to your actual user data:
- Each persona is associated with real users from your uploaded data
- User stories reference actual users, making them more concrete and actionable
- Reports include metrics about users in each persona and their churn risk levels
- This creates a direct connection between your data and the generated insights

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/dc5b54a2-1ebb-4dab-8551-2aef3343c9ce) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
