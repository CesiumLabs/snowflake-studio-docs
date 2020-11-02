const sources = require('../sources.json')

const Fuse = require('fuse.js')
const fetch = require('node-fetch')

const DocBase = require('./DocBase')
const DocClass = require('./DocClass')
const DocTypedef = require('./DocTypedef')
const DocInterface = require('./DocInterface')

const docCache = new Map()

const Canvacord = 'canvacord'
const SoundCloud = 'soundcloud-scraper'
const QuickMongo = 'quickmongo'
const Eco = 'quick.eco'

function dissectURL (url) {
  const parts = url.slice(34).split('/')
  return [parts[0], parts[1], parts[3].slice(0, -5)]
}

class Doc extends DocBase {
  constructor (url, docs) {
    super(docs)
    this.url = url;
    [this.project, this.repo, this.branch] = dissectURL(url)

    this.adoptAll(docs.classes, DocClass)
    this.adoptAll(docs.typedefs, DocTypedef)
    this.adoptAll(docs.interfaces, DocInterface)

    this.fuse = new Fuse(this.toFuseFormat(), {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 80,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name', 'id'],
      id: 'id'
    })
  }

  get repoURL () {
    return `https://github.com/${this.project}/${this.repo}/blob/${this.branch}`
  }

  get baseURL () {
    switch (this.repo) {
      case Canvacord: return 'https://canvacord.js.org'
      case SoundCloud: return 'https://soundcloud-scraper.js.org'
      case QuickMongo: return 'https://quickmongo.js.org'
      case Eco: return 'https://eco.js.org'
      default: return null
    }
  }

  get baseDocsURL () {
    if (!this.baseURL) return null
    const repo = [Canvacord, SoundCloud, QuickMongo].includes(this.repo) ? 'main' : this.repo;
    return `${this.baseURL}/#/docs/${repo}/${this.branch}`
  }

  get icon () {
    if (!this.baseURL) return null
    return `${this.baseURL}/favicon.ico`
  }

  get color () {
    return 0x4d5e94;
    // switch (this.repo) {
    //   case Canvacord: return 0xff7272
    //   case SoundCloud: return 0xd77112
    //   default: return null
    // }
  }

  get (...terms) {
    const exclude = Array.isArray(terms[0]) ? terms.shift() : []
    terms = terms
      .filter(term => term)
      .map(term => term.toLowerCase())

    let elem = this.findChild(terms.shift())
    if (!elem || !terms.length) return elem || null

    while (terms.length) {
      const term = terms.shift()
      const child = elem.findChild(term, exclude)

      if (!child) return null
      elem = terms.length && child.typeElement ? child.typeElement : child
    }

    return elem
  }

  search (query, { excludePrivateElements } = {}) {
    const result = this.fuse.search(query)
    if (!result.length) return null

    const filtered = []

    while (result.length > 0 && filtered.length < 10) {
      const element = this.get(filtered, ...result.shift().split('#'))
      if (excludePrivateElements && element.access === 'private') continue
      filtered.push(element)
    }

    return filtered
  }

  resolveEmbed (query, options = {}) {
    const element = this.get(...query.split(/\.|#/))
    if (element) return element.embed(options)

    const searchResults = this.search(query, options)
    if (!searchResults) {
      const baseEmbed = this.baseEmbed()
      baseEmbed.title = 'Search results:'
      baseEmbed.description = 'No result found!'
      baseEmbed.image = {
        url: 'https://raw.githubusercontent.com/DevSnowflake/canvacord-docs/master/src/assets/awesome.png',
      }
      return baseEmbed
    };

    const embed = this.baseEmbed()
    embed.title = 'Search results:'
    embed.description = searchResults.map(el => {
      const prefix = el.embedPrefix
      return `${prefix ? `${prefix} ` : ''}**${el.link}**`
    }).join('\n')
    return embed
  }

  toFuseFormat () {
    const parents = Array.from(this.children.values())

    const children = parents
      .map(parent => Array.from(parent.children.values()))
      .reduce((a, b) => a.concat(b))

    const formattedParents = parents
      .map(({ name }) => ({ id: name, name }))
    const formattedChildren = children
      .map(({ name, parent }) => ({ id: `${parent.name}#${name}`, name }))

    return formattedParents.concat(formattedChildren)
  }

  toJSON () {
    const json = {}

    for (const key of ['classes', 'typedefs', 'interfaces']) {
      if (!this[key]) continue
      json[key] = this[key].map(item => item.toJSON())
    }

    return json
  }

  baseEmbed () {
    const title = {
      'canvacord': 'Canvacord Docs',
      'soundcloud': 'SoundCloud Docs',
      'quickmongo': 'QuickMongo Docs',
      'quick.eco': 'quick.eco Docs'
    }[this.repo] || this.repo

    return {
      color: this.color,
      author: {
        name: `${title} (${this.branch})`,
        url: this.baseDocsURL,
        icon_url: this.icon
      }
    }
  }

  formatType (types) {
    const typestring = types
      .map((text, index) => {
        if (/<|>|\*/.test(text)) {
          return text
            .split('')
            .map(char => `\\${char}`)
            .join('')
        }

        const typeElem = this.findChild(text.toLowerCase())
        const prependOr = index !== 0 && /\w|>/.test(types[index - 1]) && /\w/.test(text)

        return (prependOr ? '|' : '') + (typeElem ? typeElem.link : text)
      })
      .join('')

    return `**${typestring}**`
  }

  static getRepoURL (id) {
    const [name, branch] = id.split('/')
    const project = {
      canvacord: 'Canvacord',
      soundcloud: 'Soundcloud-Scraper',
      quickmongo: 'QuickMongo',
      eco: 'quick.eco'
    }[name]

    return `https://github.com/DevSnowflake/${project}/blob/${branch}/`
  }

  static sources () {
    return sources
  }

  static async fetch (sourceName, { force } = {}) {
    const url = sources[sourceName] || sourceName
    if (!force && docCache.has(url)) return docCache.get(url)

    try {
      const data = await fetch(url).then(res => res.json())
      const doc = new Doc(url, data)
      docCache.set(url, doc)
      return doc
    } catch (err) {
      throw new Error('invalid source name or URL.')
    }
  }
}

module.exports = Doc
