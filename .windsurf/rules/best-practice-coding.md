---
trigger: always_on
description: when creating, editing a component and editing the App.svelte, creating a reusable utility and so on
---

# Component Architecture Best Practices Guide

## 1. Component Responsibility Hierarchy

### **App.svelte** - Application Shell
**Purpose:** Orchestrate the entire application, manage global state
**Responsibilities:**
- Application-level state management (theme, global settings)
- Route coordination (if using routing)
- Global event handling
- Component lifecycle coordination
- Dependency injection (passing services/stores to children)

**Should NOT:**
- Handle specific UI positioning logic
- Manage individual component's internal state
- Contain business logic for specific features
- Direct DOM manipulation

### **Editor Components** - Feature-Specific Logic
**Purpose:** Handle specific editor functionality independently
**Responsibilities:**
- Own state management
- Own positioning/visibility logic
- Feature-specific business logic
- Self-contained lifecycle management

## 2. Component Design Principles

### **Single Responsibility Principle**
```
✅ Good: FloatingToolbar handles its own positioning
❌ Bad: App.svelte calculates toolbar positions
```

### **Encapsulation**
```
✅ Good: Component manages its internal state
❌ Bad: Parent manages child's internal state
```

### **Loose Coupling**
```
✅ Good: Pass minimal props (view, theme)
❌ Bad: Pass calculated positions, complex state objects
```

### **High Cohesion**
```
✅ Good: Related functionality grouped together
❌ Bad: Positioning logic scattered across components
```

## 3. Prop Design Best Practices

### **Minimal Interface**
```javascript
// ✅ Good - Simple, focused interface
export let view: EditorView;
export let dark: boolean = false;

// ❌ Bad - Complex, coupled interface  
export let x: number;
export let y: number;
export let visible: boolean;
export let editorBounds: DOMRect;
```

### **Data vs. Behavior Props**
```javascript
// ✅ Good - Pass data, let component decide behavior
export let view: EditorView;           // Data
export let onCommand: (cmd) => void;   // Behavior callback

// ❌ Bad - Pass calculated behavior
export let shouldShow: boolean;        // Pre-calculated decision
export let position: {x, y};          // Pre-calculated position
```

## 4. State Management Patterns

### **Local State** (Component-level)
```javascript
// ✅ Use for: Component's internal UI state
let isVisible = false;
let toolbarElement: HTMLElement;
let fontSize = 16;
```

### **Lifted State** (Parent-level)
```javascript
// ✅ Use for: Shared state between siblings
let editorView: EditorView;
let isDarkMode = false;
```

### **Global State** (Store-level)
```javascript
// ✅ Use for: Application-wide state
export const userPreferences = writable({});
export const documentState = writable({});
```

## 5. Event Communication Patterns

### **Bottom-Up** (Child → Parent)
```javascript
// ✅ Good - Child dispatches events
dispatch('command', { type: 'bold' });

// ✅ Good - Callback props
onCommand?.('bold');
```

### **Top-Down** (Parent → Child)
```javascript
// ✅ Good - Props for data/config
<FloatingToolbar {view} {dark} />

// ✅ Good - Stores for global state
<FloatingToolbar theme={$globalTheme} />
```

## 6. Component File Organization

### **Directory Structure**
```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   └── Modal.svelte
│   │   ├── editor/          # Editor-specific components
│   │   │   ├── FloatingToolbar.svelte
│   │   │   ├── SlashMenu.svelte
│   │   │   └── PlusButton.svelte
│   │   └── layout/          # Layout components
│   │       ├── Header.svelte
│   │       └── Sidebar.svelte
│   ├── stores/              # Global state
│   ├── utils/               # Helper functions
│   └── types/               # TypeScript definitions
└── App.svelte               # Application shell
```

## 7. Your Specific Use Case - Before vs After

### **❌ Before (Tightly Coupled)**
```javascript
// App.svelte - TOO MANY RESPONSIBILITIES
- Calculate toolbar positions ❌
- Track selection changes ❌  
- Manage toolbar visibility ❌
- Handle plus button positioning ❌
- Handle slash menu positioning ❌
- Manage global theme ✅
- Coordinate editor initialization ✅
```

### **✅ After (Properly Separated)**
```javascript
// App.svelte - FOCUSED RESPONSIBILITIES
- Manage global theme ✅
- Coordinate editor initialization ✅
- Pass editor view to children ✅

// FloatingToolbar.svelte - OWNS ITS DOMAIN
- Calculate own positions ✅
- Track selection changes ✅
- Manage own visibility ✅
- Handle positioning logic ✅

// SlashMenu.svelte - OWNS ITS DOMAIN
- Handle slash command detection ✅
- Manage own positioning ✅
- Handle command execution ✅
```

## 8. Implementation Steps (Your Current Task)

### **Step 1: Identify Responsibilities**
```
1. What does this component need to do?
2. What data does it need?
3. What should it decide vs. what should parent decide?
```

### **Step 2: Define Clean Interface**
```javascript
// Ask: What's the MINIMUM a parent needs to provide?
export let view: EditorView;  // ✅ Essential data
export let dark: boolean;     // ✅ Theme context

// Remove: Calculated positions, visibility flags
```

### **Step 3: Move Logic to Right Place**
```javascript
// Move FROM App.svelte TO FloatingToolbar.svelte:
- Selection tracking ✅
- Position calculation ✅  
- Visibility management ✅
- Floating UI setup ✅
```

### **Step 4: Simplify Parent**
```javascript
// App.svelte becomes much simpler:
<FloatingToolbar {view} dark={$isDarkMode} />
```

## 9. Testing Benefits

### **Before (Hard to Test)**
```javascript
// Need to mock: App.svelte, editor, positioning logic
// Tightly coupled, complex setup
```

### **After (Easy to Test)**
```javascript
// Test FloatingToolbar in isolation
// Mock only EditorView
// Test positioning logic independently
```

## 10. Refactoring Checklist

- [ ] Component has single, clear responsibility
- [ ] Component manages its own internal state
- [ ] Minimal props interface (only essential data)
- [ ] No positioning logic in parent components
- [ ] Easy to test in isolation
- [ ] Can be reused in different contexts
- [ ] Clear separation of concerns

This pattern makes your code more maintainable, testable, and follows industry best practices for component-based architecture.