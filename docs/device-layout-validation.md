# iPhone and iPad layout validation

## Layout behavior

- Use the current window minus safe-area insets, including after rotation or iPad window resizing.
- Tablet spacing starts at 700 points wide and 600 points tall, including iPad mini in portrait. Short landscape iPhone windows retain compact controls.
- Catalog and summary columns require at least 1000 points of usable width. Larger accessibility text switches back to one column.
- Bottom navigation reserves its own space and includes the home-indicator inset. Scrollable content does not need a fixed tab-bar spacer.
- Catalog search and variable-price entry adjust for the iOS keyboard. Sticky search is disabled in short windows and with larger accessibility text.

## Validation performed

- `npx tsc --noEmit`
- `node --test tests/device-layout.test.cjs`
- Expo web export and native iOS Metro bundling.
- Chromium layout checks for Catalog, Insights with history expanded, and all Settings sections expanded at: 320×568, 375×667, 393×852, 440×956, 667×375, 852×393, 744×1133, 820×1180, 1024×768, 1366×1024, 320×1024, and 507×768. No unexpected horizontal overflow or JavaScript rendering errors.
- Three onboarding pages, login, signup, and password reset at nine representative window sizes. No unexpected horizontal overflow or rendering errors; forms were not submitted.
- Dark-mode Settings at 320×568: the final export action can scroll into view above navigation.
- Native Expo Go on iOS 26.2: iPhone 17 Pro catalog, iPhone Settings with accessibility-large text, and iPad mini catalog inspected visually.

Authenticated screen checks used isolated sample data in a temporary project copy, including long product names and large monetary amounts. Production authentication and database records were not modified.

## Remaining device verification

Browser viewport checks are not a substitute for testing every iOS version or hardware model. Before distribution, check the installed release build on a physical iPhone and iPad: keyboard focus and dismissal, rotation with a form open, iPad multitasking, swipe actions, and the PDF share sheet. These interactions were not exhaustively exercised by this layout pass.
