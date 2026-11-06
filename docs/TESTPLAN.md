# Test plan

Runs: `./tools/check_all.sh`. All checks must pass.

## Unit (rules)
% 1RM table, RPE to RIR and back, adaptation per rep range, tempo and TUT, deload sets, bodyweight totals, block + extra kg, old method and phase names, rest per phase, weekdays to Training 1/2, Stijn's warm-up rule (6 or fewer reps and 7 or more), no warm-up for C-series, slots per schema.

## End to end
| Scenario | What is checked |
|---|---|
| Home | clients listed, no errors |
| Every tab on desktop, iPad landscape, iPad portrait, phone | renders, no script errors, no sideways scroll; touch targets under 40 px are counted for the UX review |
| Planning | Int 25 present, old phase name not shown |
| Log a training on iPad | plan copied, reps and RPE in, saved as session, client stats updated, still there after reload |
| Read-only viewer | notice, start disabled, nothing written |
| No database | clear message |
| Write failure | user is told, draft stays on screen |
| Coach changes the schema while the client logs | typed reps are kept |
| Dark mode | renders |

## UX (permanent, see docs/UX-STANDARDS.md)
`test/ux_audit.py` renders 9 tabs on 4 devices in light and dark (72 screens) and measures: sideways scroll, text contrast with transparent layers blended, labels, focus ring (MUST, blocking); touch targets 44 px, input text 16 px, text 12 px, one primary button (SHOULD, reported). `tools/lint_ux.py` checks the source.
