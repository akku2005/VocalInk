# VocalInk Frontend - Cursor AI Development Instructions

## 📋 Project Overview

Create a sophisticated AI-powered blogging platform called VocalInk with React 18, Vite, and Tailwind CSS. The application features Text-to-Speech, Speech-to-Text, content management, gamification, and social features with black and white theme support.

## 🚀 Initial Setup

### Step 1: Project Initialization
```bash
npm create vite@latest vocalink-frontend -- --template react
cd vocalink-frontend
npm install
```

### Step 2: Install Dependencies
```bash
# Core Dependencies
npm install react-router-dom axios react-query @tanstack/react-query
npm install react-hook-form @hookform/resolvers yup
npm install lucide-react react-hot-toast
npm install @headlessui/react framer-motion
npm install date-fns uuid
npm install socket.io-client
npm install react-markdown remark-gfm
npm install @tiptap/react @tiptap/starter-kit
npm install recharts

# Development Dependencies  
npm install -D @types/uuid eslint prettier
```

### Step 3: Tailwind CSS Setup (Exact Steps)
```bash
npm install tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Replace content in `src/index.css`:
```css
@import "tailwindcss";

/* Custom CSS Variables for Themes */
:root {
  /* White Theme Colors */
  --color-primary: 59 130 246;
  --color-secondary: 100 116 139;
  --color-accent: 245 158 11;
  --color-background: 255 255 255;
  --color-surface: 248 250 252;
  --color-text-primary: 15 23 42;
  --color-text-secondary: 100 116 139;
  --color-border: 226 232 240;
  --color-success: 16 185 129;
  --color-warning: 245 158 11;
  --color-error: 239 68 68;
}

[data-theme="dark"] {
  /* Black Theme Colors */
  --color-primary: 96 165 250;
  --color-secondary: 148 163 184;
  --color-accent: 251 191 36;
  --color-background: 15 23 42;
  --color-surface: 30 41 59;
  --color-text-primary: 248 250 252;
  --color-text-secondary: 148 163 184;
  --color-border: 51 65 85;
  --color-success: 34 197 94;
  --color-warning: 251 191 36;
  --color-error: 248 113 113;
}

/* Custom Classes */
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(239 246 255)',
          500: 'rgb(var(--color-primary))',
          900: 'rgb(30 58 138)',
        },
        secondary: {
          50: 'rgb(248 250 252)',
          500: 'rgb(var(--color-secondary))',
          900: 'rgb(15 23 42)',
        },
        accent: {
          50: 'rgb(254 243 199)',
          500: 'rgb(var(--color-accent))',
          900: 'rgb(120 53 15)',
        },
        background: 'rgb(var(--color-background))',
        surface: 'rgb(var(--color-surface))',
        'text-primary': 'rgb(var(--color-text-primary))',
        'text-secondary': 'rgb(var(--color-text-secondary))',
        border: 'rgb(var(--color-border))',
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}
```

## 🏗️ Project Structure

Create the following folder structure:
```
src/
├── components/
│   ├── auth/
│   ├── blog/
│   ├── series/
│   ├── ai/
│   ├── gamification/
│   ├── social/
│   ├── layout/
│   ├── ui/
│   └── skeletons/
├── pages/
├── hooks/
├── context/
├── services/
├── utils/
├── types/
└── assets/
```

## 🎨 Core Components to Create

### 1. Theme Provider (src/context/ThemeContext.jsx)
```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 2. Layout Components

