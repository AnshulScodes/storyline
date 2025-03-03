# PDF Export Feature

This document provides information about the PDF export feature implemented in the Storyline application.

## Overview

The PDF export feature allows users to generate and download PDF reports based on the data in the application. The reports include user personas, user stories, churn metrics, and insights. All data is processed client-side, and no data is sent to any server during the PDF generation process.

## Available Export Options

The PDF export feature provides the following export options:

1. **Complete Report**: Generates a comprehensive report that includes all data - user personas, user stories, churn metrics, and insights.
2. **Personas Report**: Generates a report focused on user personas and their associated user stories.
3. **Insights Report**: Generates a report focused on churn metrics and actionable insights.
4. **Individual Persona Reports**: Generates detailed reports for specific personas, including their pain points, goals, associated user stories, and actual users.

## Enhanced User Data Integration

The PDF export feature now includes actual user data associated with each persona:

1. **Actual Users in Personas**: Each persona now includes a list of actual users from the uploaded data that match the persona's segment.
2. **User-Driven Stories**: User stories now reference actual users from the data, making them more concrete and actionable.
3. **User Metrics**: Reports include metrics about the number of users in each persona and their churn risk levels.

This enhancement creates a direct connection between your uploaded user data and the generated personas and stories, making the reports more relevant and actionable.

## How to Use

1. Navigate to any of the main pages (Dashboard, User Stories, or Insights).
2. Look for the "Export PDF" button in the top-right section of the page.
3. Click on the button to open the dropdown menu with export options.
4. Select the desired export option.
5. The PDF will be generated and automatically downloaded to your device.

## Technical Implementation

The PDF export feature is implemented using the following technologies:

- **jsPDF**: A JavaScript library for generating PDFs in the browser.
- **jspdf-autotable**: A plugin for jsPDF that provides table generation capabilities.

All PDF generation is performed entirely in the browser, ensuring that no data leaves the user's device. The generated PDFs include formatted tables, styled text, and proper page breaks for readability.

## Customization

The generated PDFs include the following customizations:

- Branded headers with the application name and report title
- Formatted tables with appropriate column widths
- Styled text with different font sizes and colors
- Page numbers on each page
- A disclaimer footer
- User data tables for each persona
- Enhanced user stories with references to actual users

## Troubleshooting

If you encounter any issues with the PDF export feature:

1. Ensure you have uploaded data and generated insights first.
2. Check that your browser is up-to-date.
3. If the PDF doesn't download automatically, check your browser's download settings.
4. For large datasets, the PDF generation might take a few seconds. Please be patient.

## Privacy

The PDF export feature processes all data locally in your browser. No data is sent to any server during the PDF generation process, ensuring your data remains private and secure. 