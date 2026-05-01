# 23-mobile-ui-design.md

# Mobile-First UI Design: PDF + AI Chatbot

## Overview
This document details the mobile-first UI design for the DocuLearn AI application, adhering strictly to a mobile-only layout. The primary goal is to ensure an uninterrupted, distraction-free reading experience while providing seamless, gesture-based access to the AI chatbot.

---

## 1. UI Layout Description (Mobile Only)

The application relies on progressive disclosure to keep the interface clean.

### **1.1 Global Layout**
- **Viewport:** 100vw x 100vh, locked to prevent horizontal scrolling. 
- **Top Navigation:** Minimalist glassmorphic header containing:
  - Left: Home/Back icon
  - Center: Document Title (truncated)
  - Right: Settings icon
- **Main Content Area:** Dedicated entirely to the PDF Viewer.
- **Floating Action Button (FAB):** Centered at the bottom for uploading new PDFs.

### **1.2 The Chat Panel (Sliding Drawer)**
- **Dimensions:** 80% viewport width, 100% viewport height.
- **Positioning:** Fixed to the right edge, initially translated completely off-screen (`translateX(100%)`).
- **Backdrop:** When the panel is open, the underlying PDF Viewer is overlaid with a subtle dark, dimmed glass effect to maintain context but shift focus to the chat.
- **Content:**
  - Header: Context indicator (e.g., "Page 4") and close button.
  - Body: Scrollable chat history.
  - Footer: Sticky text input area with action buttons.

### **1.3 Upload Flow**
- **Empty State:** Displayed when no document is active. Features a welcoming message ("Upload a PDF to begin") and the central FAB.
- **Upload Action:** Tapping the FAB opens the native OS file picker.
- **Transition:** Upon successful upload, the app transitions seamlessly to the Viewer State without intermediate screens.

---

## 2. Component Hierarchy (React / Next.js)

```jsx
<AppProvider> {/* Provides Zustand Store & Theme Context */}
  <MobileLayout>
    <TopNavigation />
    
    <main className="relative w-full h-full overflow-hidden">
      {/* Primary Layer */}
      {hasDocument ? (
        <PDFViewer>
          <DocumentCanvas />
          <PageIndicator />
          <TextSelectionLayer />
        </PDFViewer>
      ) : (
        <EmptyState />
      )}

      {/* Floating Layer */}
      <UploadFAB />

      {/* Overlay Layer */}
      <ChatBackdrop />
      <ChatPanel>
        <ChatHeader />
        <SuggestionChips />
        <MessageList>
          <UserMessage />
          <AIMessage />
          <LoadingSkeleton />
        </MessageList>
        <ChatInput />
      </ChatPanel>
    </main>
  </MobileLayout>
</AppProvider>
```

---

## 3. State Structure (Zustand)

```typescript
import { create } from 'zustand';

interface AppState {
  // Document State
  documentId: string | null;
  documentTitle: string | null;
  currentPage: number;
  totalPages: number;
  isUploading: boolean;

  // UI State
  isChatOpen: boolean;
  isDragging: boolean;
  selectedText: string | null;

  // Chat State
  messages: Message[];
  isAILoading: boolean;

  // Actions
  setDocument: (id: string, title: string) => void;
  setCurrentPage: (page: number) => void;
  toggleChat: (isOpen?: boolean) => void;
  setDragging: (isDragging: boolean) => void;
  setSelectedText: (text: string | null) => void;
  addMessage: (msg: Message) => void;
  scrollToSection: (pageNumber: number, positionY: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  documentId: null,
  documentTitle: null,
  currentPage: 1,
  totalPages: 0,
  isUploading: false,
  
  isChatOpen: false,
  isDragging: false,
  selectedText: null,
  
  messages: [],
  isAILoading: false,

  setDocument: (id, title) => set({ documentId: id, documentTitle: title }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleChat: (isOpen) => set((state) => ({ isChatOpen: isOpen ?? !state.isChatOpen })),
  setDragging: (isDragging) => set({ isDragging }),
  setSelectedText: (text) => set({ selectedText: text }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  scrollToSection: (pageNumber, positionY) => {
    // Logic to bridge state with the PDF viewer ref
  }
}));
```

---

## 4. Gesture Handling Logic (Framer Motion)

The gesture system relies on edge detection to ensure the PDF scrolling doesn't conflict with the panel sliding.

### **4.1 Edge Detection Rules**
- **Active Area for Swipe-to-Open:** Only the rightmost 30px of the screen will intercept horizontal pan gestures to open the chat panel.
- **PDF Interaction:** All touch events outside this 30px edge zone default to native vertical scrolling and text selection.

### **4.2 Framer Motion Implementation**

```jsx
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useAppStore } from './store';

const ChatPanel = () => {
  const { isChatOpen, toggleChat, setDragging } = useAppStore();
  const controls = useAnimation();
  
  // Spring-based configuration for 60fps smooth easing
  const springConfig = { type: 'spring', damping: 25, stiffness: 200 };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragging(false);
    
    // Swipe right (positive x velocity) closes the panel
    // Or if dragged more than 30% of its width
    if (info.offset.x > 100 || info.velocity.x > 500) {
      toggleChat(false);
    } else {
      // Snap back to open state
      toggleChat(true);
    }
  };

  return (
    <>
      {/* Backdrop: fades in/out based on chat state */}
      <motion.div
        initial={false}
        animate={{ opacity: isChatOpen ? 1 : 0 }}
        pointerEvents={isChatOpen ? 'auto' : 'none'}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => toggleChat(false)} // Tap outside to close
      />

      {/* Sliding Panel */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        initial={{ x: '100%' }}
        animate={{ x: isChatOpen ? '0%' : '100%' }}
        transition={springConfig}
        className="fixed top-0 right-0 h-full w-[80%] bg-white dark:bg-gray-900 shadow-2xl z-50 rounded-l-2xl flex flex-col"
      >
        {/* Chat Panel Content */}
      </motion.div>
    </>
  );
};
```

### **4.3 Chat Behavior and Suggestions**
- **Contextual Awareness:** The `ChatHeader` listens to `currentPage` and `selectedText` from the store.
- **Suggestions:** When the user opens the panel, `SuggestionChips` populate dynamically based on state (e.g., "Summarize Page {currentPage}" or "Explain: {selectedText}").
- **Navigation:** Clicking on a citation in an AI response triggers the `scrollToSection` action, automatically closing the chat panel and scrolling the `PDFViewer` to the relevant offset using `window.scrollTo` or internal canvas offsets.
