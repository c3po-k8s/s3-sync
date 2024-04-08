'use strict'
import Watcher from 'watcher'
import log from 'logger'
import minio from './minio.js'
import fs from 'fs'
//const minio = require('./minio')
let LOCAL_PATH = process.env.LOCAL_PATH || '/app/src/data', BUCKET = process.env.S3_SYNC_BUCKET, BUCKET_PREFIX = process.env.S3_SYNC_PREFIX
let fileFilter = [], watcher
if(process.env.FILE_NAMES) fileFilter = JSON.parse(process.env.FILE_NAMES)
const uploadFile = async(filePath)=>{
  try{
    let data = await fs.readFileSync(filePath)
    if(data){
      let fileName = filePath.replace(`${LOCAL_PATH}/`, '')
      let res = await minio.put(BUCKET, BUCKET_PREFIX, fileName, data)
      if(!res.etag) throw(`Error uploading file to s3...`)
    }
  }catch(e){
    log.error(e)
    setTimeout(()=>uploadFile(filePath), 5000)
  }
}
const startWatcher = ()=>{
  watcher = new Watcher(LOCAL_PATH, { ignoreInitial: false })
  watcher.on ( 'error', error => {
    log.error ( error instanceof Error ); // => true, "Error" instances are always provided on "error"
  });
  watcher.on ( 'ready', () => {
    log.info(`Started watching ${LOCAL_PATH}...`)
    if(fileFilter?.length > 0) log.info(`Only watching ${fileFilter} files...`)
    // The app just finished instantiation and may soon emit some events
  });
  watcher.on ( 'close', () => {
    log.info(`Stopped watching ${LOCAL_PATH}`)
    startWatcher()
    // The app just stopped watching and will not emit any further events
  });
  watcher.on ( 'add', filePath => {
    if(fileFilter.filter(x=>`${LOCAL_PATH}/${x}` === filePath).length === 0 && fileFilter.length > 0) return
    log.debug(`add ${filePath}`)
    uploadFile(filePath)

  });
  watcher.on ( 'change', filePath => {
    if(fileFilter.filter(x=>`${LOCAL_PATH}/${x}` === filePath).length === 0 && fileFilter.length > 0) return
    log.debug(`change ${filePath}`)
    uploadFile(filePath)
    //uploadFile(filePath)
  });
}
export default startWatcher
