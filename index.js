'use strict'
import log from 'logger'

process.on('unhandledRejection', (error) => {
  log.error(error)
});
import './src/index.js'
