# BizKit AI Design Guidelines

## Design Approach

**Selected Approach:** Design System (Utility-Focused SaaS Tool)  
**Primary References:** Linear's clean interface patterns, Notion's form clarity, Stripe's professional trust  
**Rationale:** BizKit AI is a productivity tool for professionals requiring efficiency, clarity, and trust-building design over visual flair.

## Core Design Principles

1. **Professional Efficiency:** Clean, distraction-free interface optimized for rapid content generation
2. **Form Clarity:** Crystal-clear input hierarchy with helpful placeholders and visual grouping
3. **Trust Through Polish:** Refined details that signal reliability and quality without over-design
4. **Progressive Disclosure:** Tab-based interface revealing only active tool to reduce cognitive load

---

## Typography

### Font System
- **Primary Font:** Inter or DM Sans (Google Fonts CDN)
- **Monospace:** JetBrains Mono for code/output display

### Hierarchy
- **Hero Title:** 2.5rem (desktop) / 2rem (mobile), font-weight: 700, letter-spacing: -0.02em
- **Hero Subtitle:** 1.125rem, font-weight: 400, line-height: 1.6
- **Section Headers:** 1.5rem, font-weight: 600
- **Tab Labels:** 0.875rem, font-weight: 500, uppercase tracking
- **Form Labels:** 0.875rem, font-weight: 500
- **Input Text:** 1rem, font-weight: 400
- **Body/Helper Text:** 0.875rem, line-height: 1.5
- **Button Text:** 0.875rem, font-weight: 600

---

## Layout System

### Spacing Primitives
**Consistent Tailwind Units:** 2, 4, 6, 8, 12, 16, 24  
- Micro spacing (gaps, padding): p-2, p-4
- Component spacing: p-6, p-8, mb-8
- Section spacing: py-12, py-16, py-24

### Container Strategy
- **Max Width:** max-w-4xl for main content area (clean, focused workspace)
- **Page Padding:** px-4 (mobile), px-6 (tablet), px-8 (desktop)
- **Form Width:** Full width within container for optimal mobile experience

### Vertical Rhythm
- Hero section: py-16 (mobile) / py-24 (desktop)
- Tool interface: py-8
- Form sections: space-y-6
- Between form groups: mb-8

---

## Component Library

### Hero Section
- **Layout:** Centered content, max-w-3xl
- **Elements:**
  - Main title with gradient text treatment or bold weight
  - Subtitle with generous line-height (1.6)
  - Beta badge: small pill with border, subtle styling
- **Spacing:** py-16 to py-24 with bottom border or subtle divider

### Tab Navigation System
- **Style:** Horizontal button group with active state distinction
- **Layout:** Flex wrap for mobile, horizontal scroll if needed
- **Active State:** Distinct background treatment, possibly bottom border accent
- **Inactive State:** Muted appearance, clear hover affordance
- **Spacing:** gap-2 between tabs, mb-8 below tab bar
- **Typography:** 0.875rem, font-weight 500, subtle uppercase

### Form Components

**Input Fields:**
- Border: 1-2px solid, rounded corners (rounded-md)
- Padding: px-4 py-3 (comfortable touch targets)
- Focus state: Distinct border treatment, subtle shadow
- Placeholder: Muted but readable
- Full width: w-full for consistency

**Textarea:**
- Min height: h-32 for project scope/deliverables
- Resize: vertical only
- Same styling as input fields

**Labels:**
- Position: Above input, mb-2
- Weight: font-medium
- Include helper text where beneficial (muted, text-sm, mt-1)

**Form Groups:**
- Wrapper: space-y-6 for vertical rhythm
- Clear visual separation between different input types

### Generate Button
- **Style:** Primary action button, prominent
- **Size:** Full width on mobile, auto/max-width on desktop
- **Padding:** px-8 py-3 (substantial click target)
- **Loading State:** Disabled appearance with "Generating..." text
- **Position:** mt-8 after form inputs

### Output Display
- **Container:** mt-8 with clear visual separation from form
- **Element:** Textarea with monospace font or pre-formatted div
- **Styling:** 
  - Background: Subtle contrast from page background
  - Border: Similar to form inputs for consistency
  - Padding: p-6
  - Min height: h-64
  - Font: Monospace for code-like clarity
  - Read-only: Clear visual indication
- **Copy Button:** Positioned top-right of output area

### Error Messages
- **Style:** Inline below button or output area
- **Typography:** text-sm with appropriate icon (exclamation)
- **Treatment:** Muted red/warning treatment without harsh colors

---

## Page Structure

### Single Page Layout
1. **Header/Hero** (py-16/py-24)
   - Centered title + subtitle
   - Beta badge
   - Optional subtle divider/border below

2. **Tool Interface** (py-8)
   - Tab navigation (mb-8)
   - Active form (space-y-6)
   - Generate button (mt-8)
   - Output display (mt-8, shown after generation)

3. **Footer** (py-8, mt-16)
   - Simple credit line or contact
   - Version/beta indicator
   - Minimal, unobtrusive

---

## Mobile Considerations

- **Stack Everything:** Single column layout, no side-by-side forms
- **Touch Targets:** Minimum 44px height for buttons/tabs
- **Tabs:** Horizontal scroll or wrap to multiple rows
- **Font Scaling:** Slightly smaller hero (2rem vs 2.5rem)
- **Spacing Reduction:** py-12 instead of py-24 for sections
- **Form Width:** Full width with consistent px-4 padding

---

## Visual Enhancements (Minimal)

- **Micro-interactions:** Subtle scale on button hover (scale-105)
- **Focus Rings:** Clear, consistent focus states for accessibility
- **Shadows:** Minimal use - subtle on buttons and active inputs only
- **Borders:** Consistent 1-2px throughout for clean definition
- **NO animations** beyond hover states and loading indicators

---

## Trust & Professionalism Elements

- **Beta Badge:** Small pill design near hero title
- **Clear Value Props:** Subtitle explicitly states what tools do
- **Professional Output:** Monospace font suggests technical precision
- **Consistent Spacing:** Signals attention to detail
- **Loading States:** Clear feedback during generation
- **Error Handling:** Friendly, helpful messages

---

## Key UX Patterns

1. **Progressive Disclosure:** Only show active tool's form
2. **Persistent Output:** Keep generated content visible until new generation
3. **Clear States:** Loading, success, error all visually distinct
4. **No Distractions:** Clean workspace without unnecessary elements
5. **Form Validation:** Friendly inline validation if fields are required

This design creates a professional, efficient SaaS tool interface that builds trust through polish and clarity while maintaining focus on the core value: rapid content generation.