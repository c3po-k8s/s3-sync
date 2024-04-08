'use strict'
import * as Minio from 'minio'
const opts = {
  endPoint: process.env.S3_FILE_SCV_URL,
  accessKey: process.env.S3_FILE_ACCESSKEY,
  secretKey: process.env.S3_FILE_SECRETKEY
}
if(process.env.S3_FILE_PORT){
  opts.port = +process.env.S3_FILE_PORT
  opts.useSSL = false
}
const client = new Minio.Client(opts)
const getObject = (bucket, key)=>{
  return new Promise((resolve, reject)=>{
    try{
      let miniData
      client.getObject(bucket, key, (err, dataStream)=>{
        if(err) reject(err)
        dataStream.on('data', (chunk)=>{
          if(!miniData){
            miniData = chunk
          }else{
            miniData += chunk
          }
        })
        dataStream.on('end', ()=>{
          resolve(miniData)
        })
        dataStream.on('error', (err)=>{
          reject(err)
        })
      })
    }catch(e){
      reject(e)
    }
  })
}
const listBucket = (bucket, prefix)=>{
  return new Promise((resolve, reject)=>{
    try{
      let bucketList = []
      let dataStream = client.listObjectsV2(bucket, (prefix ? prefix:''), false)
      dataStream.on('data', (chunk)=>{
        bucketList.push(chunk)
      })
      dataStream.on('error', (err)=>{
        reject(err)
      })
      dataStream.on('end', ()=>{
        resolve(bucketList)
      })
    }catch(e){
      reject(e)
    }
  })
}
const put = async(bucket, path, fileName, data, metadata)=>{
  try{
    if(!bucket || !fileName || !data) return
    let key = ''
    if(path) key += `${path}/`
    key += fileName
    let result = await client.putObject(bucket, key, data, metadata)
    return result
  }catch(e){
    throw(e)
  }
}
const get = async(bucket, path, fileName)=>{
  try{
    let key = ''
    if(path) key += `${path}/`
    key += fileName
    let result = await getObject(bucket, key)
    if(result) return result
  }catch(e){
    throw(e)
  }
}
const list = async(bucket, prefix)=>{
  try{
    let key
    if(prefix) key = `${prefix}/`
    return await listBucket(bucket, key)
  }catch(e){
    throw(e)
  }
}
const Cmds = {
  get: get,
  list: list,
  put: put
}
export default Cmds
