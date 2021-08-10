import { err, intervalDays, log, randomStr, unixTimeStamp, urlExclueOrigin, warn } from "./utils";
import { Methods, WechatPayV3 } from "./wechat_v3";
import { request } from './request'

export class WechatPay extends WechatPayV3 {
  private autoUpdatePlatformCertOption: {
    schema: false | 'task' | 'onReq',
    updataAt: Date | null,
    timer: NodeJS.Timeout | undefined,
    retryCount: number
  } = {
      schema: false,
      updataAt: null,
      timer: undefined,
      retryCount: 0
    }
  /**
   * 构建请求的认证数据
   * @param method 
   * @param url 
   * @param param 
   * @returns 
   */
  buildRequestAuth(method: Methods, url: string, param?: object) {
    const timeStamp = unixTimeStamp()
    const nonceStr = randomStr()
    const signture = this.getSignature(method,
      urlExclueOrigin(url),
      timeStamp,
      nonceStr,
      param
    )
    const auth = this.getAuthorization(nonceStr, timeStamp, signture)
    return auth
  }
  /**
  * 当你考虑使用此方法来满足你更多的需求时,可以提个pr来完善它
  */
  async post(url: string, params: object, auth: string, verify = true) {
    const { data, status, headers } = await request(url, 'POST')
      .setHeader({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent,
        Authorization: auth,
      })
      .setTimeout(10000)
      .write(params)
      .end()
    let _verify: 'noVerify' | boolean = 'noVerify'
    if (verify) {
      if (!this.platformCert) {
        warn(
          '验签警告',
          '\n      当前调用开启了验签,但并未找到平台证书.',
          '\n      考虑到部分复杂情况,没有添加开启验证则自动设置平台证书.',
          '\n      请调用setPlatformCert设置平台证书或者autoUpdatePlatformCert开启自动更新证书.',
        )
      }
      _verify = this.verifyRes(data, headers as any)
    }
    return {
      verify: _verify,
      headers,
      status,
      data,
    }
  }
  /**
  * 当你考虑使用此方法来满足你更多的需求时,可以提个pr来完善它
  */
  async get(url: string, auth: string, verify = true) {

    const { data, status, headers } = await request(url, 'GET')
      .setHeader({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent,
        Authorization: auth,
      })
      .setTimeout(10000)
      .end()
    let _verify: 'noVerify' | boolean = 'noVerify'
    if (verify) {
      if (!this.platformCert) {
        if (this.autoUpdatePlatformCertOption.schema === 'onReq') {
          //间隔不满一天,这里的一天存粹是日期的一天,假如晚11点开启的自动更新,那么次日0点就会更新
          if (this.autoUpdatePlatformCertOption.updataAt) {
            if (intervalDays(this.autoUpdatePlatformCertOption.updataAt, new Date) !== 0) {
              await this.autoUpdatePlatformCert('onReq')
            }
          }
        } else {
          warn(
            '验签警告',
            '\n      当前调用开启了验签,但并未找到平台证书.考虑到部分情况,程序不会自动设置平台证书.',
            '\n      请调用setPlatformCert设置平台证书或者autoUpdatePlatformCert开启自动更新证书.',
          )
        }
      }
      _verify = this.verifyRes(data, headers as any)
    }
    return {
      verify: _verify,
      headers,
      status,
      data,
    }
  }
  /**
   * https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay5_0.shtml
   * @description 请根据实际情况选择,业务量大时'task'更好,反之使用'onReq'
   * @param schema 'task' 为定期任务,每12小时执行. 'onReq'为请求时被动触发,每日变更.
   * @returns 
   */
  async autoUpdatePlatformCert(schema: 'task' | 'onReq' | false) {
    this.autoUpdatePlatformCertOption.schema = schema
    if (schema === false) {
      return false
    }
    const flag = `${new Date} - 自动更新证书`
    const cert = await this.getPlatformCert()

    if (this.autoUpdatePlatformCertOption.timer) {
      clearTimeout(this.autoUpdatePlatformCertOption.timer)
    }
    if (!cert) {
      err(flag, `更新失败!${this.autoUpdatePlatformCertOption.retryCount * 5}秒后重试!`)
      if (this.autoUpdatePlatformCertOption.retryCount > 5) {
        err(flag, `重试次数超过上限!自动更新平台证书被关闭!`)
        this.autoUpdatePlatformCert(false)
      }
      this.autoUpdatePlatformCertOption.timer = setTimeout(() => {
        this.autoUpdatePlatformCertOption.retryCount += 1
        log(`第${this.autoUpdatePlatformCertOption.retryCount}次重试!`)
        this.autoUpdatePlatformCert(this.autoUpdatePlatformCertOption.schema)
      }, this.autoUpdatePlatformCertOption.retryCount * 5 * 1000)
      return false
    }

    switch (schema) {
      case 'task':
        this.autoUpdatePlatformCertOption.timer = setTimeout(() => {
          this.autoUpdatePlatformCert('task')
        }, 60 * 1000 * 60 * 12)
      case 'onReq':
        this.setPlatformCert(cert)
        this.autoUpdatePlatformCertOption.updataAt = new Date
        log(flag, '更新成功!')
    }
    return true
  }
  /**
     * 如果平台证书存在,则所有响应都会验证签名,返回boolean.
     * 如果证书不存在,表示一律通过,全部请求返回 noVerify.
     * 你可以选择忽略,但在处理敏感操作时,有必要根据验签结果进行处理.
     * @param body 
     * @param headers 
     */
  verifyRes(body: string, headers: { [key: string]: string }) {
    if (this.platformCert) {
      const data = this.buildVerifyStr(
        headers['wechatpay-timestamp'],
        headers['wechatpay-nonce'],
        body
      )
      return this.sha256WithRsaVerify(this.platformCert, headers['wechatpay-signature'], data)
    }
    return 'noVerify'
  }

