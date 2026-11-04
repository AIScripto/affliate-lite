# PRF-002 measurement (2026-10-14)

Setup: throwaway Postgres (Docker, 127.0.0.1 only), the real backend (master 88d1aee), admin token, curl on the same machine.
Data: 2,029 employees, 68,947 assessments, 47,015 competency scores, 1 department, 26 competencies, 285 technologies.
Only the current period holds data (older periods are locked and cannot be written), so yoy-growth is understated.

| Report | Time (median of 3) | Response size |
|---|---|---|
| promotion-readiness | 0.42 s | 0.97 MB |
| competency-scores | 0.36 s | 0.73 MB |
| competency-matrix | 0.39 s | 4.4 MB |
| gap-matrix | 0.40 s | 8.2 MB |
| skills-summary | 0.35 s | 0.92 MB |
| executive-summary | 0.38 s | 1 KB |
| yoy-growth | 1.47 s | 0.38 MB |
| assessment-history (paginated) | 0.05 s | 6 KB |

Load: 5 parallel promotion-readiness: slowest 0.89 s. 10 parallel: slowest 1.47 s. /ready answered in 16 ms during 6 parallel gap-matrix calls. Backend memory 615 MB after the run.

Reading: acceptable at today's size. The size of two responses (gap-matrix 8.2 MB, competency-matrix 4.4 MB) and yoy-growth time are what grow with headcount.
No code changed. Scoring files untouched.
