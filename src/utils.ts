import { X509Certificate } from "crypto";
import { URL } from "url";

export function randomStr(length = 32) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = chars.length;
  var noceStr = "";
  for (var i = 0; i < (length || 32); i++) {
    noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return noceStr;
}

export function unixTimeStamp() {
  return Math.floor(Date.now() / 1000)
}

export function getCertificateSerialNo(buf: Buffer) {
  const x509 = new X509Certificate(buf)
  return x509.serialNumber
}


export function utf8Tobase64(utf8str: string) {
  return Buffer.from(utf8str).toString('base64')
}

export function base64ToUtf8(base64str: string) {
  return (Buffer.from(base64str, 'base64').toString())
}

/**
 * 去掉对象中所有undefined和null
 * @param obj 
 * @returns 
 */
export function delEmpty(obj: any) {
  const result = { ...obj }
  const oKeys = Object.keys(result)
  for (const key of oKeys) {
    if (result[key] === undefined || result[key] === null) {
      delete result[key]
    }
    if (typeof result[key] === 'object') {
      if (Array.isArray(result[key])) {
        result[key] = result[key].filter((
          item: any) => (item !== undefined && item !== null)
        )
      } else {
        result[key] = delEmpty(result[key])
      }
    }
  }
  return result
}
/**
 * 排除域名中Origin 例如:http://www.a.com/v3/2?a=2 结果为/v3/2?a=2
 * @param url 
 * @returns 
 */
export function urlExclueOrigin(url: string) {
  const _url = new URL(url)
  return url.replace(_url.origin, '')
}
/**
 * 去除文本所有空格,换行
 * @param str 
 * @returns 
 */
export function trimBlank(str: string) {
  return str.replace(/[\s]/g, '')
}
/**
 * 返回所有文本的长度
 * @param args 
 * @returns 
 */
export function allStrLen(...args: string[]) {
  return args.reduce<number>((prev, cur) => {
    return prev + cur.length
  }, 0)
}
/**
 * 打印日志,flag为绿色.
 * @param flag 
 * @param args 
 */
export function log(flag: string, ...args: any) {
  console.log(`\x1b[32m[${flag}]\x1b[0m`, ...args)
}
/**
 * 打印错误,flag为红色
 * @param flag 
 * @param args 
 */
export function err(flag: string, ...args: any) {
  console.log(`\x1b[31m[${flag}]\x1b[0m`, ...args)
}
/**
 * 打印警告,flag为黄色
 * @param flag 
 * @param args 
 */
export function warn(flag: string, ...args: any) {
  console.log(`\x1b[33m[${flag}]\x1b[0m`, ...args)
}

export function intervalDays(comparedA: Date, comparedB: Date) {
  function dateFormat(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }
  const a = Date.parse(dateFormat(comparedA))
  const b = Date.parse(dateFormat(comparedB))
  if (a === b) {
    return 0
  }
  return Math.abs(a - b) / (1000 * 60 * 60 * 24)
}

export function promiseTry(fn: any) {
  return new Promise((resolve) => resolve(fn()))
}