# Findkit UI package

See documentation at <https://docs.findkit.com/ui/setup>

# Contributing

Get [pnpm](https://pnpm.io/installation) 7 and clone the repository

```
git clone https://github.com/findkit/findkit.git
```

Install node modules

```
cd findkit
pnpm install
```

## Unit tests with Vitest

Run

```
pnpm vitest
```

## Manual testing

Start development server and build watcher with

```
pnpm dev
```

This will serve the files from the [e2e][./e2e] directly.

Try <http://localhost:28104/single-group?fdk_q=valu> for example.

## E2E Tests with Playwright

While the development server is running you can execute the Playwright tests
with:

```
pnpm playwright-test --headed
```

## Updating the visual snapshots

Run

```
pnpm playwright-update
```

and review and commit the changes.

Github Actions runs Linux so you need to run the update in the
[test.yml](/.github/workflows/test.yml) workflow. It will push the updates back
to git automatically. Use this only from PRs and remember to disable it when
done.

## Manual packaging

When you want test the changes in your project you must build the package and
install it to your project.

Build everything first

```
pnpm build
```

and pack to `.tgz` file

```
pnpm pack
```

This will create a file like `findkit-ui-0.0.1.tgz` which can be installed to
your project. When installing it you should use the package manager your project
is using.

```
cd /path/to/project
npm install /path/to/findkit/clone/findkit-ui-0.0.1.tgz
```

Because this is a local build you must disable the CDN usage:
<https://docs.findkit.com/ui/advanced/disable-cdn>
