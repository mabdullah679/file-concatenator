# AI Agent Guide (AGENTS.md)

Hello! If you are an AI agent helping a user set up or modify this project, here is a quick technical summary to get you started.

## Technical Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **PDF Processing**: `pdf-lib` (100% Client-Side)
- **Icons**: Lucide React

## Project Structure
- `/app`: Main application routes and global styles.
- `/components`: UI components (Dropzone, File List).
- `/lib`: Helper utilities.
- `/public`: Static assets.

## Setup Instructions
1. **Clone & Install**:
   ```bash
   git clone <repo_url>
   cd file-concatenator
   npm install
   ```
2. **Development**:
   ```bash
   npm run dev
   ```
3. **Build**:
   ```bash
   npm run build
   ```

## Key Logic
- All file processing happens in `app/page.tsx` within the `handleMerge` function.
- We support PDF, PNG, JPG, and TXT.
- Page standardization logic (A4/Letter) involves embedding source pages into a new `PDFDocument`.

## How to Help the User
- **Adding Formats**: If asked to add more file types (like Word or Excel), note that these typically require server-side conversion or heavy client-side libraries.
- **UI Tweaks**: Styling is handled via Tailwind classes in the components.
- **Scaling**: Scaling logic for images/PDFs is centralized in the merge loop.