#### Main Layout (src/components/layout/Layout.jsx)
```jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary theme-transition">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
        />
        <main className="flex-1 lg:ml-64 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

#### Header Component (src/components/layout/Header.jsx)
```jsx
import { Menu, Search, Bell, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-surface transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-primary-500">VocalInk</h1>
          </div>

          {/* Center Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search blogs, series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent theme-transition"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-surface transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            
            <button className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-surface transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
            </button>

            <button className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-surface transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### 3. UI Components

#### Button Component (src/components/ui/Button.jsx)
```jsx
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900 focus:ring-secondary-500',
    ghost: 'hover:bg-primary-50 dark:hover:bg-surface text-text-primary focus:ring-primary-500',
    danger: 'bg-error hover:bg-red-600 text-white focus:ring-error',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
```

#### Card Component (src/components/ui/Card.jsx)
```jsx
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-surface shadow-sm theme-transition",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
```

### 4. Page Components

#### Home Page (src/pages/Home.jsx)
```jsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TrendingUp, Users, BookOpen, Zap } from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState({
    totalBlogs: 1250,
    totalUsers: 850,
    totalSeries: 120,
    aiGenerations: 3400
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-4">
          Welcome to <span className="text-primary-500">VocalInk</span>
        </h1>
        <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
          Create, discover, and experience content like never before with AI-powered blogging, 
          text-to-speech, and gamified social features.
        </p>
        <div className="space-x-4">
          <Button size="lg">Get Started</Button>
          <Button variant="ghost" size="lg">Learn More</Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <BookOpen className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">{stats.totalBlogs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">{stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Series Created</CardTitle>
            <TrendingUp className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">{stats.totalSeries.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Zap className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">{stats.aiGenerations.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Content */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Featured Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Sample Blog Post {item}</CardTitle>
                <p className="text-sm text-text-secondary">
                  Discover the future of content creation with AI-powered features...
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>5 min read</span>
                  <span>2 days ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
```

## 🛠️ Development Instructions for Cursor AI

### Phase 1: Foundation (Priority 1)
1. **Set up project structure** as outlined above
2. **Create Theme Provider** with proper dark/light theme switching
3. **Build Layout components** (Header, Sidebar, Layout)
4. **Create UI component library** (Button, Card, Input, etc.)
5. **Set up routing** with React Router DOM
6. **Create Home page** with stats and featured content

### Phase 2: Authentication (Priority 2)
1. **Create auth context** for user management
2. **Build Login/Register forms** with validation
3. **Implement JWT token handling**
4. **Add protected routes**
5. **Create user profile components**
6. **Add logout functionality**

### Phase 3: Core Features (Priority 3)
1. **Blog management system**:
   - Rich text editor with Tiptap
   - Blog listing and viewing
   - CRUD operations
   - Draft/publish workflow

2. **AI Features**:
   - TTS interface component
   - STT transcription component
   - Content analysis dashboard
   - AI summary generation

3. **Series Management**:
   - Series creation forms
   - Episode management
   - Progress tracking
   - Collaboration features

### Phase 4: Social Features (Priority 4)
1. **User interactions**:
   - Follow/unfollow system
   - Like and bookmark functionality
   - Comment system with replies
   - User profiles

2. **Gamification**:
   - XP display components
   - Badge showcase
   - Leaderboards
   - Achievement tracking

### Phase 5: Advanced Features (Priority 5)
1. **Content discovery**:
   - Search functionality
   - Recommendation engine
   - Trending content
   - Advanced filtering

2. **Analytics dashboard**:
   - Content performance metrics
   - User engagement data
   - Reading time tracking
   - Revenue analytics

## 🎨 Theme Implementation Guidelines

### Color Usage
- Use CSS custom properties for theming
- Apply `theme-transition` class for smooth theme switching
- Use semantic color names (background, surface, text-primary, etc.)

### Component Styling
- Always use Tailwind's responsive prefixes (sm:, md:, lg:, xl:)
- Implement hover states for interactive elements
- Use focus states for accessibility
- Apply proper contrast ratios for both themes

### Dark Theme Considerations
- Ensure sufficient contrast for text readability
- Use elevated surfaces (cards, modals) with proper shadows
- Test all interactive states in both themes
- Consider color-blind users with proper color choices

## 📱 Responsive Design Requirements
- Mobile-first approach
- Breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px)
- Collapsible sidebar on mobile
- Optimized touch targets (min 44px)
- Readable font sizes across devices

## 🧪 Testing Requirements
- Component testing with React Testing Library
- Theme switching functionality
- Responsive design testing
- Accessibility testing (keyboard navigation, screen readers)
- Cross-browser compatibility

## 🚀 Performance Considerations
- Lazy load components with React.lazy()
- Implement virtual scrolling for large lists
- Optimize images with proper formats and sizes
- Use React.memo() for expensive components
- Implement proper loading states

## 📦 File Organization Best Practices
- Group related components in folders
- Use index.js files for clean imports
- Separate business logic into custom hooks
- Keep components focused and single-purpose
- Use TypeScript interfaces for props (if using TS)

This comprehensive guide provides everything needed to create a modern, theme-aware VocalInk frontend with Cursor AI. Start with Phase 1 and gradually build up the features while maintaining code quality and user experience standards.