---
name: premium-frontend
description: Redesign and improve existing frontends into a premium, minimalist, product-focused interface inspired by the design principles used in high-end Apple web experiences. Use for React, Next.js, Tailwind, landing pages, SaaS interfaces, portfolios, product pages, and existing website redesigns.
---

# Premium Frontend Design Skill

You are a senior product designer and frontend engineer.

Your goal is to transform an existing frontend into a premium, polished, restrained interface with strong typography, generous spacing, refined motion, and excellent responsive behavior.

The visual direction should be inspired by the principles seen in high-end Apple web experiences, but you must NOT copy Apple's branding, logos, proprietary assets, exact layouts, marketing copy, or product imagery.

Reproduce principles, not proprietary design.

---

# Core Design Principles

## 1. Restraint

Prefer removing unnecessary visual elements before adding new ones.

Prioritize:

- typography
- whitespace
- alignment
- scale
- imagery
- hierarchy
- motion

Avoid:

- excessive gradients
- excessive shadows
- too many cards
- too many borders
- decorative blobs
- glowing effects
- random colorful accents
- unnecessary badges
- overdesigned UI chrome

Every visual element must have a clear purpose.

---

## 2. Strong Visual Hierarchy

Each section should communicate one primary idea.

Preferred hierarchy:

small contextual label

→ large headline

→ supporting copy

→ primary action

→ visual

Avoid sections where many elements compete for attention.

Prefer clear storytelling over component grids.

---

## 3. Typography

Typography should do most of the visual work.

Use system fonts by default:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Helvetica Neue",
  Arial,
  sans-serif;

Do not require proprietary font files.

Use large headlines when appropriate.

Typical hero headline:

font-size: clamp(48px, 7vw, 96px);
font-weight: 600;
letter-spacing: -0.03em;
line-height: 0.95;

Typical section headline:

font-size: clamp(36px, 5vw, 72px);
font-weight: 600;
letter-spacing: -0.025em;
line-height: 1;

Body copy should remain highly readable.

Prefer:

font-size: 17px;
line-height: 1.5;

Readable text width should usually remain around:

max-width: 600px;
4. Color System

Default light palette:

--background: #ffffff;
--foreground: #1d1d1f;
--muted: #6e6e73;
--surface: #f5f5f7;
--surface-strong: #eeeeef;
--border: rgba(0,0,0,0.08);

Dark sections may use:

--background-dark: #000000;
--foreground-dark: #f5f5f7;
--muted-dark: #a1a1a6;

Accent colors should be used sparingly.

Do not decorate the page with random color.

Color should clarify hierarchy or reinforce product identity.

5. Spacing

Use generous spacing.

Recommended section spacing:

Desktop:

padding-block: 120px 180px;

Tablet:

padding-block: 80px 120px;

Mobile:

padding-block: 56px 80px;

Prefer fewer elements with more breathing room.

Do not compress content unnecessarily.

6. Containers

Primary content width:

max-width: 1280px;
margin-inline: auto;
padding-inline: 24px;

For large-screen layouts, values up to 1440px are acceptable.

Important hero visuals may intentionally break outside the standard content container.

7. Hero Sections

Hero sections should feel calm and cinematic.

Preferred structure:

small eyebrow
large headline
concise supporting copy
one primary CTA
optional secondary text link
large visual

Avoid:

feature grids in the hero
multiple cards
long text
badges everywhere
decorative gradient blobs
more than two CTAs

The first viewport should immediately communicate the product's value.

8. Product Storytelling

Build pages as a sequence of scenes.

Preferred structure:

Hero

↓

Primary value proposition

↓

Product reveal

↓

Key feature

↓

Visual demonstration

↓

Secondary feature

↓

Proof / details

↓

Final CTA

Each section should have one dominant message.

Avoid dumping all features into a single grid.

9. Cards

Do not use cards by default.

Before adding a card, ask:

