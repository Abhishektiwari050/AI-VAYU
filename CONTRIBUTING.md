# ✈️ Contributing to Project VAYU

Thank you for your interest in contributing to **Project VAYU**! We welcome open-source contributions from aviators, software engineers, and GIS specialists worldwide.

---

## 📜 Code of Conduct & Core Directives

1. **Safety & Correctness First**: Prioritize data integrity, type correctness, and maintainability over speed.
2. **Deterministic Rules Over Magic**: Never replace deterministic ICAO field parsers or Q-code lookups with unconstrained LLM prompts.
3. **Verbatim Text Preservation**: Never truncate or alter raw ASCII NOTAM strings.

---

## 🛠️ Local Development Setup

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/AI-VAYU.git
cd AI-VAYU
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 📝 Git Commit Conventions

We follow **Conventional Commits** for clean commit history:

- `feat:` New feature, ML model, or GIS layer (e.g., `feat: Add A350 aircraft envelope profile to weatherPredictor`)
- `fix:` Bug fix in parser, date engine, or UI (e.g., `fix: Handle FAA slash timestamp format in temporalCheck`)
- `refactor:` Code refactoring without changing behavior (e.g., `refactor: Modularize Redis cache lock`)
- `docs:` Documentation, README, or API spec updates (e.g., `docs: Add OpenAPI 3.0 specification`)
- `test:` Unit test suite addition or update (e.g., `test: Add Q-code QMRLC hazard assertion`)

---

## 🧪 Pull Request Checklist

Before submitting a Pull Request:
1. Run `npm run lint` (`tsc --noEmit`) to verify **0 errors**.
2. Run `npm run build` to verify production build compilation.
3. Run `npx tsx scratch/test_ml_pipeline.ts` to verify pipeline unit tests.
4. Ensure your PR description follows [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
