<!-- ⚠️ READ BEFORE SUBMITTING
  Every PR must be linked to an issue. See CONTRIBUTING.md for the workflow.
-->

## 🔗 Linked Issue

Closes #

<!-- Use Closes, Fixes or Resolves #<number> to close the issue on merge, or Refs #<number> for a non-closing link. -->

---

## 🏷️ PR Type

- [ ] `type:bug` — Bug fix (non-breaking change that fixes an issue)
- [ ] `type:feature` — New feature (non-breaking change that adds functionality)
- [ ] `type:docs` — Documentation only
- [ ] `type:refactor` — Code refactoring (no functional changes)
- [ ] `type:chore` — Build, CI, or tooling changes
- [ ] `type:breaking-change` — Breaking change (fix or feature that changes existing behavior)

---

## 📝 Summary

<!-- What this PR does and why. -->

---

## 📂 Changes

| File / Area | What Changed |
|-------------|-------------|
| `path/to/file` | Brief description |

---

## 🤖 AI Assistance

Select exactly one option.

- [ ] **None** — No material AI assistance was used.
- [ ] **Material assistance used** — Complete the fields below.

**Tool/model (if known):**

**Material scope:**

**Verification performed:**

See [AI_POLICY.md](https://github.com/claudiocebpaz/odd-board/blob/main/AI_POLICY.md).

---

## 🧪 Test Plan

```bash
npm test
node bin/odd-board.js --demo --json > /dev/null
```

- [ ] Tests pass (`npm test`)
- [ ] Demo builds a board (`node bin/odd-board.js --demo --json`)
- [ ] Manually checked the board in the browser (UI changes)

---

## ✅ Contributor Checklist

- [ ] PR is linked to an issue
- [ ] PR stays within about 400 changed lines, or explains why it cannot be split
- [ ] No runtime dependencies added
- [ ] odd-board still never writes to `odd/`
- [ ] Every parsing fix ships with a test using a real-looking document
- [ ] `README.md` and `CHANGELOG.md` (under Unreleased) updated if behavior changed
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] I understand, reviewed, and take responsibility for the complete submission

---

## 💬 Notes for Reviewers

<!-- Optional -->
