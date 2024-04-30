# Languages

When crawling and indexing pages the Findkit Crawler uses the page's
language to better understand the text on the page: A language aware stemmer is
used to convert the words to a stem. For example "crawling" to "crawl".
This allows users search for text in any form and it will be matched
using the stem.

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

Following languages have stemming support:

- Arabic (`ar`)
- Armenian (`hy`)
- Basque (`eu`)
- Bengali (`bn`)
- Bulgarian (`bg`)
- Catalan (`ca`)
- Chinese (`zh`)
- Czech (`cs`)
- Danish (`da`)
- Dutch (`nl`)
- English (`en`)
- Estonian (`et`)
- Finnish (`fi`)
- French (`fr`)
- Galician (`gl`)
- German (`de`)
- Greek (`el`)
- Hindi (`hi`)
- Hungarian (`hu`)
- Indonesian (`id`)
- Irish (`ga`)
- Italian (`it`)
- Latvian (`lv`)
- Lithuanian (`lt`)
- Norwegian (`no`)
- Persian (`fa`)
- Portuguese (`pt`)
- Romanian (`ro`)
- Russian (`ru`)
- Spanish (`es`)
- Swedish (`sv`)
- Thai (`th`)
- Turkish (`tr`)
- Ukrainian (`uk`)

:::tip
Non-supported
languages can be indexed as well just without the stemming support.
:::
