# Languages

When crawling and indexing pages the Findkit Crawler uses the page's
language to better understand the text on the page: A language aware stemmer is
used to convert the words to the root form. For example "crawling" to "crawl".
This allows users search for text in any form and it will be always matched
using the root form.

The language is picked from these sources in this order

- Meta Tag [`language`](/crawler/meta-tag#language) field
- `<html lang>` attribute
- `Content-Language` response header
- Automatic detection using a natural language detection algorithm

the first one found is used.

Only the first two letters of the language string is used by Findkit. Eg. if longer
code is given it will be sliced to first two letters. Eg. `en_US` => `en`.

:::note
If you are looking for UI translations, see the UI Library [translations](/ui/translations) docs.
:::

## Supported Languages

Following languages are supported. If your language is not listed here, please
contact us as we are in process of adding more languages.

- Chinese (`zh`)
- English (`en`)
- Finnish (`fi`)
- French (`fr`)
- German (`de`)
- Italian (`it`)
- Russian (`ru`)
- Spanish (`es`)
- Swedish (`se`)
