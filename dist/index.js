var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  WechatPay: () => WechatPay,
  request: () => request,
  utils: () => utils_exports
});

// src/utils.ts
var utils_exports = {};
__export(utils_exports, {
  allStrLen: () => allStrLen,
  base64ToUtf8: () => base64ToUtf8,
  delEmpty: () => delEmpty,
  err: () => err,
  getCertificateSerialNo: () => getCertificateSerialNo,
  intervalDays: () => intervalDays,
  log: () => log,
  promiseTry: () => promiseTry,
  randomStr: () => randomStr,
  trimBlank: () => trimBlank,
  unixTimeStamp: () => unixTimeStamp,
  urlExclueOrigin: () => urlExclueOrigin,
  utf8Tobase64: () => utf8Tobase64,
  warn: () => warn
});
var import_crypto = __toModule(require("crypto"));
var import_url = __toModule(require("url"));
function randomStr(length = 32) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var maxPos = chars.length;
  var noceStr = "";
  for (var i = 0; i < (length || 32); i++) {
    noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return noceStr;
}
function unixTimeStamp() {
  return Math.floor(Date.now() / 1e3);
}
function getCertificateSerialNo(buf) {
  const x509 = new import_crypto.X509Certificate(buf);
  return x509.serialNumber;
}
function utf8Tobase64(utf8str) {
  return Buffer.from(utf8str).toString("base64");
}
function base64ToUtf8(base64str) {
  return Buffer.from(base64str, "base64").toString();
}
function delEmpty(obj) {
  const result = __spreadValues({}, obj);
  const oKeys = Object.keys(result);
  for (const key of oKeys) {
    if (result[key] === void 0 || result[key] === null) {
      delete result[key];
    }
    if (typeof result[key] === "object") {
      if (Array.isArray(result[key])) {
        result[key] = result[key].filter((item) => item !== void 0 && item !== null);
      } else {
        result[key] = delEmpty(result[key]);
      }
    }
  }
  return result;
}
function urlExclueOrigin(url) {
  const _url = new import_url.URL(url);
  return url.replace(_url.origin, "");
}
function trimBlank(str) {
  return str.replace(/[\s]/g, "");
}
function allStrLen(...args) {
  return args.reduce((prev, cur) => {
    return prev + cur.length;
  }, 0);
}
function log(flag, ...args) {
  console.log(`[32m[${flag}][0m`, ...args);
}
function err(flag, ...args) {
  console.log(`[31m[${flag}][0m`, ...args);
}
function warn(flag, ...args) {
  console.log(`[33m[${flag}][0m`, ...args);
}
function intervalDays(comparedA, comparedB) {
  function dateFormat(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
  const a = Date.parse(dateFormat(comparedA));
  const b = Date.parse(dateFormat(comparedB));
  if (a === b) {
    return 0;
  }
  return Math.abs(a - b) / (1e3 * 60 * 60 * 24);
}
function promiseTry(fn) {
  return new Promise((resolve) => resolve(fn()));
}

// src/wechat_v3.ts
var import_crypto2 = __toModule(require("crypto"));
var WechatPayV3 = class {
  constructor(config) {
    this.config = config;
    this.schema = "WECHATPAY2-SHA256-RSA2048";
    this.platformCert = null;
    this.config.userAgent = config.userAgent ?? "wechatpay/v3";
    this.mchCertSerial = getCertificateSerialNo(config.publicCert).toLowerCase();
  }
  setPlatformCert(cert) {
    this.platformCert = cert;
  }
  uuid(disableEntropyCache = false) {
    return (0, import_crypto2.randomUUID)({ disableEntropyCache });
  }
  getSignature(method, pathname, timeStamp, nonceStr, body) {
    if (body) {
      if (body instanceof Object) {
        body = JSON.stringify(body);
      }
    } else {
      body = "";
    }
    const data = [method, pathname, timeStamp, nonceStr, body].join("\n") + "\n";
    return this.sha256WithRsaSign(data);
  }
  getAuthorization(nonceStr, timeStamp, signature) {
    return this.schema + " " + trimBlank(`
        mchid="${this.config.mchid}",
        nonce_str="${nonceStr}",
        timestamp="${timeStamp}",
        serial_no="${this.mchCertSerial}",
        signature="${signature}"
        `);
  }
  sha256WithRsaSign(plaintext) {
    return (0, import_crypto2.createSign)("RSA-SHA256").update(plaintext).sign(this.config.privateKey, "base64");
  }
  sha256WithRsaVerify(publicKey, signature, data) {
    return (0, import_crypto2.createVerify)("RSA-SHA256").update(data).verify(publicKey, signature, "base64");
  }
  aesGcmDecrypt(nonce, associatedData, ciphertext) {
    try {
      let ciphertextBuffer = Buffer.from(ciphertext, "base64");
      let authTag = ciphertextBuffer.slice(ciphertextBuffer.length - 16);
      let data = ciphertextBuffer.slice(0, ciphertextBuffer.length - 16);
      let decipherIv = (0, import_crypto2.createDecipheriv)("aes-256-gcm", this.config.apikeyV3, nonce);
      decipherIv.setAuthTag(authTag);
      decipherIv.setAAD(Buffer.from(associatedData));
      let decryptBuf = decipherIv.update(data);
      decipherIv.final();
      return decryptBuf;
    } catch (error) {
      err("\u5BC6\u94A5\u89E3\u5BC6\u5931\u8D25", "\u8BF7\u68C0\u67E5\u5E73\u53F0\u914D\u7F6E\u5BC6\u94A5\u662F\u5426\u6B63\u786E");
      throw error;
    }
  }
  buildVerifyStr(resTimestamp, resNonce, resBody) {
    return [resTimestamp, resNonce, resBody].join("\n") + "\n";
  }
};

// src/request.ts
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_os = __toModule(require("os"));
var import_url2 = __toModule(require("url"));
var Request = class {
  constructor(url, method = "GET") {
    this.url = url;
    this.method = method;
    this.clientRequest = this.buildRequest({
      method: this.method,
      url: this.url,
      headers: {
        "User-Agent": `${import_os.default.version()}/${import_os.default.release()}`
      }
    });
  }
  setTimeout(timeout, callback) {
    const _callback = () => {
      if (callback) {
        callback();
      }
    };
    this.clientRequest.setTimeout(timeout, _callback);
    return this;
  }
  setHeader(...args) {
    switch (args.length) {
      case 1:
        const headers = args[0];
        for (const key of Object.keys(headers)) {
          this.clientRequest.setHeader(key, headers[key]);
        }
        break;
      case 2:
        const name = args[0], value = args[1];
        this.clientRequest.setHeader(name, value);
        break;
      default:
        err2("WrongCall", "setHeader nonsupport", ...args);
        break;
    }
    return this;
  }
  write(data) {
    if (getType(data) === "object") {
      data = JSON.stringify(data);
    }
    this.clientRequest.write(data);
    return this;
  }
  end() {
    return new Promise((resolve, reject) => {
      this.clientRequest.on("error", (err3) => {
        reject(err3);
      });
      this.clientRequest.on("timeout", () => {
        reject(new Error("timeout"));
      });
      this.clientRequest.on("response", (res) => {
        res.on("error", (err3) => {
          reject(err3);
        });
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", async () => {
          return resolve({
            res,
            status: res?.statusCode,
            statusMessage: res?.statusMessage,
            headers: res.headers,
            data
          });
        });
      });
      this.clientRequest.end();
    });
  }
  buildRequest({ method, url, headers }) {
    const _url = new import_url2.URL(url);
    let adapter;
    switch (_url.protocol) {
      case "http:":
        adapter = import_http.default.request;
        break;
      case "https:":
        adapter = import_https.default.request;
        break;
      default:
        throw new TypeError(`nonsupport this protocol ${_url.protocol}`);
    }
    const req = adapter(url, {
      headers,
      method
    });
    return req;
  }
};
function request(url, method) {
  return new Request(url, method);
}
function getType(any) {
  switch (typeof any) {
    case "bigint":
      return "bigint";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "number":
      return "number";
    case "string":
      return "string";
    case "symbol":
      return "symbol";
    case "undefined":
      return void 0;
    case "object":
      if (Array.isArray(any)) {
        return "array";
      } else if (any === null) {
        return null;
      }
      let str = Object.prototype.toString.call(any);
      if (str !== "") {
        str = str.slice(8, -1);
      } else {
        try {
          str = Object.getPrototypeOf(any)?.constructor?.name;
        } catch (error) {
          str = "";
        }
      }
      str = str !== "" ? str : "object";
      return str.toLowerCase();
  }
}
function err2(flag, ...args) {
  console.log(`[31m[Req-${flag}][0m`, ...args);
}

