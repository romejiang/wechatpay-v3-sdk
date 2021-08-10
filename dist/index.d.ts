import * as http from 'http';
import http__default from 'http';
import { KeyLike, VerifyKeyObjectInput, VerifyPublicKeyInput } from 'crypto';

interface WechatPayV3Config {
    appid: string;
    mchid: string;
    apikeyV3: string;
    publicCert: Buffer;
    privateKey: Buffer;
    userAgent?: string;
}
declare type Methods$1 = 'GET' | 'POST' | 'PUT' | 'DELETE';
declare class WechatPayV3 {
    protected config: WechatPayV3Config;
    protected schema: string;
    protected mchCertSerial: string;
    protected platformCert: Buffer | null;
    constructor(config: WechatPayV3Config);
    /**
     * 设置微信的平台证书
     * @param cert
     */
    setPlatformCert(cert: Buffer): void;
    /**
     * uuidV4,订单号可以使用
     * @param disableEntropyCache node为了提高效率,会生成并缓存足够多的随机数据,设为true可以在不缓存的情况下生成.(考虑实际使用情况选择,推荐保持默认)
     * @returns
     */
    uuid(disableEntropyCache?: boolean): string;
    /**
     * 获取请求签名
     * @param method
     * @param pathname /v3/xxx
     * @param timeStamp
     * @param nonceStr
     * @param body
     * @returns
     */
    protected getSignature(method: Methods$1, pathname: string, timeStamp: number | string, nonceStr: string, body?: object | string): string;
    /**
     * 获取授权头
     * @param nonceStr 32位随机字符串
     * @param timeStamp 时间戳
     * @param signature 请求签名
     * 1
     */
    protected getAuthorization(nonceStr: string, timeStamp: string | number, signature: string): string;
    /**
     * sha256WithRsa加密
     * @param plaintext 被加密的数据
     * @returns
     */
    protected sha256WithRsaSign(plaintext: string): string;
    /**
     * 验证微信平台响应签名
     * @param publicKey 平台公钥
     * @param signature
     * @param data
     * @returns
     */
    protected sha256WithRsaVerify(publicKey: KeyLike | VerifyKeyObjectInput | VerifyPublicKeyInput, signature: string, data: string): boolean;
    /**
     * 解密平台响应
     * @param nonce
     * @param associatedData
     * @param ciphertext
     * @returns
     */
    protected aesGcmDecrypt(nonce: string, associatedData: string, ciphertext: string): Buffer;
    /**
     * 创建验签名串
     * @param resTimestamp 参数在响应头中对应
     * @param resNonce 参数在响应头中对应
     * @param resBody 参数在响应头中对应
     * @returns
     */
    protected buildVerifyStr(resTimestamp: string, resNonce: string, resBody: string): string;
}

declare class WechatPay extends WechatPayV3 {
    private autoUpdatePlatformCertOption;
    /**
     * 构建请求的认证数据
     * @param method
     * @param url
     * @param param
     * @returns
     */
    buildRequestAuth(method: Methods$1, url: string, param?: object): string;
    /**
    * 当你考虑使用此方法来满足你更多的需求时,可以提个pr来完善它
    */
    post(url: string, params: object, auth: string, verify?: boolean): Promise<{
        verify: boolean | "noVerify";
        headers: http.IncomingHttpHeaders;
        status: number | undefined;
        data: string;
    }>;
    /**
    * 当你考虑使用此方法来满足你更多的需求时,可以提个pr来完善它
    */
    get(url: string, auth: string, verify?: boolean): Promise<{
        verify: boolean | "noVerify";
        headers: http.IncomingHttpHeaders;
        status: number | undefined;
        data: string;
    }>;
    /**
     * https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay5_0.shtml
     * @description 请根据实际情况选择,业务量大时'task'更好,反之使用'onReq'
     * @param schema 'task' 为定期任务,每12小时执行. 'onReq'为请求时被动触发,每日变更.
     * @returns
     */
    autoUpdatePlatformCert(schema: 'task' | 'onReq' | false): Promise<boolean>;
    /**
       * 如果平台证书存在,则所有响应都会验证签名,返回boolean.
       * 如果证书不存在,表示一律通过,全部请求返回 noVerify.
       * 你可以选择忽略,但在处理敏感操作时,有必要根据验签结果进行处理.
       * @param body
       * @param headers
       */
    verifyRes(body: string, headers: {
        [key: string]: string;
    }): boolean | "noVerify";
    closeOrder(out_trade_no: string): Promise<{
        status: number | undefined;
        success: boolean;
    }>;
    /**
   * App下单
   * @param order 订单详情
   * @returns
   */
    orderFromApp(order: OrderConfig): Promise<{
        verify: boolean | "noVerify";
        status: number | undefined;
        data: {
            prepay_id?: string | undefined;
        };
        /**
         * 拿到预支付交易会话ID生成前端所需要的数据
         * @param perpay_id 预支付交易会话ID
         * @returns
         */
        callToPay: (perpay_id: string) => {
            signature: string;
            appId: string;
            partnerid: string;
            prepayid: string;
            package: string;
            noncestr: string;
            timestamp: string;
        };
    }>;
    /**
     * 获取订单
     * @param id
     * @param type id类型,transaction_id为微信支付订单号,out_trade_no为商家订单号
     */
    getOrder(id: string, type: 'transaction_id' | 'out_trade_no'): Promise<{
        verify: boolean | "noVerify";
        status: number | undefined;
        data: {
            [key: string]: any;
            trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR' | 'ACCEPT';
        };
    }>;
    /**
     * 获取微信证书用于验签使用,微信官方推荐12小时内进行一次获取
     * sdk提供了自动更新且应用新证书的方法 autoUpdatePlatformCert
     */
    getPlatformCert(): Promise<Buffer | undefined>;
    /**
     * 退款
     * @param config
     * @returns
     */
    refund(config: RefundConfig & (RefundConfig_id1 | RefundConfig_id2)): Promise<{
        verify: boolean | "noVerify";
        status: number | undefined;
        data: any;
    }>;
}
/**
 * 给出的接口参数为推荐参数并非全部参数,请参阅微信官方文档
 */
