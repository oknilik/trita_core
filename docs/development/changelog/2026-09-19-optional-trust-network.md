# Optional trust network in diagnostic programs

- Team Scan and Follow-up creation offer an opt-in trust network measurement, off by default. Selection is frozen in the campaign snapshot.
- Trust opens alongside the other questionnaires (after self-assessment in Team Scan); it is not a report dependency or readiness gate.
- Reports show current-round mutual-pair coverage, including an explicit empty-data state, on web and PDF. Follow-up retains current measured trust highlights without carrying forward baseline network data. Automatic longitudinal trust comparisons are disabled for program reports.
- Trust questionnaire honors explicit campaign links. Program peer submissions take the exclusive campaign lock before participant locks to avoid lock upgrades; legacy submissions retain shared locking.
- Regression coverage: default/opt-in snapshots, wizard payloads, concurrent trust submissions, empty-network report readiness and campaign-scoped Follow-up evidence.
