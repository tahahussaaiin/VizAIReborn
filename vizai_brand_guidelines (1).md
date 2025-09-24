# VizAI Brand Guidelines & Design System
## Visual Identity & Brand Positioning

### Brand Essence
**VizAI: "Unlock the Story in Your Data"**

VizAI transforms raw data into publication-quality visual narratives that stop the scroll and spark conversations. Inspired by Visual Capitalist's approach to making complex information instantly compelling, but powered by AI to make this accessible to everyone.

### Brand Personality
- **Innovative**: Cutting-edge AI creativity meets professional design
- **Accessible**: Complex visualization made simple through conversation
- **Impactful**: Every visualization tells a story worth sharing
- **Professional**: Publication-ready quality, every time
- **Creative**: Unlimited visual metaphors, never template-bound

---

## Visual Design System

### Primary Brand Colors
```css
/* Primary Palette - Inspired by data visualization best practices */
--viz-primary: #2563eb;      /* Professional Blue - trust, data, intelligence */
--viz-secondary: #7c3aed;    /* Creative Purple - innovation, AI, creativity */
--viz-accent: #06b6d4;       /* Cyan - fresh, modern, tech */
--viz-success: #10b981;      /* Emerald - insights, discovery, success */
--viz-warning: #f59e0b;      /* Amber - highlights, attention, energy */
--viz-danger: #ef4444;       /* Red - important data points, alerts */

/* Neutral Palette */
--viz-gray-50: #f8fafc;
--viz-gray-100: #f1f5f9;
--viz-gray-200: #e2e8f0;
--viz-gray-300: #cbd5e1;
--viz-gray-400: #94a3b8;
--viz-gray-500: #64748b;
--viz-gray-600: #475569;
--viz-gray-700: #334155;
--viz-gray-800: #1e293b;
--viz-gray-900: #0f172a;

/* Background & Surface */
--viz-bg-primary: #ffffff;
--viz-bg-secondary: #f8fafc;
--viz-bg-accent: #f1f5f9;
--viz-surface: #ffffff;
--viz-surface-elevated: #ffffff;
```

### Typography System
```css
/* Primary Font: Inter - Clean, modern, excellent readability */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Display Font: Plus Jakarta Sans - Creative, friendly, distinctive */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Font Scale */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Spacing & Layout
```css
/* Spacing Scale (Tailwind-inspired) */
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Component System
```css
/* Border Radius */
--radius-sm: 0.125rem;   /* 2px */
--radius: 0.25rem;       /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Animations */
--transition-fast: 150ms ease-in-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

---

## UI Component Specifications

### Button System
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
}

/* Primary Button - Main actions */
.btn-primary {
  background: var(--viz-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
}

/* Secondary Button - Supporting actions */
.btn-secondary {
  background: var(--viz-gray-100);
  color: var(--viz-gray-700);
  border: 1px solid var(--viz-gray-200);
}

/* Ghost Button - Minimal actions */
.btn-ghost {
  background: transparent;
  color: var(--viz-gray-600);
  hover: background-color: var(--viz-gray-50);
}
```

### Input System
```css
/* Input Base Styles */
.input-base {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--viz-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-family: 'Inter', sans-serif;
  transition: var(--transition-fast);
  background: var(--viz-bg-primary);
}

.input-base:focus {
  outline: none;
  border-color: var(--viz-primary);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
}

/* File Upload Styles */
.file-upload-zone {
  border: 2px dashed var(--viz-gray-300);
  border-radius: var(--radius-xl);
  padding: var(--space-12);
  text-align: center;
  transition: var(--transition-normal);
}

.file-upload-zone.drag-active {
  border-color: var(--viz-primary);
  background-color: rgb(37 99 235 / 0.05);
}
```

