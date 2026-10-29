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
