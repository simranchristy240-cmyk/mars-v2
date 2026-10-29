# MARS v2 UI and UX audit

Reviewed: 27 October 2026. Scope: current working-tree implementation, including uncommitted changes.

This is a source-based audit of the routed student and admin interfaces, shared learning components, styles, and supporting API behaviour. It is not a live browser usability test. Findings labelled **confirmed** follow directly from the code; predicted usability effects and proposed designs need validation with learners and teachers. No application code was changed.

## Overall assessment

MARS has useful foundations: a shared UI kit, responsive student grids, a prominent resume action, searchable curriculum navigation, video speed controls, a video/notes split view, explanations, test question navigation, and a course builder with lesson previews. Preserve these.

The main opportunity is to turn a content catalogue with gamification into a guided learning system. Students need to understand what to study, what they understand, and what to revise. Teachers need to publish safely, verify the real student experience, and discover where learners struggle. The current product serves content administration more fully than teaching.

The Class 11/12 versus UG distinction needs to be explicit. MBBS, BDS and AYUSH describe programmes, not a school student's present learning stage. One anatomy lesson can have reusable media, but its prerequisite explanation, objectives, practice and revision should fit the student's stage.

## Highest priority findings

### 1. Authoring and answering support different question types — confirmed, critical

**Evidence:** `client/src/pages/admin/SectionEditor.tsx`, `server/src/models/Section.ts`, and student `Practice.tsx`, `Lesson.tsx`, `TestAttempt.tsx`.

The editor offers single MCQ, multiple MCQ, true/false, matching and image questions. Student answer controls use one selected option; the test handler submits a one-element array. Matching questions have no matching interaction. This can make teacher-created questions impossible to answer correctly. Practice grading also compares selected option IDs rather than implementing matching semantics.

**Change:** Use the same question renderer and answer contract in authoring previews, lessons, practice, exams and reports. Multiple-answer questions need checkboxes and explicit instructions; matching needs labelled pairs and a keyboard-accessible alternative to dragging. Until a type works throughout, prevent its publication. Validate answers, explanations and marks before publishing.

**Acceptance:** Each supported type can be authored, previewed, answered, saved, graded and reviewed consistently.

### 2. Completion does not mean the lesson was completed — confirmed, critical

**Evidence:** `server/src/controllers/progress.controller.ts`, `completeSection`; `client/src/pages/student/Lesson.tsx`, `handleNextSection`.

Completing any section adds the lesson to `lessonsCompleted` and awards lesson XP. The student can finish the first section and appear to have completed the whole lesson. The UI also announces completion and XP without waiting for the completion mutation to succeed.

**Change:** Save section completion first, derive lesson completion from its required published sections, award XP once, and show success only after confirmation. Separate content completion from demonstrated understanding. Revisited sections should not lose their completion state.

**Acceptance:** A five-section lesson remains in progress after section one; a failed save never shows a false completion message.

### 3. Test recovery is unreliable and poorly communicated — confirmed, critical

**Evidence:** `client/src/pages/student/TestAttempt.tsx`, `server/src/controllers/test.controller.ts`, student `TestLobby.tsx`.

The attempt restores saved answers but resets the displayed timer to the full duration. Answer saves run without awaiting or catching failures. Submit does not wait for pending answer requests. The lobby treats any existing attempt as completed, even though the API provides an `attemptStatus`; interrupted students can be directed to a report instead of resuming.

**Change:** Return a server-authoritative deadline and remaining time. Enforce the deadline server-side. Use explicit states: Not started, In progress, Submitted, Missed. Show Saving / Saved / Offline and retry failed saves. Finish pending saves before submission. Provide a submission review showing answered, unanswered and flagged totals across the whole test, with duplicate-submit protection.

**Acceptance:** Refresh never grants more time; the lobby offers Resume; transient disconnection does not silently discard the latest answer.

### 4. Teacher preview is incomplete — confirmed, high

**Evidence:** `client/src/App.tsx`, `StudentRoute`; `client/src/pages/admin/CourseBuilder.tsx`, preview controls.

There is already an embedded builder preview and a link to a student lesson. However, admin access to other student routes redirects to `/admin`. Teachers cannot follow the full onboarding, curriculum, practice, exam or report journey as a student. An admin lesson preview also does not establish what a free or Basic learner can actually access.

**Change:** Add a persistent Preview as student mode with stage, track, Free/Basic/Plus/Premium, device width and learning state controls. Reuse student components and access rules. Isolate preview progress, scores and payments from real records. Keep a visible preview banner and Return to editing action.

**Acceptance:** A teacher can reproduce a locked student's journey from Home through lesson and practice without changing a real student's data.

