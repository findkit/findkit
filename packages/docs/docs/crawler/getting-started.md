# Getting Started (CLI)

:::tip
You can also setup the crawler on the Hub directly too
:::

Create a Findkit Hub account and organization at
[hub.findkit.com](https://hub.findkit.com/) and install our CLI

```
npm install --global findkit
```

Authenticate the CLI with the Hub

```
findkit authenticate
```

This will generate the required access keys and instructs you how to add them to
the Hub.

## Initialize Configuration

Initialize a Findkit project. You can do this within your existing website project.

```
findkit init
```

It will create a `findkit.toml` file for you which is meant to be versioned
within your website sources. Read through the file comments and update the
options as needed but do not setup the crawl schedules yet. We'll setup them
later.

The file looks like this:

```toml
## Unique id of the project within your organization
id = "example"

name = "Example Project"
description = "Project description"

## Uncomment to enable automatic scheduled crawling
#schedule_full_crawl = "weekly"

[[targets]]
host = "www.example.com"
use_sitemap = true

## The page content is automatically extracted but you can
## be also use explicit content selectors. https://findk.it/selectors
#content_selector = ".content"

## You can add multiple domains to single project
#[[targets]]
#host = "www.another.example"
#use_sitemap = true
```

## Deploy and Test

Once ready deploy the project:

```
findkit deploy
```

:::info
Use must run the deploy every time you make changes to the .toml file
:::

This creates the project to the Hub but does not run the crawls yet because we didn't
enable the crawl schedules but now we can manually crawl a single page to try things
out:

```
findkit crawl start --manual 'https://www.example.com/page'
```

After few seconds you can search for the page

```
findkit search 'keyword'
```

and it should return the crawled url if the `keyword` appeared on the page.
If it did not you can inspect the page status and crawled keywords in the index
with

```
findkit inspect 'https://www.example.com/page'
```

When you update the `findkit.toml` file you must run `findkit deploy` again.

:::tip
You can also inspect the index using the "Inspect Index" feature on the Hub.
:::

## Full Crawl

You should try indexing few different pages manually like this. Once everything
seems good you can start a full crawl on your site.

```
findkit crawl start
```

You can view the crawl status with

```
findkit status
```

and view the crawl logs with

```
findkit logs
```

When everything looks good you can enable the crawl schedule in the TOML file
and redeploy it so the search indices will be kept up to date with the site
content.

For real-life example you checkout this documentation site's [`findkit.toml`
on
Github](https://github.com/findkit/findkit/blob/main/packages/ui/findkit.toml).

Now you can [setup the UI for your website](/ui/setup).

## Testing changes

You can test the `findkit.toml` changes without deploying them with the `findkit crawl test` command.

```
findkit crawl test 'https://www.example.com/page'
```

This will run the crawler on the specified page using the local `findkit.toml`
and it will print the crawler results.

:::info
Especially the first test run might take a while as the backend warms up.
:::

One you are happy with the results you can deploy the changes with `findkit deploy` and the following crawls will use the changes.
