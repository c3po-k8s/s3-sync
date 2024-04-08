'use strict'
import log from './logger.js'
import minio from './minio.js'
import fs from 'fs'
let LOCAL_PATH = process.env.LOCAL_PATH || '/app/src/data', BUCKET = process.env.S3_SYNC_BUCKET, BUCKET_PREFIX = process.env.S3_SYNC_PREFIX
let defaultFiles = []
if(process.env.DEFAULT_FILES) defaultFiles = JSON.parse(process.env.DEFAULT_FILES)
const setPerms = (fileName)=>{
  return new Promise((resolve, reject)=>{
    try{
      fs.chmod(`${LOCAL_PATH}/${fileName}`, 511, (err)=>{
        if(err) reject(err)
        resolve()
      })
    }catch(e){
      reject(e)
    }
  })
}
const writeFile = async(file, data)=>{
  try{
    let fileName = file.replace(`${BUCKET_PREFIX}/`, '')
    log.info(`Restoring ${LOCAL_PATH}/${fileName}...`)
    await fs.writeFileSync(`${LOCAL_PATH}/${fileName}`, data)
    await setPerms(fileName)
  }catch(e){
    throw(e)
  }
}
const getFile = async(fileName)=>{
  try{
    let data = await minio.get(BUCKET, null, fileName)
    if(data) await writeFile(fileName, data)
  }catch(e){
    throw(e)
  }
}
const getFiles = async()=>{
  try{
    if(!BUCKET) throw(`No s3 bucket defined...`)
    let list = await minio.list(BUCKET, BUCKET_PREFIX)
    if(list?.length > 0){
      for(let i in list) await getFile(list[i].name)
    }
  }catch(e){
    throw(e)
    setTimeout(getFiles, 5000)
  }
}
const createDefaultFiles = async()=>{
  try{
    if(defaultFiles?.length > 0){
      for(let i in defaultFiles){
        log.info(`Creating ${LOCAL_PATH}/${defaultFiles[i]}...`)
        await fs.writeFileSync(`${LOCAL_PATH}/${defaultFiles[i]}`, '')
        await setPerms(defaultFiles[i])
      }
    }
    getFiles()
  }catch(e){
    log.error(e)
    setTimeout(createDefaultFiles, 5000)
  }
}
export default createDefaultFiles