  async closeOrder(out_trade_no: string) {
    const params = {
      mchid: this.config.mchid
    }
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${out_trade_no}/close`
    const auth = this.buildRequestAuth('POST', url, params)
    const res = await this.post(url, params, auth, false)
    return { status: res.status, success: res.status === 204 }
  }
  /**
 * App下单
 * @param order 订单详情
 * @returns 
 */
  async orderFromApp(order: OrderConfig) {
    const params = {
      ...order,
      appid: this.config.appid,
      mchid: this.config.mchid,
    }
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/app'
    const auth = this.buildRequestAuth('POST', url, params)
    const res = await this.post(url, params, auth)
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data) as {
        prepay_id?: string
      },
      /**
       * 拿到预支付交易会话ID生成前端所需要的数据
       * @param perpay_id 预支付交易会话ID
       * @returns 
       */
      callToPay: (perpay_id: string) => {
        const nonce_str = randomStr()
        const timeStamp = unixTimeStamp().toString()
        const sginStr = [this.config.appid, timeStamp, nonce_str, perpay_id].join('\n') + '\n'
        const signature = this.sha256WithRsaSign(sginStr)
        return {
          signature,
          appId: this.config.appid,
          partnerid: this.config.mchid,
          prepayid: perpay_id,
          package: 'Sign=WXPay',
          noncestr: nonce_str,
          timestamp: timeStamp,
        }
      }
    }
  }
  /**
   * 获取订单
   * @param id 
   * @param type id类型,transaction_id为微信支付订单号,out_trade_no为商家订单号
   */
  async getOrder(id: string, type: 'transaction_id' | 'out_trade_no') {
    let url = type === 'out_trade_no'
      ? `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${id}`
      : `https://api.mch.weixin.qq.com/v3/pay/transactions/id/${id}`
    url += '?mchid=' + this.config.mchid
    const auth = this.buildRequestAuth('GET', url)
    const res = await this.get(url, auth)
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data) as {
        trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR' | 'ACCEPT'
        [key: string]: any
      }
    }
  }
  /**
   * 获取微信证书用于验签使用,微信官方推荐12小时内进行一次获取
   * sdk提供了自动更新且应用新证书的方法 autoUpdatePlatformCert
   */
  async getPlatformCert() {
    const url = 'https://api.mch.weixin.qq.com/v3/certificates'
    const auth = this.buildRequestAuth('GET', url)

    const { headers, data, status } = await this.get(url, auth, false)
    if (status === 200 && headers) {
      const body = JSON.parse(data)
      for (let i = 0; i < body.data.length; i++) {
        const cert = body.data[i] as PlatformCert
        //判断头信息,拿到当前平台证书
        if (cert.serial_no === headers['wechatpay-serial']) {
          //解密拿到的平台证书
          const rltCert = this.aesGcmDecrypt(
            cert.encrypt_certificate.nonce,
            cert.encrypt_certificate.associated_data,
            cert.encrypt_certificate.ciphertext
          )
          //直接拿返回的新证书进行自身的验签.
          if (this.sha256WithRsaVerify(
            rltCert,
            headers['wechatpay-signature'] as string,
            this.buildVerifyStr(
              headers['wechatpay-timestamp'] as string,
              headers['wechatpay-nonce'] as string,
              data
            )
          )) {
            //验签成功则返回证书
            return rltCert
          }
        }
      }
    }
    //非网络环境导致失败的情况应当停机并打印日志,考虑被劫持数据篡改的情况
    //密钥保存得当虽然不会遭遇太大问题,但这代表解密的后数据将无法使用或报错(具体报错还是怎么样没测过),可能导致连锁bug
    return undefined
  }
  /**
   * 退款
   * @param config 
   * @returns 
   */
  async refund(config: RefundConfig & (RefundConfig_id1 | RefundConfig_id2)) {
    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds'
    const auth = this.buildRequestAuth('POST', url, config)
    const res = await this.post(url, config, auth)
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data)
    }
  }
}
/**
 * 给出的接口参数为推荐参数并非全部参数,请参阅微信官方文档
 */
interface OrderConfig {
  amount: {
    total: number
  },
  description: string,
  notify_url: string,
  out_trade_no: string
  [key: string]: any
}

interface PlatformCert {
  effective_time: string,
  encrypt_certificate: {
    algorithm: string,
    associated_data: string,
    ciphertext: string,
    nonce: string
  },
  expire_time: string,
  serial_no: string
}
interface RefundConfig_id1 {
  transaction_id: string
}
interface RefundConfig_id2 {
  out_trade_no: string
}
/**
 * 给出的接口参数为推荐参数并非全部参数,请参阅微信官方文档
 */
interface RefundConfig {
  /**商户内部退款单号*/
  out_refund_no: string
  /**退款原因*/
  reason?: string
  notify_url?: string
  /**默认使用未结算资金退款 */
  funds_account?: 'AVAILABLE'
  amount: {
    /**退款金额 */
    refund: number
    /**原支付交易的订单总金额 */
    total: number
    currency: 'CNY'
  }
}