# Star Wars Fleet

A single-page Angular application that displays SWAPI starship data in a
feature-rich, infinite-scrolling data grid - built for the ITONICS
front-end dev case study.

## Tech Stack

- Angular 21 (standalone components, signals)
- PrimeNG (`p-table`) for the data grid
- Tailwind CSS for styling
- RxJS for the HTTP/data layer
- Vitest (Angular's current default test runner) for unit tests

## Getting Started

```bash
npm install
ng serve
```

Then open `http://localhost:4200`.

## SWAPI Resource

This app uses the **starships** endpoint
(`https://swapi.dev/api/starships/`), displaying:

- Name
- Model
- Manufacturer
- Crew
- Passengers
- Hyperdrive Rating

All requests are read-only, as required - no data is ever written back to
SWAPI.

## Infinite Scroll & the "No Loader While Scrolling" Behavior

Pagination is driven by SWAPI's `?page=` parameter, wrapped in
`SwapiService.getPage(page)`, which:

- Fetches a page, maps each starship's `id` out of its `url` field, and
  returns `{ results, hasNext, count }`.
- **Caches every fetched page** in an in-memory `Map<number, ...>`, so a
  page already loaded is never requested again.

Scroll detection uses an `IntersectionObserver` watching a 1×1px sentinel
element placed at the end of the last visible row (`#scrollAnchor`). The
observer's `root` is PrimeNG's internal scrollable container
(`.p-datatable-table-container`), so it fires based on scroll position
*within the grid*, not the page. When the sentinel intersects the
viewport, `loadNextPage()` fires - guarded so it's a no-op if there's no
next page (`hasNext()` is false) or a request is already in flight
(`isLoading()` is true).

**No loader is shown during scroll-triggered fetches.** The component
tracks `isLoading()`, but the template only renders a loading state when
`isLoading() && rows().length === 0` - true solely on the very first
page load. Every subsequent page fetched by scrolling appends rows
directly to the `rows` signal with no visual indicator, so new rows
appear seamlessly as the user scrolls.

When the last page is reached, a plain end-of-list message
("You've reached the end of the fleet.") renders as part of the last row
in the `#body` template - not as a pinned footer - so it scrolls
naturally with the content instead of staying fixed over other rows.

## Search

A single input above the grid filters the already-loaded rows by name
(case-insensitive, via a `computed()` signal - no additional network
requests are made on search). An empty state renders in the grid when no
rows match.

## Editable Cells

The **Name** column is editable:

- **Start editing**: double-click the cell.
- **Confirm**: press Enter, or blur the input (click/tab away).
- **Cancel**: press Escape, discarding the change.

Edited values are written only to the component's local `rows` signal  -
never sent to SWAPI. The write path
(`rows.update(existing => existing.map(...))`) is intentionally isolated
in one method (`confirmEdit`), so swapping it for a real API call later
(e.g. `this.swapiService.updateStarship(id, newValue).subscribe(...)`)
would only require changing that one method, not any UI code.

## Column Resizing

Enabled via PrimeNG's `[resizableColumns]="true"` and `pResizableColumn`
on each header cell, with `columnResizeMode="expand"` - dragging a column
handle grows/shrinks that column immediately, expanding the table's total
width as needed rather than stealing space from other columns. The grid
wrapper uses `overflow-x-auto`, so on narrow viewports (or after
resizing columns wide) the grid scrolls horizontally instead of clipping
content off-screen.

## Layout & Responsiveness

The grid's height is set via `scrollHeight="calc(100vh - 140px)"` so it
fills the remaining viewport height below the toolbar, rather than a
fixed pixel value. The `140px` offset accounts for the toolbar's height
and outer page padding - if the toolbar's height changes, this value may
need adjusting to avoid a gap or clipping at the bottom.

## Testing

Two test files, 12 tests total, all passing:

**`src/app/service/swapi.service.spec.ts`** (4 tests) - covers
`SwapiService`:
- Fetches a page, correctly derives each starship's numeric `id` from
  its `url`, and sets `hasNext` from the response's `next` field.
- Sets `hasNext` to `false` when there's no further page.
- **Caches a fetched page** - a second call for the same page number
  does not issue a second HTTP request (`httpMock.expectNone(...)`),
  directly verifying the pagination/caching requirement.
- Propagates an HTTP error correctly to the subscriber.

**`src/app/component/starship.component/starship.component.spec.ts`**
(6 tests) - covers `StarshipComponent`'s editing behavior (the grid
test required by the spec):
- Loads the first page of rows on init.
- Enters edit mode with the current name pre-filled.
- Commits a trimmed value to `rows` on confirm.
- Rejects an empty/whitespace-only edit (leaves the original value
  intact).
- Discards changes on cancel, and correctly ignores the follow-up
  `confirmEdit` call that fires from the browser's blur event when the
  input unmounts (a real edge case: pressing Escape removes the focused
  input, which the browser reports as a blur - the component guards
  against committing in that case).
- Filters rows by name via `filteredRows()` without mutating the
  underlying `rows` signal.

**`src/app/app.spec.ts`** (2 tests) - smoke tests confirming the app
bootstraps and renders the "Star Wars Fleet" heading. Not a substitute
for the dedicated component test above, since it doesn't exercise
editing/filtering logic.

**Test environment note:** Vitest's test environment (jsdom) doesn't
implement `IntersectionObserver`, which `StarshipComponent` relies on
for scroll detection. A minimal mock at
`src/app/test-util/intersection-observer-mock.ts` stubs this out and is
imported for its side effect at the top of any spec file that
instantiates `StarshipComponent` (directly or via `App`).

### Running the tests

```bash
ng test
```

## Trade-offs & Limitations

- **Scroll container selector is version-coupled.** The
  `IntersectionObserver`'s root is found via
  `querySelector('.p-datatable-table-container')`, which reaches into
  PrimeNG's internal DOM structure. A future PrimeNG version that renames
  this class would silently break infinite scroll (the observer would
  simply never attach).
- **`scrollHeight` is a static `calc()` estimate**, not measured at
  runtime. It's accurate for the current toolbar layout but would need
  manual adjustment if the toolbar's height changes (e.g. wrapping to
  two lines on very narrow screens). A `ResizeObserver`-based approach
  would be more robust but adds complexity not required by the spec.
- **Search operates only on already-loaded rows.** Typing a search term
  does not trigger additional SWAPI requests - it filters client-side
  across whatever pages have been fetched so far. This matches the
  "do not overfetch" requirement, but means a search term matching a
  starship on a not-yet-loaded page won't surface it until that page has
  been scrolled to.
- **Edited names are not persisted** across a page reload (in-memory
  signal state only), per the spec's client-state-only constraint.

## Third-Party Packages

- **PrimeNG** - data grid (`p-table`), including built-in scrollable
  body and column-resize handling.
- **Tailwind CSS** - all styling.