### 5. Editing can discard work without warning — confirmed, high

**Evidence:** `client/src/pages/admin/CourseBuilder.tsx`, selection-driven form reset effect and save handlers.

Changing selection reloads form state from stored content. There is no dirty-state navigation protection or draft recovery. Several different save actions coexist across course, topic, lesson and section forms. Selecting another item can erase unsaved edits.

**Change:** Make selection and editing states explicit. Show the exact item being edited and Saved / Unsaved / Saving / Failed status. Add draft autosave or a Save draft workflow, recovery after reload, and a leave-with-unsaved-changes guard. Use a persistent action bar and inline validation. Autosave should save drafts rather than silently change published content.

**Acceptance:** Edit a question, select another lesson, return: the draft is recovered or the user was explicitly prompted before discarding it.

### 6. Publishing is too easy to confuse with saving — confirmed, high

**Evidence:** `CourseBuilder.tsx`, default publication state and Published checkboxes; `SectionEditor.tsx`.

New courses, topics and lessons initialise as published; sections commonly default to published too. Saving content and making it available are closely coupled. Multiple publication and access controls do not explain effective visibility through the hierarchy.

**Change:** Default new material to Draft. Separate Save draft and Publish. Show a publish checklist and effective access: for example, “Hidden: parent chapter is Draft” or “Requires Plus because the lesson requires Plus.” Add version history and archive/restore. For structural deletions, show affected lesson/question counts before confirmation.

**Acceptance:** An unfinished lesson never appears merely because its teacher saved it; access restrictions are understandable without manually inspecting every ancestor.

### 7. Test schedule editing can shift local times — confirmed, high

**Evidence:** `CourseBuilder.tsx`, test form initialisation using `toISOString().slice(0, 16)` for `datetime-local` inputs.

UTC strings are inserted into local datetime inputs. In India, editing and resaving a schedule can reinterpret the displayed UTC clock time as local time.

**Change:** Convert consistently between stored UTC and the chosen scheduling timezone. Display the timezone beside the fields and in the final publish summary. Validate start/end order and explain what happens when a student starts near the closing time.

**Acceptance:** A test scheduled for 10:00 IST still shows and saves 10:00 IST after reopening its editor.

## Student experience

### Onboarding and curriculum fit

**Confirmed:** Goal selection is mandatory for students without a selected course. Its choices are published courses, with MBBS/BDS/AYUSH/general badges inferred from the title. There is no separate stage/year selection. An empty or failed course list offers “Please contact administration” without a retry or actionable contact route.

**Proposal:** Ask first “Where are you in your studies?” with Class 11, Class 12, repeating entrance preparation, and undergraduate options. Ask the relevant programme/year or preparation goal next. Keep setup short and allow later adjustment. Show actual course outcomes, prerequisites, sample lesson and content coverage instead of inferred badges. Do not imply that an anatomy-only offering covers a complete medical entrance syllabus.

### Navigation and Home hierarchy

**Confirmed:** Primary navigation is Home, Progress, Rank and Profile. Learn and Tests are inside Home; practice is nested in topics. The existing Courses and CourseDetail pages are imported but their routes redirect Home.

**Effect:** Core study actions compete with streak, XP, course progress and upgrade information. Returning learners have to rediscover their study tools inside the dashboard. “Rank” may also suggest an examination rank even though it represents gamification.

**Proposal:** Use Home, Learn, Practice, Tests and Progress as the primary study destinations; put Profile in the account menu and achievements inside Progress. On compact screens, keep five clear destinations, or combine Learn and Home if testing shows that is easier. Call XP competition “Leaderboard,” explain its basis, and make it optional.

Home order: Continue learning → today's realistic study plan → revision due → upcoming test → curriculum summary → optional streak/achievements. Put the curriculum and next task above secondary metrics on phones.

### Resume and lesson orientation

**Confirmed:** Home resumes a lesson ID. The lesson resets to section zero on route changes; playback starts at the configured clip start, and the lesson does not wire saved playback progress into the player. A backend video-progress endpoint exists, but is not integrated into this lesson flow.

**Proposal:** Resume the exact section and timestamp, with an explicit restart action. Show chapter, learning objective, expected duration and prerequisite concepts before the activity. Afterward, suggest the next lesson or a short practice set rather than immediately returning Home.

### Practice should close a learning loop

**Confirmed:** Practice shows explanations when provided, but consumes neither returned `correctOptions` nor hints. A wrong answer can therefore leave the correct answer unidentified if the explanation is absent. Session completion is an alert followed by navigation Home; there is no durable session summary or retry-wrong flow.

