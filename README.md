# Plugin Hub

A platform for discovering, deploying, and customizing plugin services.

## Project Structure

- `landingpage/` - Main landing page (port 3000)
- `upload_component/` - Plugin upload interface (port 3001)
- `plugindetailui/` - Plugin detail pages (port 3002)

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
# Start landing page
npm run dev:landing

# Start upload component
npm run dev:upload

# Start plugin detail UI
npm run dev:detail
```

## Deployment

### GitHub Setup

1. Create a new repository on GitHub
2. Initialize git and push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Vercel Deployment

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: landingpage
   - Build Command: npm run build
   - Output Directory: .next

4. Add environment variables if needed
5. Deploy

The landing page will be the default page when visiting your domain. The upload component and plugin detail pages will be accessible through their respective routes.

## Environment Variables

Create a `.env` file in each project directory with necessary environment variables. 