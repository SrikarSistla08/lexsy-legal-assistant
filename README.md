# Lexsy Legal Document Assistant

An AI-powered web application that automates the process of filling legal document templates through an intelligent conversational interface.

## 🎯 Overview

This application streamlines legal document completion by automatically detecting placeholders in uploaded `.docx` files and guiding users through a conversational experience to fill them in. Built for Lexsy's full-stack engineering assignment.

## ✨ Features

- **📄 Document Upload**: Accepts `.docx` legal document templates
- **🔍 Smart Placeholder Detection**: Automatically identifies placeholders in multiple formats:
  - `[Company Name]`, `{VARIABLE}`, `<<PLACEHOLDER>>`, `_______`
- **💬 Conversational Interface**: Intuitive step-by-step prompts to fill each placeholder
- **📊 Progress Tracking**: Visual progress bar showing completion status
- **✅ Live Preview**: Real-time preview of the completed document
- **⬇️ Document Export**: Download the filled document as `.docx`
- **➕ Manual Placeholders**: Option to add custom placeholders if needed

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Document Parsing**: Mammoth.js (DOCX text extraction)
- **Document Generation**: docx.js + FileSaver.js
- **Styling**: Inline styles (component-scoped)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd lexsy-legal-assistant

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 How to Use

1. **Upload Document**: Click "Choose File" and select a `.docx` legal template
2. **Review Placeholders**: The app automatically detects all placeholders in your document
3. **Fill Values**: Answer the conversational prompts to provide values for each placeholder
4. **Download**: Review the completed document and download it as `.docx`

## 🎨 Design Features

- **Professional Legal Theme**: Navy and teal color palette conveying trust and authority
- **Responsive Layout**: Full-width design optimized for all screen sizes
- **Modern UI**: Card-based layout with smooth animations and hover effects
- **Accessible**: Clear labels, high contrast, and keyboard navigation support

## 📁 Project Structure

```
lexsy-legal-assistant/
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

## 🔧 Key Implementation Details

### Placeholder Detection Algorithm

The app uses regex patterns to detect various placeholder formats commonly found in legal documents:

- **Square brackets**: `[Company Name]`, `[Date]`
- **Curly braces**: `{VAR}`, `{{VARIABLE}}`
- **Angle brackets**: `<PLACEHOLDER>`, `<<VALUE>>`
- **Underscores**: `_______` (5+ consecutive underscores)

### Document Processing Flow

1. User uploads `.docx` file
2. Mammoth.js extracts raw text content
3. Custom regex patterns scan for placeholders
4. Deduplicated placeholders stored with original formatting
5. User fills values through conversational UI
6. Values replace placeholders in document text
7. docx.js generates new `.docx` with filled content

## 🎯 Assignment Requirements

✅ Accept upload of legal document draft (.docx)  
✅ Identify and distinguish template text vs. dynamic placeholders  
✅ Enable conversational experience to fill placeholders  
✅ Display completed document  
✅ Provide download option  

## 🚀 Deployment

This app is deployed on Vercel and accessible at: [Your Vercel URL]

## 👨‍💻 Developer

**[Your Name]**

Built as part of the Lexsy Full-Stack Engineer application.

## 📝 License

This project was created for the Lexsy hiring process.
