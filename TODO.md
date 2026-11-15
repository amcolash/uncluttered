# TODO

## Data

- [ ] Investigate if less generated data can be used for similar accuracy (50 examples generated per category?)
- [ ] Less aggressive ML retrain - maybe stop it since it already retrains after a few categorizations
- [ ] Sync stars in gmail -> important in db (do not sync back?)
- [ ] Get batch archive/delete rates from db data

## Server

- [ ] Investigate ML perf on NAS, possibly train on laptop and deploy model to NAS if too slow
- [ ] On startup, ensure all emails have a still valid category, otherwise reclassify them + reset validated
- [ ] Retain ~5 DB backups in case something goes wrong. Do not remove db backups at all if there is an issue reading
- [x] Handle oauth flow more gracefully

## UI

- [x] Add "important" filter (category-ish) to inbox page
- [ ] Keyboard shortcuts for various operations (in batch and modal for single email)
- [ ] Keyboard shortcut hints (like on steamos for each button)
- [ ] Swipe actions for mobile (archive, important, delete)
- [ ] Consider ways to improve suggestions from the UI side
- [ ] Checkboxes for batch
- [ ] Provide a batch suggestion in ui (magic wand). Needs 20+ with that status, more than 60%
- [ ] Important emails will show all emails, but with a small section header per category
- [ ] When category disappears, move down to next instead of to top
- [x] Oauth handling