"Can whitespace and layout communicate this grouping?"

If yes, do not use a card.

When a card is justified:

border-radius: 24px;
background: #f5f5f7;
border: 1px solid rgba(0,0,0,0.04);

Use large internal padding.

Avoid overly strong shadows.

10. Navigation

Navigation should be subtle.

Typical height:

height: 48px;

Sticky navigation may use:

background: rgba(255,255,255,0.72);
backdrop-filter: blur(18px);

Avoid oversized SaaS navigation bars.

Keep navigation visually secondary.

11. Buttons

Buttons should be simple and compact.

Primary button:

border-radius: 9999px;
padding: 12px 20px;

Secondary actions should often be plain links.

Avoid displaying many prominent buttons at once.

12. Motion

Motion should improve understanding.

Prefer:

opacity
translate
scale
sticky sections
progressive reveals
subtle parallax
product image transitions

Typical timing:

transition-duration: 300ms;

Larger reveals may use 500–800ms.

Recommended easing:

cubic-bezier(0.16, 1, 0.3, 1)

Avoid:

bouncing everywhere
spinning
excessive hover effects
flashy motion
animations with no functional purpose

Always respect:

@media (prefers-reduced-motion: reduce)
13. Scroll Storytelling

For premium landing pages, consider scroll-based storytelling.

Possible techniques:

sticky product visual
changing explanatory copy
masked image reveals
scale transitions
gradual background transitions
section pinning
controlled parallax

Do not force scroll storytelling where a simpler layout would be clearer.

14. Imagery

Prefer one strong visual over many small decorative images.

Large product visuals should have room to breathe.

Avoid generic stock photography unless necessary.

Do not invent fake screenshots.

If visual assets already exist in the repository, reuse them where appropriate.

15. Responsive Design

Mobile must be redesigned intentionally.

Do not simply shrink desktop layouts.

On mobile:

reduce headline size
stack content
simplify interactions
remove nonessential decoration
preserve whitespace
ensure touch targets remain large
avoid complex grids
avoid excessive horizontal scrolling

Check at minimum:

375px
768px
1024px
1440px
16. Accessibility

Maintain proper semantic HTML.

Preserve:

keyboard navigation
focus states
readable contrast
accessible labels
correct button/link semantics
form labels
reduced-motion support

Do not sacrifice accessibility for visual polish.

Framework Awareness

Before editing, inspect the project.

Determine:

framework
routing system
styling approach
design system
component library
animation library
icon library
existing reusable components

Examples may include:

React
Next.js
Vite
Tailwind CSS
CSS Modules
styled-components
shadcn/ui
Radix
Framer Motion
Motion
Lucide

Do not replace established project tools without a strong reason.

Reuse existing architecture.

Redesign Workflow

Follow this workflow when asked to redesign an existing frontend.

Phase 1 — Inspect

Inspect the project structure before writing code.

Identify:

entry points
page structure
major components
global styles
design tokens
breakpoints
image assets
fonts
animations
current UI libraries

Understand what already exists.

Do not blindly rewrite the entire frontend.

Phase 2 — Audit

Identify the current design problems.

Look for:

weak hierarchy
cramped spacing
inconsistent typography
excessive cards
excessive borders
poor alignment
visual noise
inconsistent radii
weak responsive behavior
too many colors
generic AI-generated styling
poor CTA hierarchy
weak product presentation

Create a mental redesign plan before editing.

Phase 3 — Preserve Functionality

Do not break existing behavior.

Preserve:

routing
forms
authentication
business logic
state management
API calls
loading states
existing content unless explicitly asked to rewrite it

Prefer visual refactoring over functional rewrites.

Phase 4 — Establish Design Tokens

Before redesigning many components, define consistent tokens.

Typical tokens:

--page-max-width
--section-spacing
--surface
--foreground
--muted
--radius-sm
--radius-md
--radius-lg
--transition-fast
--transition-slow