// src/wechatPay.ts
var WechatPay = class extends WechatPayV3 {
  constructor() {
    super(...arguments);
    this.autoUpdatePlatformCertOption = {
      schema: false,
      updataAt: null,
      timer: void 0,
      retryCount: 0
    };
  }
  buildRequestAuth(method, url, param) {
    const timeStamp = unixTimeStamp();
    const nonceStr = randomStr();
    const signture = this.getSignature(method, urlExclueOrigin(url), timeStamp, nonceStr, param);
    const auth = this.getAuthorization(nonceStr, timeStamp, signture);
    return auth;
  }
  async post(url, params, auth, verify = true) {
    const { data, status, headers } = await request(url, "POST").setHeader({
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": this.config.userAgent,
      Authorization: auth
    }).setTimeout(1e4).write(params).end();
    let _verify = "noVerify";
    if (verify) {
      if (!this.platformCert) {
        warn("\u9A8C\u7B7E\u8B66\u544A", "\n      \u5F53\u524D\u8C03\u7528\u5F00\u542F\u4E86\u9A8C\u7B7E,\u4F46\u5E76\u672A\u627E\u5230\u5E73\u53F0\u8BC1\u4E66.", "\n      \u8003\u8651\u5230\u90E8\u5206\u590D\u6742\u60C5\u51B5,\u6CA1\u6709\u6DFB\u52A0\u5F00\u542F\u9A8C\u8BC1\u5219\u81EA\u52A8\u8BBE\u7F6E\u5E73\u53F0\u8BC1\u4E66.", "\n      \u8BF7\u8C03\u7528setPlatformCert\u8BBE\u7F6E\u5E73\u53F0\u8BC1\u4E66\u6216\u8005autoUpdatePlatformCert\u5F00\u542F\u81EA\u52A8\u66F4\u65B0\u8BC1\u4E66.");
      }
      _verify = this.verifyRes(data, headers);
    }
    return {
      verify: _verify,
      headers,
      status,
      data
    };
  }
  async get(url, auth, verify = true) {
    const { data, status, headers } = await request(url, "GET").setHeader({
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": this.config.userAgent,
      Authorization: auth
    }).setTimeout(1e4).end();
    let _verify = "noVerify";
    if (verify) {
      if (!this.platformCert) {
        if (this.autoUpdatePlatformCertOption.schema === "onReq") {
          if (this.autoUpdatePlatformCertOption.updataAt) {
            if (intervalDays(this.autoUpdatePlatformCertOption.updataAt, new Date()) !== 0) {
              await this.autoUpdatePlatformCert("onReq");
            }
          }
        } else {
          warn("\u9A8C\u7B7E\u8B66\u544A", "\n      \u5F53\u524D\u8C03\u7528\u5F00\u542F\u4E86\u9A8C\u7B7E,\u4F46\u5E76\u672A\u627E\u5230\u5E73\u53F0\u8BC1\u4E66.\u8003\u8651\u5230\u90E8\u5206\u60C5\u51B5,\u7A0B\u5E8F\u4E0D\u4F1A\u81EA\u52A8\u8BBE\u7F6E\u5E73\u53F0\u8BC1\u4E66.", "\n      \u8BF7\u8C03\u7528setPlatformCert\u8BBE\u7F6E\u5E73\u53F0\u8BC1\u4E66\u6216\u8005autoUpdatePlatformCert\u5F00\u542F\u81EA\u52A8\u66F4\u65B0\u8BC1\u4E66.");
        }
      }
      _verify = this.verifyRes(data, headers);
    }
    return {
      verify: _verify,
      headers,
      status,
      data
    };
  }
  async autoUpdatePlatformCert(schema) {
    this.autoUpdatePlatformCertOption.schema = schema;
    if (schema === false) {
      return false;
    }
    const flag = `${new Date()} - \u81EA\u52A8\u66F4\u65B0\u8BC1\u4E66`;
    const cert = await this.getPlatformCert();
    if (this.autoUpdatePlatformCertOption.timer) {
      clearTimeout(this.autoUpdatePlatformCertOption.timer);
    }
    if (!cert) {
      err(flag, `\u66F4\u65B0\u5931\u8D25!${this.autoUpdatePlatformCertOption.retryCount * 5}\u79D2\u540E\u91CD\u8BD5!`);
      if (this.autoUpdatePlatformCertOption.retryCount > 5) {
        err(flag, `\u91CD\u8BD5\u6B21\u6570\u8D85\u8FC7\u4E0A\u9650!\u81EA\u52A8\u66F4\u65B0\u5E73\u53F0\u8BC1\u4E66\u88AB\u5173\u95ED!`);
        this.autoUpdatePlatformCert(false);
      }
      this.autoUpdatePlatformCertOption.timer = setTimeout(() => {
        this.autoUpdatePlatformCertOption.retryCount += 1;
        log(`\u7B2C${this.autoUpdatePlatformCertOption.retryCount}\u6B21\u91CD\u8BD5!`);
        this.autoUpdatePlatformCert(this.autoUpdatePlatformCertOption.schema);
      }, this.autoUpdatePlatformCertOption.retryCount * 5 * 1e3);
      return false;
    }
    switch (schema) {
      case "task":
        this.autoUpdatePlatformCertOption.timer = setTimeout(() => {
          this.autoUpdatePlatformCert("task");
        }, 60 * 1e3 * 60 * 12);
      case "onReq":
        this.setPlatformCert(cert);
        this.autoUpdatePlatformCertOption.updataAt = new Date();
        log(flag, "\u66F4\u65B0\u6210\u529F!");
    }
    return true;
  }
  verifyRes(body, headers) {
    if (this.platformCert) {
      const data = this.buildVerifyStr(headers["wechatpay-timestamp"], headers["wechatpay-nonce"], body);
      return this.sha256WithRsaVerify(this.platformCert, headers["wechatpay-signature"], data);
    }
    return "noVerify";
  }
  async closeOrder(out_trade_no) {
    const params = {
      mchid: this.config.mchid
    };
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${out_trade_no}/close`;
    const auth = this.buildRequestAuth("POST", url, params);
    const res = await this.post(url, params, auth, false);
    return { status: res.status, success: res.status === 204 };
  }
  async orderFromApp(order) {
    const params = __spreadProps(__spreadValues({}, order), {
      appid: this.config.appid,
      mchid: this.config.mchid
    });
    const url = "https://api.mch.weixin.qq.com/v3/pay/transactions/app";
    const auth = this.buildRequestAuth("POST", url, params);
    const res = await this.post(url, params, auth);
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data),
      callToPay: (perpay_id) => {
        const nonce_str = randomStr();
        const timeStamp = unixTimeStamp().toString();
        const sginStr = [this.config.appid, timeStamp, nonce_str, perpay_id].join("\n") + "\n";
        const signature = this.sha256WithRsaSign(sginStr);
        return {
          signature,
          appId: this.config.appid,
          partnerid: this.config.mchid,
          prepayid: perpay_id,
          package: "Sign=WXPay",
          noncestr: nonce_str,
          timestamp: timeStamp
        };
      }
    };
  }
  async getOrder(id, type) {
    let url = type === "out_trade_no" ? `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${id}` : `https://api.mch.weixin.qq.com/v3/pay/transactions/id/${id}`;
    url += "?mchid=" + this.config.mchid;
    const auth = this.buildRequestAuth("GET", url);
    const res = await this.get(url, auth);
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data)
    };
  }
  async getPlatformCert() {
    const url = "https://api.mch.weixin.qq.com/v3/certificates";
    const auth = this.buildRequestAuth("GET", url);
    const { headers, data, status } = await this.get(url, auth, false);
    if (status === 200 && headers) {
      const body = JSON.parse(data);
      for (let i = 0; i < body.data.length; i++) {
        const cert = body.data[i];
        if (cert.serial_no === headers["wechatpay-serial"]) {
          const rltCert = this.aesGcmDecrypt(cert.encrypt_certificate.nonce, cert.encrypt_certificate.associated_data, cert.encrypt_certificate.ciphertext);
          if (this.sha256WithRsaVerify(rltCert, headers["wechatpay-signature"], this.buildVerifyStr(headers["wechatpay-timestamp"], headers["wechatpay-nonce"], data))) {
            return rltCert;
          }
        }
      }
    }
    return void 0;
  }
  async refund(config) {
    const url = "https://api.mch.weixin.qq.com/v3/refund/domestic/refunds";
    const auth = this.buildRequestAuth("POST", url, config);
    const res = await this.post(url, config, auth);
    return {
      verify: res.verify,
      status: res.status,
      data: JSON.parse(res.data)
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WechatPay,
  request,
  utils
});
//# sourceMappingURL=index.js.map
