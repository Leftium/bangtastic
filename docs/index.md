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

Multiple triggers often point to the same effective URL in DDG bang.js data.

Grouping triggers together:
- Reduces the data/file size
- Makes it easier to see related triggers

By convention, the shortest trigger is 'canonical' and listed first, followed by the most descriptive/nmemonic triggers (usually the longest).

#### `u` is a map of urls

Target URLs are normalized in bangtastic.json:
- `https://` protocol removed
- `www.` removed
- If either are required, the `http://` protocol may be explicitly included to override normalization.
- TODO: support other protocols?

Using a map allows the target url to change based on the type of input:
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

Access to individual terms in a search query enables:
- bangs for forms that have multiple input fields
- bangs whose URLs take extra parameters
  -  `site:` in a site search
  -  target/source languages on a translation page

### Cascading

Bangtasic files may extend other bangtastic files.

This is useful for adding onto or amending other bangtastic files.

If the bang does not exist in the parent file, the bang is simply added.

If the bang already exists in the parent file, the child file's data is merged into the parent file's data on a field-by-field basis.

### Scopes

Bangtastic bangs may be scoped. The concept is very similar to [NPM scopes](https://docs.npmjs.com/about-scopes).

Scopes are useful for reusing bang triggers for different purposes/users:

- `@kagi!images` uses `https://kagi.com/images?q={s}`
- `@google!images` uses `https://www.google.com/search?q={s}&tbm=isch`
- `@ddg!images` uses `https://duckduckgo.com/?q={s}&ia=images&iax=images`
- `@leftium!images` uses the custom URL configured by user leftium
- `!images` will use the default scope, which can be set by the user.

*Note:* Kagi "internal bangs" are simply bangs in the @kagi scope.

### Group Bangs

Group bangs have two purposes:
- Group related bangs together
- Enable launching multiple bangs simultaneously.

So group bangs constist of:
- Name
- Trigger(s)
- List of member bangs (triggers)
    - If a trigger ends in `*`, the bang is included in the group, but excluded from simultaneous launch.






