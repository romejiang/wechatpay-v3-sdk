import http, { IncomingMessage, RequestOptions } from 'http'
import https from 'https'
import os from 'os'
import { URL } from 'url'


interface RequestConifg {
  url: string
  method?: Methods
  headers?: http.OutgoingHttpHeaders
}

class Request {
  protected clientRequest: http.ClientRequest

  constructor(
    protected url: string,
    protected method: Methods = 'GET'
  ) {
    this.clientRequest = this.buildRequest({
      method: this.method,
      url: this.url,
      headers: {
        'User-Agent': `${os.version()}/${os.release()}`
      }
    })
  }
  setTimeout(timeout: number, callback?: () => void) {
    const _callback = () => {
      if (callback) {
        callback()
      }
    }
    this.clientRequest.setTimeout(timeout, _callback)
    return this
  }
  setHeader(headers: http.OutgoingHttpHeaders): this
  setHeader(name: string, value: string | number | readonly string[]): this
  setHeader(...args: any): this {
    switch (args.length) {
      case 1:
        const headers = args[0]
        for (const key of Object.keys(headers)) {
          this.clientRequest.setHeader(key, headers[key])
        }
        break;
      case 2:
        const name = args[0], value = args[1]
        this.clientRequest.setHeader(name, value)
        break;
      default:
        err('WrongCall', 'setHeader nonsupport', ...args)
        break;
    }
    return this
  }
  write(data?: Buffer | string | object) {
    if (getType(data) === 'object') {
      data = JSON.stringify(data)
    }
    //@ts-ignore
    this.clientRequest.write((data as Buffer | string))
    return this
  }
  end() {
    return new Promise((resolve, reject) => {
      this.clientRequest.on('error', err => {
        reject(err)
      })
      this.clientRequest.on('timeout', () => {
        reject(new Error('timeout'))
      })
      this.clientRequest.on('response', res => {
        res.on('error', err => {
          reject(err)
        })
        let data = ''
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        res.on('end', async () => {
          return resolve({
            res: res,
            status: res?.statusCode,
            statusMessage: res?.statusMessage,
            headers: res.headers,
            data: data
          })
        })

      })
      this.clientRequest.end()
    }) as Promise<{
      res: http.IncomingMessage,
      status: number | undefined,
      statusMessage: string | undefined,
      headers: http.IncomingHttpHeaders,
      data: string
    }>
  }
  private buildRequest({ method, url, headers }: RequestConifg) {
    const _url = new URL(url)
    let adapter: (url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void) => http.ClientRequest;
    switch (_url.protocol) {
      case 'http:':
        adapter = http.request
        break;
      case 'https:':
        adapter = https.request
        break;
      default:
        throw new TypeError(`nonsupport this protocol ${_url.protocol}`);
    }
    const req = adapter(url, {
      headers,
      method,
    })

    return req
  }
}
/**
 * 普通的请求封装,为了不添加依赖所写.
 * @param url 
 * @param method 
 * @returns 
 */
export function request(url: string, method?: Methods) {
  return new Request(url, method)
}


function getType(any: any): string | null | undefined {
  switch (typeof any) {
    case 'bigint':
      return 'bigint'
    case 'boolean':
      return 'boolean'
    case 'function':
      return 'function'
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'symbol':
      return 'symbol'
    case 'undefined':
      return undefined
    case 'object':
      if (Array.isArray(any)) {
        return 'array'
      } else if (any === null) {
        return null
      }
      let str = (Object.prototype.toString.call(any) as string)
      if (str !== '') {
        str = str.slice(8, -1)
      } else {
        try {
          //@ts-ignore
          str = Object.getPrototypeOf(any)?.constructor?.name
        } catch (error) {
          str = ''
        }

      }
      str = str !== '' ? str : 'object'
      return str.toLowerCase()
  }
}

type Methods = (
  'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' | 'DELETE' |
  'GET' | 'HEAD' | 'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' |
  'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' |
  'PATCH' | 'POST' | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT' |
  'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' |
  'UNBIND' | 'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE'
)

function err(flag: string, ...args: any) {
  console.log(`\x1b[31m[Req-${flag}]\x1b[0m`, ...args)
}