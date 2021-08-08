import { createDecipheriv, createSign, createVerify, KeyLike, randomUUID, VerifyKeyObjectInput, VerifyPublicKeyInput, X509Certificate } from "crypto"
import { err, getCertificateSerialNo, trimBlank } from "./utils"

export interface WechatPayV3Config {
  appid: string
  mchid: string
  apikeyV3: string
  publicCert: Buffer
  privateKey: Buffer
  userAgent?: string
}
export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE'

//父模块
export class WechatPayV3 {
  protected schema = 'WECHATPAY2-SHA256-RSA2048'
  protected mchCertSerial: string
  protected platformCert: Buffer | null = null
  constructor(protected config: WechatPayV3Config) {
    this.config.userAgent = config.userAgent ?? 'wechatpay/v3'
    this.mchCertSerial = getCertificateSerialNo(config.publicCert).toLowerCase()
  }
  /**
   * 设置微信的平台证书
   * @param cert 
   */
  public setPlatformCert(cert: Buffer) {
    this.platformCert = cert
  }
  /**
   * uuidV4,订单号可以使用
   * @param disableEntropyCache node为了提高效率,会生成并缓存足够多的随机数据,设为true可以在不缓存的情况下生成.(考虑实际使用情况选择,推荐保持默认)
   * @returns 
   */
  public uuid(disableEntropyCache = false) {
    return randomUUID({ disableEntropyCache: disableEntropyCache })
  }
  /**
   * 获取请求签名
   * @param method 
   * @param pathname /v3/xxx 
   * @param timeStamp 
   * @param nonceStr 
   * @param body 
   * @returns 
   */
  protected getSignature(method: Methods, pathname: string, timeStamp: number | string, nonceStr: string, body?: object | string) {
    if (body) {
      if (body instanceof Object) {
        body = JSON.stringify(body)
      }
    } else {
      body = ''
    }
    const data = [method, pathname, timeStamp, nonceStr, body].join('\n') + '\n'
    return this.sha256WithRsaSign(data)
  }
  /**
   * 获取授权头
   * @param nonceStr 32位随机字符串
   * @param timeStamp 时间戳
   * @param signature 请求签名
   * 1
   */
  protected getAuthorization(nonceStr: string, timeStamp: string | number, signature: string) {
    return (
      this.schema + ' ' + trimBlank(`
        mchid="${this.config.mchid}",
        nonce_str="${nonceStr}",
        timestamp="${timeStamp}",
        serial_no="${this.mchCertSerial}",
        signature="${signature}"
        `)
    )
  }
  /**
   * sha256WithRsa加密
   * @param plaintext 被加密的数据
   * @returns 
   */
  protected sha256WithRsaSign(plaintext: string) {
    return createSign('RSA-SHA256').update(plaintext).sign(this.config.privateKey, 'base64')
  }
  /**
   * 验证微信平台响应签名
   * @param publicKey 平台公钥
   * @param signature 
   * @param data 
   * @returns 
   */
  protected sha256WithRsaVerify(publicKey: KeyLike | VerifyKeyObjectInput | VerifyPublicKeyInput, signature: string, data: string) {
    return createVerify('RSA-SHA256').update(data).verify(publicKey, signature, 'base64')
  }
  /**
   * 解密平台响应
   * @param nonce 
   * @param associatedData 
   * @param ciphertext 
   * @returns 
   */
  protected aesGcmDecrypt(nonce: string, associatedData: string, ciphertext: string) {
    try {
      let ciphertextBuffer = Buffer.from(ciphertext, 'base64')
      let authTag = ciphertextBuffer.slice(ciphertextBuffer.length - 16)
      let data = ciphertextBuffer.slice(0, ciphertextBuffer.length - 16)
      let decipherIv = createDecipheriv('aes-256-gcm', this.config.apikeyV3, nonce)
      decipherIv.setAuthTag(authTag)
      decipherIv.setAAD(Buffer.from(associatedData))
      let decryptBuf = decipherIv.update(data)
      decipherIv.final()
      return decryptBuf
    } catch (error) {
      err('密钥解密失败', '请检查平台配置密钥是否正确')
      throw error;
    }
  }
  /**
   * 创建验签名串
   * @param resTimestamp 参数在响应头中对应
   * @param resNonce 参数在响应头中对应
   * @param resBody 参数在响应头中对应
   * @returns 
   */
  protected buildVerifyStr(resTimestamp: string, resNonce: string, resBody: string) {
    return [resTimestamp, resNonce, resBody].join('\n') + '\n'
  }
}

