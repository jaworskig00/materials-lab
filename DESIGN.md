---
name: Materials Lab
description: A restrained laboratory instrument for traceable measurements and uncertain estimates.
colors:
  bg: "#121814"
  panel: "#19211c"
  line: "#344139"
  muted: "#a7b4a9"
  accent: "#d8bc87"
  green: "#c3d7ba"
  text: "#e5ebe4"
  control-ground: "#202b23"
  scene-ground: "#161e19"
  comparison-sage: "#b4c9b4"
  comparison-blue: "#9db8d3"
  comparison-lilac: "#c7abd2"
typography:
  headline:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "clamp(26px, 2.8vw, 38px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "13px"
    fontWeight: 450
    lineHeight: 1.7
  label:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "11px"
    fontWeight: 450
  chart-label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
  button:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  control: "4px"
  panel: "5px"
  feedback: "6px"
spacing:
  compact: "8px"
  control: "12px"
  section: "20px"
  group: "24px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "#19251b"
    typography: "{typography.button}"
    rounded: "{rounded.panel}"
    padding: "10px 15px"
  button-subtle:
    backgroundColor: "#212c24"
    textColor: "#dce6d9"
    typography: "{typography.button}"
    rounded: "{rounded.panel}"
    padding: "10px 15px"
  button-text:
    textColor: "#c9d7c6"
    padding: "0"
  search-field:
    backgroundColor: "#141c17"
    textColor: "#e1eadf"
    rounded: "{rounded.control}"
    padding: "0 9px"
  navigation-active:
    textColor: "{colors.accent}"
  status-tag:
    backgroundColor: "#253225"
    textColor: "#c0d2b9"
    rounded: "{rounded.control}"
    padding: "5px 8px"
  chart-container:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "20px 15px"
  catalogue-record:
    rounded: "{rounded.control}"
    padding: "13px 9px"
---

# Design System: Materials Lab

## Overview

**Creative North Star: "The Laboratory Instrument"**

The laboratory instrument is quiet, dense and explicit. Charcoal-green grounds, fine dividing rules and restrained sage controls keep attention on the specimen and its evidence. Gold marks estimates; measured values remain separately named and shaped.

Manrope carries the interface and large estimates; IBM Plex Mono carries identifiers, interval bounds, composition quantities and tabular measurements. Authored tensile-fixture geometry supplies material character without claiming to simulate deformation. The interface is flat around this dimensional scene.

Recorded from the shipped `src/style.css`, `src/App.tsx`, `src/components/Charts.tsx`, `src/components/Specimen.tsx` and self-hosted font imports in `src/main.tsx`. The direction contract confirms the visual language; code determines the values. Source observations include the final legibility overrides, not superseded declarations. Surface composition remains a surface-specific pattern rather than a requirement for every future page.

**Key Characteristics:**
- Charcoal-green surfaces and fine structural rules.
- Gold estimates, pale measured diamonds and explicit units.
- Compact controls with visible keyboard focus.
- Authored schematic geometry with optional motion and a fallback.

## Colors

The palette is a subdued green-charcoal instrument ground with warm estimates, sage controls and a limited categorical comparison sequence. Frontmatter owns the exact recurring color values; short CSS-variable names are retained where present.

### Primary
- **Instrument Sage** (`green`): filled actions, the stage-slider accent and brand mark.
- **Estimate Gold** (`accent`): predicted marks and interval lines, active navigation, focus outlines and link hover. Large estimate numerals use a lighter gold treatment in the implementation.

### Secondary
- **Comparison Sage**, **Comparison Blue** and **Comparison Lilac**: ordered record colors reused between the saved-record borders and chart marks. Gold is the first record. They identify records, not confidence levels.

### Neutral
- **Charcoal Green** (`bg`): the page ground.
- **Panel Green** (`panel`): working surfaces and comparison-chart containers.
- **Scene Green** (`scene-ground`): the specimen viewport and its fallback.
- **Control Green** (`control-ground`): selects and table captions.
- **Instrument Rule** (`line`): panel boundaries, chart grid and structural separators.
- **Muted Sage** (`muted`) and **Pale Text** (`text`): secondary and primary reading hierarchy. Local component shades refine these roles without becoming new global primitives.

**The Evidence Pair Rule.** Show estimates and recorded measurements as separately named marks: circles and intervals for predictions, diamonds for measurements. Keep units and uncertainty beside the values.

## Typography

**Display / Body Font:** self-hosted Manrope Variable, with sans-serif fallback.
**Label / Mono Font:** self-hosted IBM Plex Mono at regular weight, with monospace fallback.

The pairing is compact and technical without using a monospaced face for every control. There is no mathematical type scale: hierarchy follows the density of the task.

### Hierarchy
- **Headline:** fluid page headings use the frontmatter headline role, with balanced wrapping.
- **Title:** compact section and chart headings use the title role. Supporting reading sections use larger headings, usually 22–24px; these are not a separate display identity.
- **Body:** the body role describes evidence and import prose. Secondary operational descriptions commonly use 12px. Evidence prose is bounded to 75ch.
- **Label:** the final stylesheet promotes recurring catalogue, result and provenance labels to the label role. Some compact units and tags use 10px.
- **Numeric emphasis:** large estimates use Manrope, medium weight, tight tracking and tabular numerals; their size is 32px on desktop and 35px on mobile. Interval bounds, measurements and IDs use IBM Plex Mono.
- **Chart labels:** comparison charts use the chart-label role. Property mini-plots retain their own SVG viewBox and 11px source text; they do not share the comparison resizing implementation.

