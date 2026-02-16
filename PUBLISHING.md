# Publishing (`@justlab/create-saas-stack`)

This repo must publish under the **`@justlab` npm org scope**, because the unscoped package name `create-saas-stack` is already owned by another publisher.

## Package identity

- npm package name: `@justlab/create-saas-stack`
- recommended command for users:
  - `npm create @justlab/saas-stack@latest my-app`
  - `npx @justlab/create-saas-stack@latest my-app`

## One-time setup

1. Ensure you are an npm org owner/member for `@justlab` with publish rights.
2. Create an npm automation token.
3. Add it to GitHub repository secrets as `NPM_TOKEN`.

## Release flow (tag-driven auto-publish)

1. Update version:
   - `npm version patch` (or `minor` / `major`)
2. Push commit and tag:
   - `git push`
   - `git push --tags`
3. GitHub Actions workflow `.github/workflows/publish-npm.yml` runs automatically on tags matching `v*`.

## Built-in guards in CI

The publish workflow will fail if:

- Git tag version does not equal `package.json` version.
- package name is not scoped to `@justlab`.
- lint/typecheck/test fails.

## Notes

- `npm publish --access public --provenance` is used by CI.
- The published package includes `src`, `template`, `LICENSE`, and `README.md` according to `package.json` `files` allowlist.
