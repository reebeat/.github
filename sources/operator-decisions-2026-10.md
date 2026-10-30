# reebeat: operator decisions and stated intentions (source log)

Compiled by the lead agent from the operator's own statements in the working session of 2026-10-28 and 2026-10-29. Each item is the operator's decision or wording unless marked **(lead proposal, accepted)**, which means the operator confirmed a proposal the lead made. Quotes are the operator's words, lightly trimmed. This log is a primary source for the goals model; where a repository document disagrees, this log and its date win until the document is corrected.

## Identity and positioning

- Tagline: "Declarative multimedia: accessible, reproducible, rebuilt as you edit." Intent line: "We take care of building; you focus on creating."
- Technical description: "a declarative incremental FRP language for multimedia artifact generation".
- "Compiler feels too internally technically oriented. I'd rather promote the qualities we strive for than the mechanism."
- Qualities named by the operator as the project's power: declarative scene and transition creation, accessibility, reproducibility, fast incremental and reactive builds.
- Vocabulary: "creation might be a more appropriate word than build for creative work"; generate multimedia artifacts "focusing on declaring the narrative and its structure rather than how it's procedurally built".
- "multimedia" rather than "multi-sensory" (standard term).
- Contrast to inform: traditional video editors, multimedia creation programs, motion-graphics automation tools: how they work, perform, capabilities surfaced, and the resulting experience of creating with them.
- Earlier framing: "a reactive declarative motion graphics compiler that generates beats/edges/transitions based on the declared scenes/nodes/states", compared with "a traditional video editor or a video conceived as a sequence of steps in a notebook or program"; "videos are a sequence of imperative commands; instead we propose chopping it up into modular composable declarative pieces where time-sensitive effects are triggered via subscription to a producer".
- The project "expands to a general purpose motion graphics video compiler generating transitions for and between renderers, providing modular contracts, components and building blocks to support multiple parts of multimedia artifact building".

## Model and vocabulary

- Scenes/States are nodes; Beats are edges (transitions) in a state machine; "declaring the implicit state machines explicitly". Scene = compound state grouping States **(lead proposal, accepted)**.
- Elements declare styles and transitions "similar to CSS transitions and maybe media queries"; effects (sfx/vfx) connect to produced events; attributes such as sound level or position "should be able to be not only constant but variable declared with a function ... resulting in a curve like bezier, linear".
- Attributes are data ("mathematical functions that then are able to be replaced with data at build time"), not computations.
- Frame rate is an explicit configuration with presets (24, 30, 60).
- Story-wide identity: the same id is the same entity across Scenes.
- SMIL and functional reactive animation are the semantic foundations; the operator ratified a smaller v1 subset of the construct catalogue (spec 0007).
- IR formats vs artifact formats are explicitly different; "fountain is likely an artifact format similar to video artifacts and decks like revealjs". JSON is the persistent IR, owned by reebeat, with a schema covering a chosen subset of SMIL, SCXML and FRP constructs. Isomorphic codecs where formats can round-trip.
- XState v6 (with its Effect integration) is acceptable as a build-time dependency: "our runtime isn't a runtime, it's a build step". The compiler may depend on experimental versions as pinned static assets.
- Narration and sound effects differ: narration produces and consumes events that the timeline adjusts to; sound effects can too, but the default is milder; subtitles must be readable at a reasonable pace.
- Multiple render engines per scene (e.g. Manim for math scenes), with custom transition rules for beats between scenes of different renderers; an SDK for building render engines.

## Accessibility and audiences