interface OrderConfig {
    amount: {
        total: number;
    };
    description: string;
    notify_url: string;
    out_trade_no: string;
    [key: string]: any;
}
interface RefundConfig_id1 {
    transaction_id: string;
}
interface RefundConfig_id2 {
    out_trade_no: string;
}
/**
 * 给出的接口参数为推荐参数并非全部参数,请参阅微信官方文档
 */
interface RefundConfig {
    /**商户内部退款单号*/
    out_refund_no: string;
    /**退款原因*/
    reason?: string;
    notify_url?: string;
    /**默认使用未结算资金退款 */
    funds_account?: 'AVAILABLE';
    amount: {
        /**退款金额 */
        refund: number;
        /**原支付交易的订单总金额 */
        total: number;
        currency: 'CNY';
    };
}

declare function randomStr(length?: number): string;
declare function unixTimeStamp(): number;
declare function getCertificateSerialNo(buf: Buffer): string;
declare function utf8Tobase64(utf8str: string): string;
declare function base64ToUtf8(base64str: string): string;
/**
 * 去掉对象中所有undefined和null
 * @param obj
 * @returns
 */
declare function delEmpty(obj: any): any;
/**
 * 排除域名中Origin 例如:http://www.a.com/v3/2?a=2 结果为/v3/2?a=2
 * @param url
 * @returns
 */
declare function urlExclueOrigin(url: string): string;
/**
 * 去除文本所有空格,换行
 * @param str
 * @returns
 */
declare function trimBlank(str: string): string;
/**
 * 返回所有文本的长度
 * @param args
 * @returns
 */
declare function allStrLen(...args: string[]): number;
/**
 * 打印日志,flag为绿色.
 * @param flag
 * @param args
 */
declare function log(flag: string, ...args: any): void;
/**
 * 打印错误,flag为红色
 * @param flag
 * @param args
 */
declare function err(flag: string, ...args: any): void;
/**
 * 打印警告,flag为黄色
 * @param flag
 * @param args
 */
declare function warn(flag: string, ...args: any): void;
declare function intervalDays(comparedA: Date, comparedB: Date): number;
declare function promiseTry(fn: any): Promise<unknown>;

declare const utils_randomStr: typeof randomStr;
declare const utils_unixTimeStamp: typeof unixTimeStamp;
declare const utils_getCertificateSerialNo: typeof getCertificateSerialNo;
declare const utils_utf8Tobase64: typeof utf8Tobase64;
declare const utils_base64ToUtf8: typeof base64ToUtf8;
declare const utils_delEmpty: typeof delEmpty;
declare const utils_urlExclueOrigin: typeof urlExclueOrigin;
declare const utils_trimBlank: typeof trimBlank;
declare const utils_allStrLen: typeof allStrLen;
declare const utils_log: typeof log;
declare const utils_err: typeof err;
declare const utils_warn: typeof warn;
declare const utils_intervalDays: typeof intervalDays;
declare const utils_promiseTry: typeof promiseTry;
declare namespace utils {
  export {
    utils_randomStr as randomStr,
    utils_unixTimeStamp as unixTimeStamp,
    utils_getCertificateSerialNo as getCertificateSerialNo,
    utils_utf8Tobase64 as utf8Tobase64,
    utils_base64ToUtf8 as base64ToUtf8,
    utils_delEmpty as delEmpty,
    utils_urlExclueOrigin as urlExclueOrigin,
    utils_trimBlank as trimBlank,
    utils_allStrLen as allStrLen,
    utils_log as log,
    utils_err as err,
    utils_warn as warn,
    utils_intervalDays as intervalDays,
    utils_promiseTry as promiseTry,
  };
}

declare class Request {
    protected url: string;
    protected method: Methods;
    protected clientRequest: http__default.ClientRequest;
    constructor(url: string, method?: Methods);
    setTimeout(timeout: number, callback?: () => void): this;
    setHeader(headers: http__default.OutgoingHttpHeaders): this;
    setHeader(name: string, value: string | number | readonly string[]): this;
    write(data?: Buffer | string | object): this;
    end(): Promise<{
        res: http__default.IncomingMessage;
        status: number | undefined;
        statusMessage: string | undefined;
        headers: http__default.IncomingHttpHeaders;
        data: string;
    }>;
    private buildRequest;
}
/**
 * 普通的请求封装,为了不添加依赖所写.
 * @param url
 * @param method
 * @returns
 */
declare function request(url: string, method?: Methods): Request;
declare type Methods = ('ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' | 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' | 'PATCH' | 'POST' | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT' | 'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' | 'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE');

export { WechatPay, request, utils };
