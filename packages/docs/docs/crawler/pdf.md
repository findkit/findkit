
# PDF Parsing

You can enable PDF file crawling by setting [`crawl_pdfs`](/toml#crawl_pdfs)
target option to true in the findkit.toml file.

Any page with a content type of `application/pdf` will be parsed as a PDF. If [`walk_links`](/toml#walk_links) is disabled
the crawler will still walk any links with a pathname ending with `.pdf` in
order to find the PDF files as they are commonly not listed in sitemaps.


A `pdf` tag is automatically added to all parsed PDF files.
## Title

PDF title is read from `"content-disposition"` header. If this header is not available title is parsed from url pathname. `/path/to/my-awesome-pdf.pdf` --> `my-awesome-pdf`
## Language

The language is taken from the `Content-Language` response header if present,
otherwise language detection tools are used to automatically detect the
language from the PDF content.

## Limits

By default only the first 50 pages are read from the PDF files but the page
range can be customized by adding a response header `x-findkit-pdf-page-range:
[start]-[end]`. For example in order to take first 100 pages respond with
`x-findkit-pdf-page-range: 1-100`.

The maximum PDF file size is 10 MiB. If the file is bigger the crawler will
just ignore the file completely. Also our index only indexes roughly the first
100kb of the parsed text. The PDF parsing is provided as best effort basis. Any
PDF might be skipped if it is determined to be too complex to parse.
