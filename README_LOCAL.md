# Frontend Local Setup (Port 3005)

## Quick Start

The frontend is configured to run on **port 3005** and connect to backend on **port 9000**.

### Start Development Server

```bash
npm install  # First time only
npm run dev
```

The application will be available at: **http://localhost:3005**

## Configuration

### Port Configuration

The port is configured in `vite.config.ts`:
```typescript
server: {
  port: 3005,
  proxy: {
    '/api': {
      target: 'http://localhost:9000',
      changeOrigin: true,
    },
  },
}
```

### Environment Variables

Create `.env.local` file (or `.env`):
```env
VITE_API_BASE_URL=http://localhost:9000
```

This tells the frontend where to find the backend API.

## Development

- Hot reload is enabled by default
- Changes to files will automatically refresh the browser
- API calls are proxied through Vite to avoid CORS issues

## Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## Troubleshooting

### Port 3005 Already in Use

Vite will automatically try the next available port (3006, 3007, etc.) or you can specify:

```bash
npm run dev -- --port 3006
```

### Cannot Connect to Backend

1. Verify backend is running on port 9000
2. Check `.env.local` has: `VITE_API_BASE_URL=http://localhost:9000`
3. Check browser console for errors
4. Verify CORS is configured in backend to allow `http://localhost:3005`