**Proposal:** After answering, identify the correct option, explain the anatomical reasoning and distractors, link to the relevant lesson, and allow “Review later.” Finish with correct/wrong/skipped totals and actions to retry mistakes or revise concepts. Add separate Learn mode with feedback and Exam mode with delayed feedback. Keep XP secondary to learning feedback.

### Progress should answer “What next?”

**Confirmed:** Reports emphasise completion, averages, best scores, accuracy and test trends. Test reports already have a topic/section breakdown, which is a useful foundation. There is no linked revision plan in these screens. A fixed 70% threshold is used as a general “strong” score.

**Proposal:** Separate completed content, question performance and revision status. Label estimates and show sample sizes: “3 of 5 correct; more practice needed.” Suggest one concrete next activity per weak topic. Make thresholds meaningful to the assessment rather than presenting one arbitrary percentage as readiness. Avoid a mastery claim based only on watching or a tiny number of questions.

### Content protection obstructs studying

**Confirmed:** `useContentProtection.ts` blocks selection/copy-related shortcuts and context menus across the student shell; global CSS disables selection. A window-size heuristic can trigger a Security Alert. PDF notes render to canvas without a text layer.

**Effect:** Looking up terminology, taking notes and using assistive reading tools becomes harder. Canvas-only notes offer no equivalent selectable/searchable reading experience. The warning can be unrelated to learner intent.

**Proposal:** Preserve ordinary study interactions and provide an accessible text alternative for notes. Use access checks and unobtrusive watermarking for restricted media. Keep protection scoped to actual assets and remove accusatory heuristic alerts. Add searchable text, page navigation and accessible figure descriptions while retaining zoom.

### Errors must not masquerade as empty content or paywalls

**Confirmed:** Every lesson query error becomes “This lesson is locked.” Several other pages default missing query data to zero or empty arrays without an explicit error state.

**Proposal:** Distinguish offline, temporary server failure, expired session, missing content and insufficient plan access. Each should offer a useful next action: Retry, Sign in, Return to chapter, or Compare plans. Show neutral loading/error states rather than false zero performance.

### Purchase clarity and account trust

**Confirmed:** Track switching is blocked after a purchase; the navbar explains this mainly through a lock/title. The upgrade modal lists Discussion & Doubt Forum Access, while the reviewed routes contain no forum. Tier prices use fallback values, including `||`, so a legitimate zero price can be displayed as a paid fallback. `targetTier` initialises component state only, which can preserve an earlier choice when reused.

**Proposal:** Explain course-specific ownership and switching policy before payment; offer a visible support route afterward. Show actual server-backed price, included content, access duration and payable upgrade difference. Preselect the plan needed for the clicked item whenever opening the modal. Audit all feature promises against working product routes. Return the learner to the exact content after successful purchase.

**Confirmed login gap:** The OTP “send” action changes UI state without sending a code, and the Firebase helper accepts any six-character OTP as a mock flow. Google failure falls back to a mock identity. Demo logins are presented in the login page. These may support development, but need explicit development gating; real learners need real authentication and honest error recovery.

## Teacher experience

The system has Student and Admin roles, with no dedicated Teacher role or teacher-facing workspace. `AdminDashboard.tsx` prioritises revenue, enrollment counts, courses and purchases. A student-list API exists, but there is no routed student-management screen. This is an implementation gap, not evidence that the business requires every possible LMS feature.

Prioritise the following teaching tasks:

1. **Prepare:** Find or create a lesson, choose stage/objectives, reuse a question, attach notes, save a draft.
2. **Verify:** Preview each question type, phone layout and access tier using actual student components.
3. **Publish:** Review changes and effective visibility, then release a known version.
4. **Observe:** See assigned students or cohorts, participation, completion, weak topics and frequently missed questions.
5. **Respond:** Assign targeted practice, clarify a disputed answer, correct content and track the correction.

Recommended workspace: Overview, Curriculum, Question bank, Tests, Students, Insights. Keep commercial settings and payments in an Admin area. Add a Teacher role with course-scoped permission only if multiple instructors will author or monitor learning.

The builder should have a stable outline at left, one central editor and a collapsible settings/preview panel. Show a breadcrumb such as Course → Upper limb → Brachial plexus → Question 3. Keep preview mode visually distinct from edit mode. Use consistent terminology: Course → Chapter → Lesson → Activity; reserve Test section for exam grouping. The current mixture of topic, chapter, module and section increases interpretation work.

Add reorder/move/duplicate controls with clear persistence; the current authoring flow mainly appends by count and removes `order` during section updates. Add a reusable question bank with search, stage, topic, difficulty, learning objective and question type filters. Reuse should explicitly distinguish linked items from independent copies. Support import preview and validation before bulk publication if bulk authoring is needed.

