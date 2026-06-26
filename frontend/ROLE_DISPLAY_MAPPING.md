# Role Display Mapping

## What changed

- The frontend now displays the internal role `Pilote` / `Pilote de processus` as `Gestionnaire de processus`.
- A centralized mapping was added in [src/utils/roles.js](./src/utils/roles.js).
- User-facing labels were updated in the top bar, user management UI, profile settings, messaging panel, audit wording, and process-related screens.

## What did not change

- Backend role values
- Authentication and permissions
- Route guards
- API payload values and contracts
- Database or migrations

## How it works

- Internal values like `Pilote` and `Pilote de processus` are still kept for logic.
- The UI uses `getRoleDisplayLabel(role)` to render:

  - `Pilote` -> `Gestionnaire de processus`
  - `Pilote de processus` -> `Gestionnaire de processus`

- In role dropdowns, the submitted value remains the backend-compatible original value.
