# Tailwind CSS Patterns & Design System

## Overview
This project uses Tailwind CSS 3.3.6 for styling with a consistent design system and responsive layouts.

## Configuration
**File**: `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
}
```

## Design System Patterns

### Color Palette Usage

#### Primary Colors (Blue)
```css
/* Backgrounds */
bg-blue-50      /* Light background */
bg-blue-500     /* Primary background */
bg-blue-600     /* Hover state */
bg-blue-700     /* Active state */

/* Text */
text-blue-600   /* Primary text */
text-blue-700   /* Darker text */

/* Borders */
border-blue-300 /* Light borders */
border-blue-500 /* Primary borders */
```

#### Semantic Colors
```css
/* Success */
bg-green-50 text-green-700
border-green-200

/* Warning */
bg-yellow-50 text-yellow-700
border-yellow-200

/* Error */
bg-red-50 text-red-700
border-red-200

/* Info */
bg-blue-50 text-blue-700
border-blue-200
```

### Typography Scale

#### Headings
```css
/* Page titles */
text-3xl font-bold text-gray-900

/* Section headers */
text-2xl font-semibold text-gray-800

/* Subsection headers */
text-xl font-medium text-gray-700

/* Component titles */
text-lg font-medium text-gray-900
```

#### Body Text
```css
/* Primary text */
text-base text-gray-900

/* Secondary text */
text-sm text-gray-600

/* Captions */
text-xs text-gray-500
```

## Component Patterns

### Button Variants

#### Primary Button
```jsx
<button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Secondary Action
</button>
```

#### Danger Button
```jsx
<button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
  Delete
</button>
```

### Card Components

#### Basic Card
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-medium text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### Interactive Card
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
  <h3 className="text-lg font-medium text-gray-900 mb-2">Clickable Card</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

### Form Elements

#### Input Field
```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
    placeholder="Enter value"
  />
</div>
```

#### Textarea
```jsx
<textarea
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
  rows={4}
  placeholder="Enter text"
/>
```

#### Select Dropdown
```jsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white">
  <option>Select option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

## Layout Patterns

### Container Layouts
```jsx
/* Page container */
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </div>
</div>

/* Centered content */
<div className="flex items-center justify-center min-h-screen bg-gray-50">
  <div className="w-full max-w-md space-y-6">
    {/* Centered content */}
  </div>
</div>
```

### Grid Layouts
```jsx
/* Responsive grid */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

/* Dashboard grid */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

### Flexbox Patterns
```jsx
/* Navigation */
<nav className="flex items-center justify-between px-6 py-4">
  <div className="flex items-center space-x-4">
    {/* Left items */}
  </div>
  <div className="flex items-center space-x-2">
    {/* Right items */}
  </div>
</nav>

/* Vertical stack */
<div className="flex flex-col space-y-4">
  {/* Stacked items */}
</div>
```

## Responsive Design

### Breakpoint Strategy
```css
/* Mobile first approach */
sm:   /* 640px and up */
md:   /* 768px and up */
lg:   /* 1024px and up */
xl:   /* 1280px and up */
2xl:  /* 1536px and up */
```

### Common Responsive Patterns
```jsx
/* Responsive text sizes */
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

/* Responsive spacing */
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>

/* Responsive visibility */
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
```

## Animation and Transitions

### Hover States
```jsx
<button className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200">
  Animated Button
</button>
```

### Loading States
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
</div>
```

### Fade Transitions
```jsx
<div className="opacity-0 transition-opacity duration-300 data-[show=true]:opacity-100">
  Fade in content
</div>
```

## Utility Patterns

### Spacing System
```css
/* Consistent spacing scale */
space-y-1    /* 0.25rem */
space-y-2    /* 0.5rem */
space-y-4    /* 1rem */
space-y-6    /* 1.5rem */
space-y-8    /* 2rem */
```

### Shadow Variations
```css
shadow-sm    /* Subtle shadow */
shadow       /* Default shadow */
shadow-md    /* Medium shadow */
shadow-lg    /* Large shadow */
shadow-xl    /* Extra large shadow */
```

### Border Radius
```css
rounded-sm   /* 2px */
rounded      /* 4px */
rounded-md   /* 6px */
rounded-lg   /* 8px */
rounded-xl   /* 12px */
rounded-full /* 50% */
```

## Dark Mode Considerations

### Dark Mode Classes
```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Content that adapts to dark mode */}
</div>
```

### Dark Mode Strategy
- Use semantic color variables
- Test components in both modes
- Maintain proper contrast ratios
- Consider user preference detection

## Performance Optimization

### Purging Unused CSS
Tailwind automatically purges unused styles in production based on the `content` configuration in `tailwind.config.js`.

### JIT Mode
Just-In-Time mode is enabled by default in Tailwind CSS 3, generating styles on-demand for better performance.

This design system ensures consistent styling across the educational platform while maintaining flexibility for component-specific needs.