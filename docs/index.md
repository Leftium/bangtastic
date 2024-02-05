# Bangtastic

An alternative search box designed around search bangs.

- Currently in the research & design phase.
- Browse bangtastic.js data: https://bangtastic.vercel.app/
- Browse bang.js merged data: https://bangtastic.vercel.app/sources

## Bang.js file format

DuckDuckGo stores bangs as a list of JSON objects following this format:

- `s` summary/description
- `t` trigger
- `u` target url
- `d` domain
- `r` ranking
- `c` main category
- `sc` sub-category

```
[
    {
        s: "Stack Overflow",
        t: "so",
        u: "http://stackoverflow.com/search?q={{{s}}}"
        d: "stackoverflow.com",
        r: 665,
        c: "Tech",
        sc: "Programming",
    }
    // ...
]
```

*Source:* https://webapps.stackexchange.com/a/162253/1530


## Bangtastic file format

The bangtastic file format extends the DDG bang.js format.

### Major changes

#### `t` is a list of triggers

#### `u` is a map of urls

This allows the target url to change based on the type of input:
- `u.s` is required. (Search terms)
- `u.e` defaults to the base path of `u.s` (Empty: no search terms.)
- Other input types are optional and checked first:
  - `u.u` URL
  - `u.en` (Any two-letter [ISO language code](https://www.wikiwand.com/en/List_of_ISO_639_language_codes)
  - `u.n` number
  - `u.d` date

Example:
```
{
    u: {
        // Search terms: default to EN->KO translation
        s: 'https://papago.naver.com/?sk=en&tk=ko&hn=0&st={s}'

        // Empty (no search terms): Go to root page. 
        e: 'https://papago.naver.com/'

        // URL input: use URL that translates websites.
        u: 'https://papago.naver.net/website?locale=en&source=auto&target=en&url={s}',

        // Korean text input: use URL for KO->EN translation.
        ko: 'https://papago.naver.com/?sk=ko&tk=en&hn=0&st={s}' 
    }
}
```

#### `{{{s}}}` template syntax has been changed

- Shortened to `{s}`
- `{s1}` ... `{s9}` gets individual terms from the query split on whitespace (quoted text is treated as a single term)
- `{s2:}` [slice notation](https://github.com/tc39/proposal-slice-notation) gets the remaining query after omitting the first 2 terms



