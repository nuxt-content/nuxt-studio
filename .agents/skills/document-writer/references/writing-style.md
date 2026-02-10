# Writing Style

Sentence structure, voice, tone, and paragraph patterns for Nuxt documentation.

## Sentence Patterns

### Subject-First Declarative (60%)

Place subject first, verb follows. Clear and direct.

```
The useFetch composable handles data fetching automatically.
Nuxt provides a powerful auto-import system.
This option controls module behavior during development.
```

### Imperative Instructions (25%)

Direct commands for actions. Implied "you" subject.

```
Add the following to nuxt.config.ts.
Create a new file in server/api.
Run the development server to see changes.
```

### Contextual Openers (15%)

Context before main clause. For conditionals and prerequisites.

```
When using authentication, configure the session handler.
During SSR, the composable fetches data before hydration.
After installing the module, restart the server.
```

## Voice

### Active Voice (85%)

Subject performs action. Prefer this.

| Active (use)                    | Passive (avoid)                       |
| ------------------------------- | ------------------------------------- |
| The module creates a connection | A connection is created by the module |
| You can override defaults       | Defaults can be overridden            |
| Nuxt handles routing            | Routing is handled by Nuxt            |

### When Passive is OK (15%)

- Actor unknown: "The file is loaded during startup."
- Object more important: "Data is cached for 5 minutes."
- System behavior: "Routes are generated from pages directory."

## Tense

**Present (90%)**: Instructions and behavior
**Future (5%)**: Consequences ("This will create an endpoint")
**Past (5%)**: Changelogs only

## Modal Verbs

| Verb     | Meaning           | Example                          |
| -------- | ----------------- | -------------------------------- |
| `can`    | Optional (40%)    | "You can customize colors."      |
| `should` | Recommended (30%) | "You should validate input."     |
| `may`    | Possibility (20%) | "This may cause issues."         |
| `must`   | Required (10%)    | "You must install dependencies." |

Avoid weak modals: `might`, `could`, `would`

## Direct Address

**Guides/tutorials**: Use "you" (70% of content)
**API references**: Neutral voice, no "you"

Stay consistent within sections.

## Paragraphs

**Length**: 2-4 sentences max
**Structure**: Topic sentence first, then supporting details

```
Route middleware runs before navigation.
Use it to check authentication or redirect users.
Define middleware in the middleware directory.
```

## Opening Sentences

### Page Openings

Define what it is, its purpose, key benefits:

```
Server routes create API endpoints in your Nuxt app.
They run on the server with access to databases and external services.
```

Avoid: "This page describes...", "In this guide...", "Let's explore..."

### Section Openings

Introduce topic and why it matters:

```
## Configuration

The module accepts several options that control its behavior.
```

## Tone by Content Type

| Type            | Tone                         |
| --------------- | ---------------------------- |
| Getting Started | Welcoming, encouraging       |
| Guides          | Instructional, supportive    |
| API Reference   | Precise, neutral             |
| Troubleshooting | Empathetic, solution-focused |

## Word Choice

| Avoid           | Use         |
| --------------- | ----------- |
| utilize         | use         |
| implement       | add, create |
| leverage        | use         |
| in order to     | to          |
| due to the fact | because     |

## Common Mistakes

- Starting with "It" or "This" (unclear antecedent)
- Stacking prepositions ("the value of the property of the config")
- Overusing "Note that" (just state the fact)
- Burying important info at end of long sentences