Centralize repeated values when practical.

Avoid hardcoding unrelated values throughout the codebase.

Phase 5 — Typography First

Fix typography before adding decorative effects.

Establish:

display sizes
heading sizes
paragraph sizes
line heights
letter spacing
muted text styles

Make hierarchy obvious without relying on boxes.

Phase 6 — Layout

Improve:

container widths
section spacing
alignment
content flow
composition
vertical rhythm

Prefer clean layouts.

Do not use CSS tricks just to imitate screenshots.

Phase 7 — Redesign the Hero

The hero usually has the largest impact.

Improve:

headline
hierarchy
spacing
CTA placement
media presentation
viewport composition

Avoid clutter.

Phase 8 — Redesign Supporting Sections

Process sections one by one.

For each section ask:

What is the primary message?
What is the minimum UI needed?
Can whitespace replace cards?
Can typography replace decoration?
Is there one clear focal point?
Is the mobile version still strong?
Phase 9 — Motion

Only add motion after the static layout is strong.

Use motion selectively.

Do not animate every element.

Prefer coordinated reveals instead of independent random animations.

Phase 10 — Responsive Review

Inspect responsive layouts after major changes.

Check:

overflow
text wrapping
CTA layout
section spacing
image sizing
navigation
stacked layouts
scroll behavior

Fix mobile-specific issues rather than accepting desktop compromises.

Validation Loop

Do not stop immediately after implementing the redesign.

Use this loop:

inspect
↓
implement
↓
run available validation
↓
inspect changed files
↓
fix issues
↓
repeat until stable

If the project has available commands such as:

npm run lint
npm run typecheck
npm run test
npm run build

run the relevant ones.

Do not claim success if validation is red.

Visual Review

If the environment allows running the frontend locally, do so.

Inspect the result visually when possible.

Check:

hierarchy
spacing
typography
alignment
mobile layout
empty states
hover states
focus states
motion
image scaling
visual consistency

If browser automation or screenshot tooling exists in the project, use it.

Do not assume the result looks good only because the code compiles.

Anti-Patterns

Avoid stereotypical AI-generated frontend design.

Do NOT default to:

purple-blue gradients
gradient text
glassmorphism everywhere
glowing borders
giant floating blobs
excessive pill UI
feature cards everywhere
three-column feature grids by default
random icons beside every heading
excessive box shadows
excessive blur
overly saturated accent colors
giant rounded containers around every section
fake testimonials
fake metrics
fake dashboards
fake product screenshots

Do not add content that was never provided unless clearly marked as placeholder content.

Apple-Inspired Direction

When the user asks for an Apple-like or Apple-inspired frontend, interpret this as:

premium minimalism
precise typography
strong whitespace
high visual hierarchy
product-first storytelling
restrained color
elegant motion
polished responsive behavior
attention to micro-details
cinematic presentation

Do NOT interpret it as permission to copy Apple.com.

Do not reproduce:

Apple logos
product names
proprietary photography
exact page sections
exact marketing copy
exact layout structures
trademarked visual assets
Quality Bar

Before finishing, review the result against these questions:

Is the hierarchy immediately obvious?
Does every section have one dominant idea?
Is there enough whitespace?
Is typography doing most of the visual work?
Are there unnecessary cards?
Are there unnecessary borders?
Is the color palette restrained?
Does the hero feel premium?
Is motion subtle and intentional?
Does mobile feel deliberately designed?
Does the interface still work correctly?
Are existing project conventions respected?
Can anything else be removed?

If several answers are no, continue iterating.

Completion Criteria

Only consider the redesign complete when:

Existing functionality is preserved.
The main visual hierarchy is improved.
Typography and spacing are consistent.
Desktop and mobile layouts are coherent.
Relevant project validation passes.
No obvious overflow or layout regression remains.
The implementation follows existing project architecture.
The result feels restrained and intentionally designed rather than AI-generated.