**The Screen-Pixel Label Rule.** Comparison labels stay at 13px as the chart resizes; change the axis range and tick count rather than scaling the text.

## Layout

The shared shell is centered with a maximum width of 1700px. Desktop content uses 34px side gutters, reducing to 22px at 1150px and 16px at 720px. Recurring gaps and padding use compact 8–12px relationships inside controls, and 20–24px between related blocks. The extracted spacing entries name repeated values; the source does not define a spacing-variable system.

The laboratory currently uses a catalogue / specimen / prediction grid: 250px, flexible center with a 360px minimum, and 320px. At 1500px and above, the side columns become 270px and 350px with a 420px center minimum. At 1150px and below, results move beneath the two remaining columns and the three properties align horizontally. At 720px and below, the tasks stack in source order and properties become vertical again. The catalogue retains a bounded internal scroll area.

Comparison charts use three columns on wide screens and one column at 1150px and below. Saved records use four columns, then two at 720px. Evidence and CSV import use dedicated two-column layouts that stack on mobile. Tables scroll within their containers. The current minimum page width is 360px; do not claim support below it from these styles alone.

## Elevation & Depth

Ordinary panels are flat, separated by tonal changes and fine one-pixel rules. The authored specimen uses actual scene lighting, metal materials and cast shadows. Notifications are the only observed floating interface surface, using a diffuse shadow; that local treatment is not a general card-elevation scale.

**The Instrument Surface Rule.** Use tonal grounds and fine rules for ordinary interface hierarchy. Dimensional lighting belongs to the schematic specimen; transient notifications may float above the workspace.

## Shapes

Controls, tags and record rows have slightly rounded corners. Buttons and chart containers use the panel radius; feedback and empty states use the feedback radius. The enclosing laboratory frame and brand mark use 7px corners. Thin rules establish alignment without making every section a card. Prediction circles and measured diamonds carry evidence semantics; small support dots supplement text rather than replace it.

## Components

### Buttons
Restrained filled, bordered and text-only actions. Primary buttons use sage with dark text. Subtle buttons use a darker ground and a one-pixel green border. Standard buttons have a 40px minimum height; the compact variant uses 32px with 7px by 10px padding. Disabled buttons reduce opacity and use a non-interactive cursor. Hover changes color and border over 150ms. Keyboard focus uses a two-pixel gold outline with a four-pixel offset.

### Inputs / Fields
Search combines an inline SVG search icon with a dark input inside a fine border. The field has the control radius and a 35px input height. Focus-within applies the gold outline with a two-pixel offset. Selects use native affordances, a dark-green ground and the same compact corner family. Errors are explicit text in a warm tinted bordered block.

### Navigation
Text tabs share the header, using muted labels and a gold bottom rule for the active destination. An optional count sits beside Compare. At mobile width, navigation occupies a separate full-width header row; destinations stay visible. Active state is also expressed through `aria-current`.

### Tags and support
Small bordered sage tags carry training/test membership and processing status. Support states pair colored dots or outline SVG icons with readable text. Tags are information, not substitute controls.

### Containers
Comparison-chart containers and method notes use fine borders and muted panel grounds. Tables use tinted headers, monospaced data and row separators. Empty and error states preserve the same typography, subdued surface colors and ordinary action components.

### Catalogue records
Each record is a full-width selectable row with material label, source identifier, processing description and split/support information. Selection changes both background and border and includes a check icon. Search, state filtering and a bounded scroll list preserve the same record density across datasets.

### Evidence plots
Scalar estimates use a circle and capped interval; measurements use diamonds. Exact values and units remain in adjacent text or tables. Comparison charts allocate 55px per record and adapt the plotting range to the measured container width; three or five ticks are used according to width. Categorical record color never replaces measurement shape or a label.

### Schematic specimen
Authored geometry shows the tensile fixture and gold coupon on a subdued grid. Orbit, zoom, camera reset, play/pause, stage slider and illustration reset are explicit controls. Animation starts paused. Reduced motion disables playback while retaining stage inspection, and CSS transitions/animations are suppressed. WebGL failure replaces the scene with an SVG schematic and explanatory text while predictions remain available. Scene timing is illustration behavior, not a general UI motion token.

## Do's and Don'ts

### Do:
- **Do** preserve visible units, interval bounds, record identity and measured/predicted labels.
- **Do** use monospaced identifiers and measured quantities, with tabular numerals for large estimates.
- **Do** retain focus outlines, textual chart alternatives, reduced-motion controls and the WebGL fallback.
- **Do** stack the laboratory tasks on narrow screens and let wide data tables scroll inside their containers.

### Don't:
- **Don't** present the schematic scene as a deformation, fracture or finite-element simulation.
- **Don't** replace uncertainty or data-support language with a decorative confidence badge.
- **Don't** shrink comparison-chart labels to fit additional records.
- **Don't** introduce a marketing hero or decorative card grid into this instrument workspace.

Not canonized: isolated fixture material values, superseded tiny research-label declarations and peripheral 9px text are not reusable system rules. No tonal ramps are invented. No historical concept-roll seed is invented: randomized exploration was inapplicable to the pinned user brief, and the shipped, user-approved direction is the authority here.
