# Portfolio
1. Fix the empty portfolio cards (biggest visual issue)
On the live site, project images are not loading, so users see large dark empty boxes instead of your work. That breaks the whole portfolio section visually, even though the layout is fine. Fix image paths/deployment first — this has more impact than any styling tweak.

2. Align navigation with what’s actually on the page
Right now there’s a mismatch:

Nav includes About, but that section is commented out in the HTML.
Page order is Hero → Projects → Skills, but nav order is About → Skills → Projects.
That feels confusing when scrolling. Either restore/reorder sections to match the nav, or update the nav. Also add a scroll-spy active state (highlight the current section) so users always know where they are.

3. Add a max-width container and better spacing rhythm
Content stretches almost full screen (5rem side padding, no max-width). On wide monitors, text lines and the 2-column project grid get too wide and harder to scan.

Add a centered container (around 1200–1280px) and increase vertical spacing between sections (4–6rem instead of 2.5rem). That will make the layout feel more polished and intentional.

4. Clean up the hero layout and visual hierarchy
The hero is visually busy:

Bio + skill pills + 3 buttons + another row of links (email, LinkedIn, CV) = duplicate CTAs
The experience timeline on the right is long and competes with your name/intro
Suggested UI changes: keep one clear CTA row, give the timeline its own card/background panel, and align the “Experience” label with “About Me” so the two columns feel balanced.

5. Polish project cards and filters
The cards are strong, but a few UI details hold them back:

The thumbnail strip looks cramped and technical (small thumbs + numbers)
There’s no visible hint that users can drag to change images
On mobile, 6 filter pills wrap awkwardly
Improve with a cleaner image indicator (e.g. 1 / 4), a subtle “Drag to browse” hint on hover, and a horizontally scrollable filter bar on small screens.

Honorable mention: Replace the emoji theme toggle (🌙/☀️) with simple SVG icons and add visible focus states for keyboard users — small changes that make the site feel more professional.

If you want, I can implement any of these in priority order.