- "Utilise it for accessibility, ensuring material produces accessible artifacts to different audiences, like hearing impaired, visually impaired, reduced motion", and language variants adjusting timings (issues #10, #12).

## Interactivity

- Interactivity is the missing multimedia dimension: plan websites as an artifact type "with a focus on interactive learning material utilising multimedia"; interactive lessons deferred for later investigation (issues #19, #20).
- Interaction support differs per artifact: decks get beats within a scene; websites support clicking and other interactions; videos can automate events with "an explicitly visible cursor".
- "Interactions is in essence just another element that's able to trigger events", surfaced "to different agents like AI or human tools via different interfaces like functions, tool calling, or website interactive elements".
- Authoring tools interact with creational formats; interaction tools interact with produced artifacts; the artifact interface (static vs dynamic) determines how interactions are surfaced.

## Product and business model

- Open source the compiler and its formats; close source the products built on top, "like the collaborative multiplayer video editor with a free tier for basic non-cost features, gating costly premium features behind a paywall for features like multiplayer collaboration and heavily integrated AI agents, while keeping it modular and extensible so users can bring their own agents, give them access to the video editing tools and likely develop plugins and/or extensions".
- Licence: Apache-2.0 for the compiler and formats. Copyright holder: Philip Bjørknes Krogh (individual; a sole proprietorship exists; a company may follow "if the business model has potential").
- reebeat studio: a collaborative editor; its repository was made public by the operator; its licence is not decided. A user experience inspired by DaVinci Resolve's phase-based pages ("lenses"); novelties include a deck view for recording narration and tying cut narration pieces to beat lifecycle events; manuscript, scene/state/beat, timeline and render views supporting both generated video and decks. Editor interfaces for pure human creation, pure agent creation, and collaboration between human and human, agent and agent, and human and agent (multiplayer).
- Studio ships web first plus a single binary built with Bun; native builds later.
- Collaboration: a merge-based keyed document with a validation gate in the sync server, using Loro.
- foldkit-flow: a node-based graph UI for Foldkit (like React Flow / Svelte Flow), its own repository, MIT.
- npm: publish `@reebeat/*` pre-releases; the npm organisation `reebeat` exists.
- ffmpeg with libx264 is GPL: noted for later, before distributing a binary (issue #7).

## Engineering values that shape the products

- Correctness by construction; single source of truth; explicit dependency graphs between core and derivations (homelab `docs/PROJECTS.md`, the operator's governing motto).
- Effect stability policy: packages depending on unstable or experimental Effect APIs cap their range below the next minor.
- Prefer upstream fixes through Effect's own services, not around them (the operator rejected a `node:crypto` workaround in Foldkit).

## Technical framing: the "how" behind the "what" and "why" (2026-10-29)

- Technical one-liner, accepted by the operator ("love it! frame it and document it for the more technically facing description of our how fueling the what and why"): *Semantically declared story beats, compiled into multimedia artifacts: statecharts for structure, functional reactive time, and an incremental build graph, written in Effect.* It replaces "a declarative incremental FRP language for multimedia artifact generation" as the technical description.
- Elevator version: *You declare the story's beats and what they mean; reebeat derives motion, timing and every artifact, reproducibly, rebuilding only what an edit changes.*
- Three layers **(lead proposal, accepted)**: (1) the Model is a statechart plus FRP/SMIL time, and may contain cycles (interactive loops, repeats); (2) each artifact's Plan unrolls it (a linear timeline for video, steps for a deck, a navigable graph for a website); (3) the Build is an incremental DAG with dynamic dependencies, early cutoff and content-addressed persistent traces (Build Systems à la Carte, Mokhov, Mitchell & Peyton Jones, ICFP 2018). "DAG" applies to the build graph only.
- Honest novelty claim **(lead proposal, accepted)**: the parts are prior art (statecharts, SMIL, FRP, build systems, Effect, XState); the combination applied to multimedia is new. The build engine may be designed generically, but it is claimed only for multimedia until proven elsewhere.
- React's core (reconciler and scheduler) was considered and rejected as the compiler core (no whole-timeline planning, wall-clock scheduler, sibling-scoped keys, one host tree, in-process incrementality, no audio). It is kept as a possible render engine; JSX is kept as a possible authoring importer.
- Interaction tools act on produced artifacts; authoring tools act on creational formats. Static artifacts realise interactions at build time; dynamic artifacts realise them at view time.

## Fountain: source and artifact (2026-10-29)

- Operator (dictated; "Mountain" read as Fountain): it can likely be a source and an artifact. Fountain is both an importer (a screenplay becomes a story) and an artifact renderer (a story becomes a screenplay). It is not the persistent IR; JSON stays the IR. This refines the line about Fountain as "likely an artifact format".

## Consequential decisions, answered from the triage questionnaire (2026-10-29)

Each line is the operator's pick for one decision; ids refer to `questions.json` and `answers-2026-10-29.md` in this directory. "(rec)" means the pick equals the triage recommendation.

- Name: keep `reebeat` (two e's) for now, and run the clearance check first (report: `name-clearance-2026-10-29.md`). The operator's view: different fields (music vs multimedia generation) likely mean no conflict; the check tests that by registered classes.
- org-D1: confirm as written; anyone may host the open compiler under Apache-2.0 (rec).
- agent-protocol: tools are declared once in a protocol-neutral way; MCP is the first adapter (rec).
- ffmpeg: keep libx264 and never bundle ffmpeg (rec). Operator note: for now; in future support multiple encoders behind an adapter.
- org-D5: validate demand first, then design tiers; no pricing or billing code before evidence (rec).
- org-D6: keep copies of the lifecycle toolchain and add a drift test (rec).
- reproducible: bytes for data artifacts; identical decoded frames and audio for video (rec).
- reebeat-D3: enforce DCO sign-off now; trademark policy after the name is cleared (rec).
- reebeat-D4: element ids are story-global as a rule and a lint; adjacent-Scene motion until spec 0005 (rec).
- reebeat-D5: keep Fountain's own transition line; the IR carries each Scene's incoming transition explicitly (rec).
- reebeat-D6: the story IR is public and versioned; the timeline IR is an unstable build artifact; flicks stay (rec).
- reebeat-D7: the extension ADR-0000 is adopted in stages; open points are tagged unstable (rec).
- reebeat-D8: one interaction declaration; an artifact that cannot realise it fails at plan time for that output (rec). Operator note: a flag may bypass this for a specific output, so the drift is silent but explicit.
- reebeat-D9: the decided incremental build engine, built in steps (rec).
- reebeat-D11: Linux with devenv only (rec). Operator note: for now.
- reebeat-D12: organisation-level conduct and security defaults in reebeat/.github, plus private vulnerability reporting per repository (rec).
- reebeat-D13: lint and deterministic --fix are open; hosted-AI fixes are paid (rec).
- reebeat-D14: measure demand with named pilot users and a waitlist, using one activation step (rec).
- reebeat-D15: word anchors use phrase ids declared once in a per-language phrase table (rec).
- reebeat-D16: narration, subtitles and notes stay one string; readable pace is repaired by extending the State hold (rec).
- studio-D1: studio is proprietary, all rights reserved, with a LICENSE file and third-party notices (rec).
- studio-D3: the free tier stores stories in browser private storage (OPFS) with import and export of IR JSON (rec). Operator note: also support the File System Access API natively where it exists.
- studio-D4: the preview is a hybrid with the Deck in an iframe, gated by byte-equal frames (F2) (rec).
- studio-D6: peer identity is server-issued and bound to an authenticated user (rec).
- studio-D7: agent permissions are action sets on resources, declared in code, with presets (rec).
- studio-D8: composite values merge atomically; the rest merge property-wise (rec).
- studio-D9: measure first: a small spike on the real edge before the sync room is built (rec).
- studio-D10: undo reverts one's own changes per peer (rec).
- studio-D11: studio states no narration timing rule; it shows reebeat's diagnostics (rec).
- studio-D12: hosted speech, alignment and translation are out of scope until demand shows (rec).
- flow-D1: publish `@reebeat/flow` pre-releases under the npm org; the repo stays `foldkit-flow`; if Foldkit adopts it, publish `@foldkit/flow` and deprecate (rec).
- flow-D2: the xyflow credit is visible by default; an application may hide it (rec).
- flow-D3: keep the exact `@xyflow/system` pin and bump it on purpose (rec).
- flow-D4: reebeat studio is an intended consumer of foldkit-flow, not a committed one (rec).
- flow-D5: the library reports outcomes; the app applies graph changes (rec).
- flow-D6: publish 0.x with keyboard connect documented as a gap; 1.0 waits for it (rec).
- flow-D7: ELK.js stays out of `packages/`; a private example may use it; add a licence scan (rec).
- pg-outbox: build a narrow client-neutral outbox core with thin Effect and pg adapters in its own repository, after a stage-0 gate (fix pg-txmode's `outbox.relay`, which is at-most-once as written; run Effect 4.1 `PersistedQueue` through the pg-txmode harness behind PgBouncer; if it passes and Effect would accept typed `claimLost` and a transaction-required offer upstream, use `PersistedQueue` instead). Research: `pg-outbox-research.md` (2026-10-29).
- Name after clearance (2026-10-29): the clearance check (`name-clearance-2026-10-29.md`) found no register hit for REEBEAT itself, but a registered EU mark REBEAT (classes 9, 35, 41, to 2034) and an active Norwegian registration FREEBEAT (classes 16, 28, 38, 41, 42). Operator decision: pause the first npm publish and get a Norwegian IP advisor's opinion first. Nothing is published until the advisor has answered; if the advisor flags a conflict, rename before any package exists. The name `reebeat` stays the working name meanwhile.
- Brand name preference (2026-10-29): after the brand research (`brand-research-2026-10-29.md`), the operator said Tsukuri (作り) is good. It is the preferred candidate to replace the working name `reebeat`, which has an EU REBEAT and a Norwegian FREEBEAT conflict. Not yet cleared: the Norwegian IP advisor must still opine on Tsukuri (and on Japan and Japanese-script marks); nothing is renamed, registered or published until the operator says how to proceed.
- Tsukuri sequencing (2026-10-29): advisor first. Prepare the advisor brief and a tested rename (script, checklist, dry run in scratch worktrees) for all four repositories; apply it only after the Norwegian IP advisor has answered on Tsukuri. No org, repo, package or domain is created, renamed or registered until then.
- Handles reserved (2026-10-29): the operator reserved the npm organisation (believed `@tsukuri`) and the GitHub organisation `tsukurihq` ("claimed for now"). The GitHub user `tsukuri` is an empty account from 2011 and `tsukuri-dev` is an active user, so `tsukurihq` is the org name. Nothing else is created, renamed or published; the advisor still has to clear Tsukuri first.
- GitHub org handle (2026-10-29): the operator deleted the empty `tsukurihq` org; GitHub reserves a deleted org's name for 90 days (docs.github.com, 'Deleting an organization account'), so `tsukurihq` is unavailable until about 2027-01-27. The `reebeat` org stays; its display name is now 'Tsukuri'. The product-name rename stays advisor-gated. Candidate handles free on 2026-10-29: tsukuri-build, tsukuri-hq, tsukuri-io, tsukuri-app, tsukuri-studio, tsukurilabs, tsukuri-labs. When the rename happens, rename the org (do not delete any org first).
- Decisions of 2026-10-30 (operator): GitHub organisation handle `tsukuri-labs` (rename the organisation, never delete it). Publish `@tsukuri/*` now without waiting for the Norwegian IP advisor (supersedes the sequencing of line 115; the npm organisation `tsukuri` is owned by the operator, checked with `npm org ls`: owner). The Hyperdrive probe may use the operator's Alchemy credentials. The standard and config triage groups are confirmed in bulk and the 34 records-only elements are ratified. The recommendations on branch deletion (`scratch/f6-red`), the edit guard (`--no-verify`) and the ADR-0000 citations are accepted. Homelab rebuild and coursework are deferred.
- Bulk decisions of 2026-10-30 (operator): D1 separate npm orgs `pg-txmode` and `pg-outbox` (both already owned by phibkro per `npm org ls`), publish pg-txmode first, then pg-outbox replaces its submodule with a normal dependency. D2 verify Hyperdrive with a throwaway Worker and a disposable Postgres through the Alchemy `cloudflare-development` profile, torn down afterwards. D3 wait for the Alchemy release after beta.84 and check upstream for a newer version (npm `latest` is still 2.0.0-beta.84 on 2026-10-30). D4 publish `@tsukuri/*` and skip the advisor; the operator accepts the trademark risk. D5 the `admin_grant` retention fix and spec 0016 sponsor measures come back with alternatives. D6 register `tsukuri.dev` when the project goes public; until then `tsukuri.phibkro.org` can be used.
- D5 answers (2026-10-30, operator): admin_grant retention fix = option B (delete grants on schedule, keep a minimal last-admin-end date on the person, updated under the Person lock before deletion; part of activity, merge, erasure and privacy declarations). Sponsor measures (spec 0016) = small initial set (distinct assistants placed, schools served, placements, by defined semester and department), closing snapshots where history must outlive source records, restricted school breakdown, suppression below five including differencing, unavailable sources marked not invented.
- Slack bot principal (2026-10-30, operator): both. The bot has its own system principal for system actions (scheduled and system posts) and acts as a client for the person's principal when it relays a person's command. This reconciles the earlier project memory (bot is a principal of the information system) with ADR 0013 (client acting for named principals): ADR 0013 lines 13-15 and 126-145 need an amendment, and the Slack-user link for humans stays explicit.
- Stay on Cloudflare (2026-10-30, operator): no move to Vercel; a Vercel Alchemy binding would be hand-rolled unless one exists. Cloudflare Workers Analytics Engine for site analytics is deferred.
- Domain (2026-10-30, operator): `tsukuri.dev` is registered and managed in Cloudflare (supersedes the D6 wait and the interim `tsukuri.phibkro.org`). Nothing in the repositories points at it yet; the rename mapping's `DOMAIN` placeholder is already `tsukuri.dev`.