### Card System
```css
/* Card Components */
.card {
  background: var(--viz-surface);
  border: 1px solid var(--viz-gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Visualization Preview Card */
.viz-preview-card {
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, var(--viz-gray-50), var(--viz-gray-100));
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Visual Language & Iconography

### Icon System
Using **Lucide React** for consistent, modern iconography:
```typescript
// Core Icons
import {
  Upload,         // Data upload
  Sparkles,       // AI creativity
  BarChart3,      // Visualization
  Download,       // Export
  Palette,        // Design/creativity
  Brain,          // AI intelligence
  Eye,            // Preview/view
  Share,          // Sharing
  Settings,       // Configuration
  Lightbulb,      // Ideas/insights
  Zap,            // Speed/power
  Target          // Precision/accuracy
} from 'lucide-react';
```

### Data Visualization Color Palettes
```css
/* Categorical Palettes */
--viz-categorical-1: #3b82f6, #ef4444, #10b981, #f59e0b, #8b5cf6, #06b6d4;
--viz-categorical-2: #1e40af, #dc2626, #059669, #d97706, #7c2d12, #0891b2;

/* Sequential Palettes */
--viz-sequential-blue: #eff6ff, #dbeafe, #bfdbfe, #93c5fd, #60a5fa, #3b82f6, #2563eb, #1d4ed8;
--viz-sequential-green: #f0fdf4, #dcfce7, #bbf7d0, #86efac, #4ade80, #22c55e, #16a34a, #15803d;
--viz-sequential-purple: #faf5ff, #f3e8ff, #e9d5ff, #d8b4fe, #c084fc, #a855f7, #9333ea, #7c3aed;

/* Diverging Palettes */
--viz-diverging-1: #dc2626, #ef4444, #f87171, #fca5a5, #fecaca, #e5e7eb, #d1d5db, #9ca3af, #6b7280, #374151;
```

---

## Layout & Grid System

### Responsive Breakpoints
```css
/* Mobile-first approach (following Lovable best practices) */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Grid Layouts
```css
/* Main Application Grid */
.app-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}

/* Visualization Gallery Grid */
.viz-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
  padding: var(--space-6);
}
```

---

## Voice & Tone Guidelines

### Brand Voice
- **Conversational**: "Let's turn your data into something amazing"
- **Encouraging**: "Every dataset has a story waiting to be told"
- **Professional**: Clear, precise, expert but approachable
- **Inspiring**: Focus on possibilities and creative potential

### UI Copy Examples
```
// Loading States
"🎨 Analyzing your data for creative opportunities..."
"✨ Generating visual metaphors..."
"🖼️ Creating custom assets..."
"🎯 Composing your visualization..."

// Success Messages
"🎉 Your visualization is ready to wow your audience!"
"✨ Created a visualization that's never been seen before"

// Error Messages
"Let's try that again - your data deserves the perfect visual story"
"Something went wrong, but every great visualization starts with iteration"

// Empty States
"Upload your CSV and watch data transform into visual stories"
"Your next viral visualization is just one upload away"
```

---

## Accessibility Standards

### Color Contrast
- **WCAG AA compliance**: 4.5:1 contrast ratio for normal text
- **WCAG AAA compliance**: 7:1 contrast ratio where possible
- **Color-blind friendly**: Use shape, texture, and patterns alongside color

### Typography Accessibility
- Minimum 16px base font size
- Line height: 1.5 for body text
- Adequate spacing between interactive elements (44px minimum)

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Clear focus indicators
- Logical tab order
- Skip links for screen readers

---

## Implementation Notes for Lovable.dev

### Recommended Libraries
```json
{
  "ui": ["@radix-ui/react-*", "class-variance-authority"],
  "styling": ["tailwindcss", "@tailwindcss/typography"],
  "icons": ["lucide-react"],
  "animations": ["framer-motion"],
  "charts": ["recharts", "d3"],
  "utilities": ["clsx", "tailwind-merge"]
}
```

### Component Architecture
```typescript
// Use composition pattern for maximum flexibility
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: string;
  size?: string;
}

// Example Button component structure
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
```

This brand system creates a foundation that's both visually appealing and highly functional for an AI-powered data visualization platform, ready for implementation with Lovable.dev's best practices.