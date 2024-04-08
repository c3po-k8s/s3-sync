'use strict'
import log from 'logger'
import watchFolder from './watchFolder.js'
import restoreFolder from './restoreFolder.js'
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
if(process.env.S3_SYNC_MODE === 'restore'){
  restoreFolder()
}else{
  watchFolder()
}
