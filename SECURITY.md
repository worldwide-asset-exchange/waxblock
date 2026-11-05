# Security policy

Please do **not** open a public GitHub issue for a security problem.

Report it privately with GitHub's
[private vulnerability reporting](https://github.com/worldwide-asset-exchange/waxblock/security/advisories/new).
Include the affected component (`apps/web` or `apps/api`), the version, steps to reproduce and the impact.

We acknowledge reports within 3 working days and keep you informed until the issue is fixed.

Scope notes:

- The API is read-only, unauthenticated and holds no keys or user data.
- The web wallet signs transactions only in the user's own wallet (My Cloud Wallet, Anchor). Issues that could
  make a user sign something they did not intend are in scope and high priority.
