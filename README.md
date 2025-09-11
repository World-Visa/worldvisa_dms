# WorldVisa DMS

A modern Document Management System built with Next.js 15, TypeScript, and a comprehensive technology stack.

## 🚀 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **Server State**: Tanstack Query
- **Caching**: Redis
- **Error Tracking**: Sentry
- **URL Management**: Query String
- **Animations**: GSAP
- **Linting**: ESLint

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Redis server (for caching)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worldvisa_dms
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update the following variables in `.env.local`:
   ```env
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Sentry Configuration (optional)
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   
   # Next.js Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start Redis server** (if not already running)
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install Redis locally
   # Windows: Download from https://github.com/microsoftarchive/redis/releases
   # macOS: brew install redis && brew services start redis
   # Linux: sudo apt-get install redis-server
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page with demos
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility libraries
│   ├── providers.tsx     # Tanstack Query provider
│   ├── redis.ts          # Redis client and utilities
│   ├── store.ts          # Zustand store
│   ├── query-string.ts   # Query string utilities
│   ├── gsap.ts           # GSAP animation utilities
│   └── utils.ts          # General utilities
```

## 🎯 Features

### ✅ Implemented
- **Next.js 15** with App Router and TypeScript
- **TailwindCSS** for styling
- **Shadcn UI** components
- **Zustand** for client-side state management
- **Tanstack Query** for server state management
- **Redis** integration for caching
- **Sentry** for error tracking
- **Query String** utilities
- **GSAP** for animations
- **ESLint** for code quality

### 🔧 Configuration Files
- `next.config.ts` - Next.js configuration with Sentry
- `tailwind.config.ts` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `components.json` - Shadcn UI configuration

## 🎨 UI Components

The project includes pre-configured Shadcn UI components:
- Button
- Card
- Input
- Label
- Form

To add more components:
```bash
npx shadcn@latest add [component-name]
```

## 📊 State Management

### Zustand Store
- User authentication state
- Theme management
- UI state (sidebar, loading)
- Persistent storage for user and theme

### Tanstack Query
- Server state management
- Automatic caching and refetching
- Loading and error states
- DevTools integration

## 🗄️ Redis Integration

Redis utilities for:
- Caching API responses
- Session storage
- Real-time features
- Performance optimization

## 🎭 Animations

GSAP utilities for:
- Fade in/out animations
- Slide animations
- Scale animations
- Scroll-triggered animations
- Text typing effects
- Stagger animations

## 🐛 Error Tracking

Sentry integration for:
- Client-side error tracking
- Server-side monitoring
- Performance monitoring
- Session replay

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ using Next.js 15 and modern web technologies.