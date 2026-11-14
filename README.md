# FiverrTask

Next.js freelance project workspace and a local keyword rewriter.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. For production, use `npm run build` and `npm start`.

## Firebase

The local `.env.local` connects to Firebase project `folio-workspace`. It is ignored by Git. For another environment, copy `.env.example` and fill in the Firebase web app configuration.

Email/password and Google Authentication are enabled. Localhost is authorized. Add your production domain in Firebase Authentication before deploying there. The first Google sign-in still requires the person to choose their Google account.

Cloud Firestore is in `asia-south1` (Mumbai). `firestore.rules` contains the deployed rules. Each verified user can read only their own projects and profile. Project queries are scoped to the signed-in owner. Only the owner can create, edit or remove their records. New accounts start without sample projects. No service account credentials are shipped to the browser.

## Projects

- Client is the single record name. Fiverr profile is a separate required input; account names stay in the header/profile.
- Total amount is gross USD. Net value is total minus 20%; combined work divides net by the owner plus comma-separated collaborators. Values round to cents.
- Legacy records without `totalAmount` treat their original `price` as gross. Saving a legacy record writes explicit gross/net/share fields.
- Combine details show total, platform fee, net, member names and per-person value.
- Required date and optional time. A date-only deadline ends at 23:59:59 in the browser timezone.
- Live countdown, day/date-time extensions, completion/undo, reopening and owner-only confirmed removal.
- Default filter is In progress; Combine defaults to No. Search, profile filters, sorting and calendar date selection are available.
- Completed summary emphasizes value, with quantity underneath.

## Rewriter

Two columns on larger screens; one column on phones. Options contains settings, keywords and history. No demo buttons or comparison view. Rewriting is rule based, not AI paraphrasing: keywords receive a dash and @ becomes AT. Formatting does not guarantee platform compliance.

Drafts, custom keywords and the last 15 explicitly rewritten/copied messages stay in the browser. Projects and member profiles use Firestore. Known former sample drafts are cleared; real drafts are retained.

## Design and validation

Surfaces use 8-10px corner radii, light/dark themes and short entrance animations with a reduced-motion override. The calendar opens in a dialog.

`npm test` runs 28 tests, including fee/split calculations, collaborator parsing, countdowns, date handling, calendar boundaries and rewriting. `npm run build` validates TypeScript and production output.

Live Firebase checks covered authenticated reads, owner writes, foreign-write/deletion denial, combined fields and invalid-data rejection. Browser checks covered adding a combined project, its fee preview/details, completion value/count and removal. All temporary QA projects, profiles and authentication accounts were deleted after testing.

## Latest interface updates

FiverrTask has a custom animated brand loader. Dialogs, mobile options and expandable panels have enter/exit transitions and respect reduced-motion preferences. The rewriter uses a compact desktop toolbar, additional tools below the editors, and a glass options sheet on phones. Project actions occupy their own row on smaller screens.

Projects accept an optional HTTP/HTTPS sheet URL, available directly beside the client name and in project details. Unsafe protocols and embedded credentials are rejected. The matching optional field validation is published in Firestore rules.

The unused split playground has been removed; actual combined-project calculations and value insights remain. Extension mode inputs keep independent controlled values to avoid React controlled/uncontrolled warnings. Email signup includes verification and the sign-in page includes password recovery.

## Install and offline use

The footer Install app button uses the native browser install prompt when available, with Safari/browser-menu instructions as fallback. The manifest includes desktop/mobile and maskable icons. Service workers are registered only in production over HTTPS (or localhost).

After the first online visit, wait for Offline ready. Subsequent offline navigations open a self-contained rewriter without Firebase dependencies. It uses the same generated rewrite engine and keyword dictionary as the online app; drafts, custom keywords and history share the same browser storage. Projects and authentication require internet. Clearing site data removes the offline copy.

`npm run build` generates versioned offline assets before building Next.js. New offline versions activate after a successful complete precache. No project/auth/API responses are cached by the worker.

## Private dashboards

Firestore subscriptions query projects by the signed-in ownerId and subscribe only to that user's profile document. Read rules enforce the same owner boundary. Statistics, calendars, profile filters and project lists derive only from this private query. Profile inputs use plain text without datalist arrows. Mobile project cards have separate surfaces and 22px spacing with straight action dividers.

## Order IDs and remaining value

Summary cards show In progress, Completed value, Remaining value and total Project value. Monetary summaries use the owner's share after the platform fee and any split.

New projects require an Order ID. IDs are trimmed, accept an optional leading #, and normalize to uppercase. They must use 1-80 letters, numbers, hyphens or underscores. A private per-user reservation is committed atomically with the project, so concurrent duplicate submissions cannot create two projects. Assigned IDs are immutable. Deleting a project atomically releases its reservation.

Signed-in users with legacy projects missing IDs receive a list with per-project inputs, including completed projects. Saving an ID changes only the order fields. Once no IDs are missing, no reminder is shown. Dismissing the reminder defers it until the next visit, with an Add Order IDs button available in Projects.

Run `npm test` for unit tests. With Java 21+ installed, `npm run test:rules` starts the official Firestore emulator in the demo-fiverrtask project and verifies actual transactions, concurrent duplicates, migration preservation, reservation cleanup and private reads. No production records are used by this test suite.
