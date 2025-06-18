# Netlify Image Upload Service

A serverless image upload service built with Next.js and Netlify Functions.

## Features

- 🖼️ **Image Upload**: Upload images through a modern web interface
- ⚡ **Serverless**: Powered by Netlify Functions for scalable processing
- 🔒 **Validation**: File type and size validation
- 📱 **Responsive**: Mobile-friendly interface
- 🎨 **Modern UI**: Built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Netlify Functions
- **Runtime**: Bun

## Local Development

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Run the development server**:
   ```bash
   bun run dev
   ```

3. **Run with Netlify Functions** (recommended for testing uploads):
   ```bash
   bun run netlify:dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Frontend (`src/app/page.tsx`)
- File selection with validation (image types only, max 5MB)
- Image preview functionality
- Upload progress indication
- Result display with upload details

### Backend (`netlify/functions/upload-image.ts`)
- Accepts base64 encoded images via POST request
- Validates image data format
- Generates unique file IDs
- Returns upload confirmation with metadata

### Current Implementation
This is a **demo implementation** that:
- Accepts base64 encoded images
- Validates file format and size
- Generates unique file identifiers
- Simulates upload processing
- Returns mock upload URLs

### Production Enhancements
For production use, you would typically:
- Integrate with cloud storage (AWS S3, Cloudinary, etc.)
- Add authentication and authorization
- Implement proper file validation and sanitization
- Add rate limiting and abuse protection
- Store file metadata in a database
- Implement file deletion and management

## API Endpoint

### POST `/.netlify/functions/upload-image`

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "filename": "example.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "fileId": "a1b2c3d4e5f6...",
  "filename": "a1b2c3d4e5f6.jpg",
  "originalName": "example.jpg",
  "size": 1234567,
  "url": "https://your-cdn.com/uploads/a1b2c3d4e5f6.jpg",
  "uploadedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Upload failed",
  "error": "Invalid image data format"
}
```

## File Structure

```
├── netlify/
│   └── functions/
│       └── upload-image.ts     # Serverless upload function
├── src/
│   └── app/
│       ├── page.tsx           # Main upload interface
│       ├── layout.tsx         # App layout
│       └── globals.css        # Global styles
├── netlify.toml               # Netlify configuration
└── package.json
```

## Configuration

The `netlify.toml` file configures:
- Build command: `bun run build`
- Functions directory: `netlify/functions`
- Publish directory: `.next`

## Upload Guidelines

- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum file size**: 5MB
- **Processing**: Serverless via Netlify Functions
- **Storage**: Currently simulated (integrate cloud storage for production)

## Deployment

1. **Connect to Netlify**:
   - Push to your Git repository
   - Connect the repository to Netlify
   - Netlify will automatically detect the configuration

2. **Environment Variables** (if needed for production):
   - Add any required API keys or configuration to Netlify's environment variables

3. **Deploy**:
   - Netlify will automatically build and deploy your site
   - Functions will be deployed to `/.netlify/functions/`

## License

MIT License
