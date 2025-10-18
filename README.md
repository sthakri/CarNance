# CarNance
See your financial future before you drive into it.
## CarNance API (Part 2 Backend)

Node 18+, Express, TypeScript (CommonJS). Source in `src`, build to `dist`.

### Install

```bash
cd CarNance
npm install
```

### Scripts

- `npm run dev`: Start dev server with ts-node-dev (PORT defaults to 8080)
- `npm run build`: TypeScript compile to `dist`
- `npm start`: Run compiled server from `dist`

### Environment

Optional `.env` at project root:

```bash
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
```

### Run

```bash
npm run dev
# or
npm run build && npm start
```

Server listens on `http://localhost:8080` by default.

### Endpoints
- Data source
  - Vehicle data fetched live from FuelEconomy.gov and NHTSA vPIC (best-effort), with fallback to local dataset in `data/toyota_models.json` when unavailable.

- GET `/health`
  - Response 200:
  ```json
  { "data": { "ok": true }, "error": null }
  ```

- POST `/api/calc`
  - Request JSON:
  ```json
  {
    "carPrice": 35000,
    "downPayment": 5000,
    "creditScore": 720,
    "loanMonths": 60,
    "leaseMonths": 36,
    "baseApr": 0.06
  }
  ```
  - Response 200:
  ```json
  {
    "data": { "buyMonthly": 0, "leaseMonthly": 0, "apr": 0 },
    "error": null
  }
  ```
  - Validation error 400:
  ```json
  { "data": null, "error": { "message": "Invalid request: ...", "status": 400 } }
  ```

- POST `/api/recommend`
  - Request JSON:
  ```json
  {
    "financials": {
      "monthlyIncome": 6000,
      "spouseIncome": 2000,
      "monthlyBudget": 700,
      "creditScore": 720,
      "downPayment": 5000,
      "goal": "eco"
    },
    "driving": {
      "avgMonthlyMileage": 900,
      "preferredType": "Hybrid",
      "size": "SUV",
      "loanTermMonths": 60
    }
  }
  ```
  - Response 200:
  ```json
  {
    "data": {
      "models": [
        { "name": "RAV4 Hybrid", "type": "Hybrid", "msrp": 32000, "monthlyEstimate": 0, "rationale": "..." }
      ]
    },
    "error": null
  }
  ```
  - Note: Models are sourced from live APIs when available; otherwise fallback to local data.

- POST `/api/plan`
  - Purpose: Combine recommendations and scenario projections into one response.
  - Request JSON:
  ```json
  {
    "financials": {
      "monthlyIncome": 4500,
      "creditScore": 710,
      "downPayment": 3000,
      "monthlyBudget": 450
    },
    "driving": {
      "avgMonthlyMileage": 1200,
      "preferredType": "Hybrid",
      "leaseTermMonths": 36,
      "loanTermMonths": 60
    }
  }
  ```
  - Response 200:
  ```json
  {
    "data": {
      "models": [],
      "chosen": { "name": "Prius", "type": "Hybrid", "msrp": 28000 },
      "scenarios": { "lease": [], "buy": [], "creditBoost": [] },
      "headline": { "buyMonthly": 0, "leaseMonthly": 0, "totalInterestBuy": 0 },
      "summary": "If you lease the Prius..."
    },
    "error": null
  }
  ```
  - AI narration: Uses Google Gemini if `GEMINI_API_KEY` is set; otherwise falls back to a non-AI summary prefixed with "DriveLens summary (fallback):".
  - Environment: set `GEMINI_API_KEY=<string>` in `.env`.

### cURL Tests

```bash
curl -s -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "financials": {
      "monthlyIncome": 6000,
      "creditScore": 720
    },
    "driving": {
      "avgMonthlyMileage": 900,
      "preferredType": "Hybrid",
      "loanTermMonths": 60
    }
  }'

curl -s -X POST http://localhost:8080/api/plan \
  -H "Content-Type: application/json" \
  -d '{
        "financials": {
          "monthlyIncome": 4500,
          "creditScore": 710,
          "downPayment": 3000,
          "monthlyBudget": 450
        },
        "driving": {
          "avgMonthlyMileage": 1200,
          "preferredType": "Hybrid",
          "leaseTermMonths": 36,
          "loanTermMonths": 60
        }
      }'
curl -i http://localhost:8080/health
curl -s -X POST http://localhost:8080/api/calc \
  -H "Content-Type: application/json" \
  -d '{
    "carPrice": 35000,
    "downPayment": 5000,
    "creditScore": 720,
    "loanMonths": 60,
    "leaseMonths": 36,
    "baseApr": 0.06
  }'

curl -s -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "financials": {"monthlyIncome": 6000, "spouseIncome": 2000, "monthlyBudget": 700, "creditScore": 720, "downPayment": 5000, "goal": "eco"},
      "driving": {"avgMonthlyMileage": 900, "preferredType": "Hybrid", "size": "SUV", "loanTermMonths": 60, "leaseTermMonths": 36}
    },
    "modelName": "Prius"
  }'

curl -s -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "financials": {"monthlyIncome": 6000, "creditScore": 690},
      "driving": {"avgMonthlyMileage": 1000, "preferredType": "Hybrid", "loanTermMonths": 60, "leaseTermMonths": 36}
    },
    "modelName": "RAV4 Hybrid"
  }'
curl -s -X POST http://localhost:8080/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "financials": {"monthlyIncome": 6000, "spouseIncome": 2000, "monthlyBudget": 700, "creditScore": 720, "downPayment": 5000, "goal": "eco"},
    "driving": {"avgMonthlyMileage": 900, "preferredType": "Hybrid", "size": "SUV", "loanTermMonths": 60}
  }'
```
