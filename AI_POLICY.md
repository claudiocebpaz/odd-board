# AI-Assisted Contribution Policy

AI-assisted contributions are permitted. odd-board is itself a tool for watching AI agents work, and much of it is written with them. The human contributor must understand, review, validate, and take full responsibility for everything they submit.

## Human Responsibility

The human contributor remains fully responsible for:

- The correctness and ongoing maintenance of the complete submission.
- Reviewing and validating every change, claim, and test result.
- Ensuring appropriate licensing and confidence in the provenance of submitted material, including any feature document added as a fixture.
- Explaining and defending the design, implementation, and tradeoffs during review.

AI assistance does not transfer authorship, accountability, or responsibility away from the contributor.

## Disclosure

Disclose material AI assistance used to produce or substantively review any part of a contribution: code, tests, documentation, fixtures, or analysis.

For material assistance, the pull request must state:

1. The tool or model, if known.
2. The material scope of the assistance.
3. The verification the contributor performed.

Raw prompts and conversation logs are not required. Trivial formatting, spelling corrections, autocomplete, and search do not need disclosure.

## Attribution

Commits may carry an `Assisted-by: <tool or model>` trailer. The pull request declaration is sufficient on its own.

## Submission Quality

Review is based on observable quality, not on whether something looks AI-generated. Before proposing a fix, identify the underlying cause and fix that, with the smallest change that restores the rule it broke.

Unacceptable:

- Submitting output you have not reviewed.
- Reporting test results that did not occur, or inventing APIs, paths, behavior, or evidence.
- Fabricating ODD feature documents and presenting them as real gentle-ai output. Simulated documents are welcome when they are labeled as simulated.
- Masking a symptom instead of fixing its cause.
- Adding unnecessary abstractions, runtime dependencies, or changes outside the issue's scope.
- Being unable to explain the change or its consequences.

## Enforcement

Maintainers enforce this policy through review judgment. There is no automated AI detection.