## UI direction

Keep the navy brand, restrained gold, light paper surfaces and optional dark mode. The existing responsive grid, component tokens and reduced-motion handling provide a base. Significant improvement should come from hierarchy, readability and task clarity.

- **Study content:** Start around 16–18 px body text, generous line spacing and a comfortable reading width. Keep labels legible; do not use the small badge typography for essential instructions. Use plain headings such as “Revise these topics” and “Continue lesson.”
- **Hierarchy:** Give each screen one clear primary action. Use gold sparingly for meaningful emphasis. Reduce the number of equally prominent cards, pills, progress rings and decorative blocks in the study path.
- **Anatomy figures:** Provide full-screen zoom, pan, readable labels and meaningful alternative descriptions. Offer hide/reveal labels for recall where appropriate. Avoid cropping diagrams merely to fit a card.
- **Video and notes:** Keep split view for wide screens; provide explicit Video / Notes tabs on phones and remember the preference. Add captions/transcripts and links between key timestamps and notes. Preserve playback speed controls.
- **Interaction:** Use roughly 44 px minimum touch targets, visible keyboard focus, complete keyboard behaviour for custom radio groups, and focus management in dialogs. Existing ARIA labels and dialog roles are useful but do not by themselves provide those behaviours.
- **Status:** Use consistent text plus icons for correct, wrong, locked, draft and saving states. Do not require colour alone to interpret an outcome. Replace routine browser alerts with inline feedback; reserve confirmations for decisions that need them.
- **Themes:** Stabilise and visually validate one light and one dark learning theme before expanding themed variations. Check contrast, diagram fidelity, zoom and focus in every supported theme.
- **Teacher layout:** Use denser, scannable tables and persistent actions where appropriate. The admin header uses a fixed horizontal arrangement and needs phone/tablet verification; student responsive CSS does not prove admin responsiveness.

## Different experiences by learning stage

| Design decision | Class 11/12 and entrance preparation | Undergraduate medical programmes |
|---|---|---|
| Course organisation | Prerequisites, foundational concepts, syllabus-aligned chapters | Programme/year, regional or systemic anatomy, clinical applications |
| Lesson opening | Plain-language objective, vocabulary and prior knowledge | Objectives, anatomical relationships and applied relevance |
| Practice | Guided progression, concept checks and appropriately aligned entrance-style questions | Identification, relations, clinical cases, practical/viva-style recall |
| Feedback | Explain reasoning and common misconceptions without assuming clinical knowledge | Explain anatomical basis, differential reasoning and clinical relevance |
| Revision | Manageable daily plan and repeated recall of weak concepts | Region/structure-based revision and practical identification |
| Progress | Confidence-building next steps and topic accuracy | Objective coverage, topic performance and applied question performance |

Keep one coherent UI and shared content primitives. Change the learning sequence and instructional framing by stage. Let a learner access foundational explanations without changing programme or payment plan. Treat academic stage, difficulty and commercial access as separate concepts.

## Suggested delivery order

**First: restore trust.** Align supported question types; fix completion; fix attempt status, deadlines, save recovery and submission; protect unsaved edits; correct schedule conversion; stop misleading error states; gate mock authentication and remove unsupported sales promises.

**Second: make daily learning obvious.** Introduce stage-aware onboarding and clear study navigation, exact resume, a focused Home, practice summaries and actionable revision links. Provide the complete student preview and an understandable draft/publish workflow.

**Third: improve teaching and visual depth.** Add the teacher's student/insight workflow, reusable question bank, content revisions, richer diagram study tools and carefully tested responsive layouts. Sequence cohort assignment and doubt handling according to actual teaching operations.

## Validation before committing to the redesign

Test the current flow and proposed prototype with a small mix of Class 11/12 learners, UG learners and teachers. Include phone use, a narrow laptop viewport, keyboard-only navigation, 200% zoom and a slow/disconnected connection.

Observe these concrete tasks:

1. New student chooses an appropriate learning path and starts a relevant lesson without assistance.
2. Returning student resumes the exact location and identifies the next revision task.
3. Student gets a question wrong, identifies the correct reasoning and revisits the associated concept.
4. Student loses connection during a test, refreshes, resumes and submits with the correct saved answers and remaining time.
5. Teacher edits a lesson, switches items, recovers the draft and publishes intentionally.
6. Teacher previews a free learner and a paid learner, on a phone, and explains the resulting access.
7. Teacher identifies a weak topic and prepares an appropriate follow-up activity.

Measure task completion, time to first relevant learning activity, navigation errors, draft loss, failed-save recovery and whether learners correctly understand their completion and performance. Establish a baseline before setting numerical improvement targets.
