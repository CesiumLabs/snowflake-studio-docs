# snowflake-studio-docs

A parser and wrapper for the docs of **Snowflake Studio ❄** based on `discord.js-docs`.

# Example

```js
const Docs = require('snowflake-studio-docs')

Docs.fetch('canvacord')
  .then((doc) => {
    console.log(doc.resolveEmbed('rank'))
  })

```

# Available
- canvacord
- soundcloud
- quickmongo