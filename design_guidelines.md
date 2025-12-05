# BizKit AI Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern SaaS productivity tools like Linear, Notion, and Stripe for their clean, utility-focused aesthetics that prioritize functionality without sacrificing visual polish.

## Core Design Principles
1. **Clarity First**: Clean, uncluttered interface that guides users through content generation
2. **Efficiency**: Minimal steps from input to output
3. **Professional Polish**: SaaS-grade quality that builds trust

## Typography System

**Font Families**:
- Primary: Inter (Google Fonts) - all interface elements
- Monospace: JetBrains Mono - for generated output display

**Scale**:
- Hero Title: text-4xl (36px) / md:text-5xl (48px), font-bold
- Hero Subtitle: text-lg (18px) / md:text-xl (20px), font-normal
- Section Headers: text-2xl (24px), font-semibold
- Tab Labels: text-base (16px), font-medium
- Input Labels: text-sm (14px), font-medium
- Body Text: text-base (16px), font-normal
- Small Notes: text-sm (14px), font-normal

## Layout System

**Spacing Units**: Use Tailwind spacing of 4, 6, 8, 12, 16, 24
- Component padding: p-6 to p-8
- Section spacing: space-y-8 to space-y-12
- Form field gaps: gap-6
- Hero section padding: py-16 md:py-24

**Container Strategy**:
- Max-width: max-w-4xl for main content
- Centered: mx-auto
- Horizontal padding: px-4 md:px-6

## Component Library

### Hero Section
- Clean, centered layout
- Title + Subtitle + Beta note stacked vertically
- Generous spacing (space-y-4)
- Beta note in muted text with subtle background badge
- No background image needed - clean, professional feel

### Tab Navigation
- Horizontal tab bar with 4 options
- Active state: solid background, bold text
- Inactive state: transparent, medium weight text
- Border-b on active tab for clear indicator
- Full-width on mobile (grid-cols-2), inline on desktop
- Smooth transitions between states

### Form Layouts
- Single-column stacked inputs
- Labels above inputs (not floating)
- Input fields: full-width, consistent height (h-10 for text, h-24 for textarea)
- Rounded corners: rounded-lg
- Borders: subtle, with focus states
- Spacing between fields: space-y-6

### Input Fields
**Text Inputs**:
- Height: h-10
- Padding: px-4
- Border: 1px solid with focus ring on interaction
- Rounded: rounded-lg

**Textareas**:
- Min-height: h-24
- Padding: p-4
- Resize: vertical only

**Placeholder Text**: Subtle, helpful examples

### Buttons
**Primary Generate Button**:
- Full-width on mobile, auto-width on desktop
- Height: h-12
- Padding: px-8
- Rounded: rounded-lg
- Font: font-semibold text-base
- Disabled state: reduced opacity, cursor-not-allowed
- Loading state: "Generating..." text with spinner icon

### Output Display
- Large textarea: min-h-64 (256px)
- Monospace font for readability
- Read-only attribute
- Copy-friendly formatting
- Subtle background to distinguish from inputs
- Rounded: rounded-lg
- Border: subtle

### Error States
- Red accent for error messages
- Clear, human-readable error text
- Display above output area
- Icon + message combination

## Animations
**Minimal, Purposeful Only**:
- Tab transitions: smooth color/background changes (150ms)
- Button loading: simple opacity pulse on disabled state
- No scroll animations, no complex transitions

## Mobile Responsiveness
- Stack all elements vertically on mobile
- Tabs: 2-column grid on mobile, horizontal row on desktop
- Inputs: full-width at all breakpoints
- Generous touch targets (min 44px height)
- Comfortable spacing for thumb navigation

## Images
**No Hero Image Required**: This is a utility-first SaaS tool. Clean typography and layout are more appropriate than decorative imagery. Focus on functional clarity over visual embellishment.

## Visual Hierarchy
1. Hero title (largest, boldest)
2. Tab navigation (clear, interactive)
3. Form labels and inputs (organized, scannable)
4. Generate button (prominent, action-focused)
5. Output display (large, readable)
6. Helper text and notes (subtle, supportive)

## Accessibility
- Sufficient contrast ratios (4.5:1 minimum)
- Clear focus indicators on all interactive elements
- Semantic HTML (proper labels, buttons, textareas)
- Keyboard navigation support
- ARIA labels where needed