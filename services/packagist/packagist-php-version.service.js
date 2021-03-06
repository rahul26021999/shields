'use strict'

const Joi = require('@hapi/joi')
const { optionalUrl } = require('../validators')
const { NotFound } = require('..')
const {
  allVersionsSchema,
  BasePackagistService,
  customServerDocumentationFragment,
} = require('./packagist-base')

const queryParamSchema = Joi.object({
  server: optionalUrl,
}).required()

module.exports = class PackagistPhpVersion extends BasePackagistService {
  static get category() {
    return 'platform-support'
  }

  static get route() {
    return {
      base: 'packagist/php-v',
      pattern: ':user/:repo/:version?',
      queryParamSchema,
    }
  }

  static get examples() {
    return [
      {
        title: 'Packagist PHP Version Support',
        pattern: ':user/:repo',
        namedParams: {
          user: 'symfony',
          repo: 'symfony',
        },
        staticPreview: this.render({ php: '^7.1.3' }),
      },
      {
        title: 'Packagist PHP Version Support (specify version)',
        pattern: ':user/:repo/:version',
        namedParams: {
          user: 'symfony',
          repo: 'symfony',
          version: 'v2.8.0',
        },
        staticPreview: this.render({ php: '>=5.3.9' }),
      },
      {
        title: 'Packagist PHP Version Support (custom server)',
        pattern: ':user/:repo',
        namedParams: {
          user: 'symfony',
          repo: 'symfony',
        },
        queryParams: {
          server: 'https://packagist.org',
        },
        staticPreview: this.render({ php: '^7.1.3' }),
        documentation: customServerDocumentationFragment,
      },
    ]
  }

  static get defaultBadgeData() {
    return {
      label: 'php',
      color: 'blue',
    }
  }

  static render({ php }) {
    return {
      message: php,
    }
  }

  transform({ json, user, repo, version = '' }) {
    const packageVersion =
      version === ''
        ? this.getDefaultBranch(json, user, repo)
        : json.packages[this.getPackageName(user, repo)][version]

    if (!packageVersion) {
      throw new NotFound({ prettyMessage: 'invalid version' })
    }

    if (!packageVersion.require || !packageVersion.require.php) {
      throw new NotFound({ prettyMessage: 'version requirement not found' })
    }

    return { phpVersion: packageVersion.require.php }
  }

  async handle({ user, repo, version = '' }, { server }) {
    const allData = await this.fetch({
      user,
      repo,
      schema: allVersionsSchema,
      server,
    })
    const { phpVersion } = this.transform({
      json: allData,
      user,
      repo,
      version,
    })
    return this.constructor.render({ php: phpVersion })
  }
}
