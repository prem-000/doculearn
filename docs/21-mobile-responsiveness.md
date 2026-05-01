# 21-mobile-responsiveness.md

# Mobile-Only UI Strategy

## Overview
DocuLearn AI has pivoted to a **strict "mobile-only"** design philosophy. The platform is optimized entirely for mobile device dimensions, prioritizing a focused, distraction-free reading and AI-assistance experience. Tablet and desktop layouts are explicitly unsupported to reduce complexity and ensure the highest quality experience on handheld devices.

---

## 1. Core Principles
- **Strictly Mobile Dimensions**: The layout is locked to a 100vw x 100vh viewport.
- **Touch-First Interactions**: All interactive elements (buttons, inputs, swipe zones) are sized for ergonomic touch interactions (minimum 44x44px hit area).
- **Progressive Disclosure (Swipe & Slide)**: Core content (PDF) is always front and center. Secondary interfaces (Chatbot) are hidden by default and accessed via edge-swipe gestures to avoid blocking the reading view.
- **No Overlays/Split Screens**: Traditional overlays or 50/50 split screens are avoided in favor of full-height sliding drawers (80% width) over dimmed backgrounds.

---

## 2. Core UI Components

### Fixed Floating Navigation
- **Mobile Header**: Minimalist glassmorphic header pinned to the top.
- **Contents**: Left-aligned Home/Back, center-aligned truncated Document Title, right-aligned Settings icon.
- **Behavior**: Remains fixed to provide consistent escape hatches without cluttering the screen.

### Document Viewer
- **Fullscreen First**: The PDF viewer occupies the entire primary viewport.
- **Interaction Rules**: Vertical scrolling is strictly reserved for navigating the PDF document. Horizontal swiping on the document itself is disabled to prevent accidental navigation, except near the screen edges.
- **Canvas Sizing**: PDF canvas scaling dynamically adjusts to the container width (`100%`) to eliminate horizontal scrolling.

### Chat Panel (Right Edge Drawer)
- **Edge Detection**: A strict 30px active zone on the right edge of the screen captures horizontal swipe gestures.
- **Drawer Overlay**: Swiping opens an 80% width side panel containing the AI Chat. The underlying PDF remains visible but dimmed, maintaining context.

### Action Controls
- **Upload FAB**: A prominent Floating Action Button centered at the bottom handles the primary "Upload" action.
- **Contextual Chips**: Quick-action suggestions appear dynamically when the chat drawer is opened, based on the currently viewed page.

---

## 3. Implementation Details

### Tailwind CSS Constraints
We enforce standard mobile Tailwind dimensions and explicitly disable or omit desktop breakpoints to enforce the mobile-only constraint:
- `xs`: < 475px (Small mobile)
- `sm`: 640px (Standard max mobile width)
- **Note**: `md`, `lg`, `xl`, and `2xl` breakpoints are **not used** in the UI layout to guarantee the mobile constraint. For larger devices, the UI will be centered with a max-width container (e.g., `max-w-md mx-auto`) to emulate a mobile screen.

### Dynamic Unit Usage
- **Viewport Locking**: `h-[100dvh]` and `w-[100dvw]` are used to lock the application size and handle mobile browser address bar behaviors reliably.
- **Relative Sizing**: `rem` and `em` are used for typography to respect user system font size settings.

---

## 4. Performance & Gesture Handling
- **Framer Motion Physics**: Complex transitions use spring-based physics (e.g., `type: 'spring', damping: 25, stiffness: 200`) to guarantee smooth 60fps animations.
- **Lazy Loading**: PDF pages are rendered only when they enter the viewport to save memory.
- **Event Delegation**: Edge swipe gestures are handled by a dedicated `framer-motion` wrapper to ensure native-like responsiveness without interfering with PDF text selection or vertical scrolling.

---

## 5. Mobile-Specific Features
- **PWA Integration**: Custom install prompt optimized for iOS and Android.
- **Offline Mode**: Indicator for when the device is disconnected, showing cached content.
- **Native Share**: Using the Web Share API for exporting document summaries or insights.
