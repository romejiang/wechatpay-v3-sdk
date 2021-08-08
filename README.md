# 微信支付V3



- 🛠️ 不含任何依赖

- 🛠️ 自动更新平台证书

- 🛠️ 响应自动验签




> 要求:node v15.6,基于15.6更新的crypto实现的证书读取.


      为什么要造这个轮子?
      没有找到基于官方文档的推荐做法做的模块
      没有自动更新证书,甚至都大都没做验证签名

### 安装
```javascript
  暂未上传npm
  
  没有依赖,你可以下载下来或者 👇
  git clone https://github.com/wwog/wechatpay-v3-sdk

  如果你使用的js
  全局安装esbuild 或者 typescript
  推荐使用esbuild打包,更加轻量
```

### 创建实例

```javascript 
const wechatPay = new WechatPay({
  apikeyV3: '你的v3密钥',
  appid: '你的appId',
  mchid: '你的商户id',
  privateKey: readFileSync(join(__dirname, '../apiclient_key.pem')),
  publicCert: readFileSync(join(__dirname, '../apiclient_cert.pem')),
});
```

### 开启自动更新平台证书

```javascript

//默认不开启
wechatPay.autoUpdatePlatformCert('onReq') //or
wechatPay.autoUpdatePlatformCert('task') 
/*
  符合官方的实践
  onReq:被动更新,在请求时判断当日是否更新
  task :主动更新,定时任务 12小时更新一次
 */
```
### 创建App订单

```javascript
wechatPay.orderFromApp(OrderConfig)
        .then({verify,data,status,callToPay}=>{
          //verify是该响应的验签结果. 对于敏感操作,请确保为true再执行
          if(verify){
            /*
            下面的or运算并不需要,status === 200即可确认 prepay_id存在
            但是ts类型保护不好做,所以可以使用后者判断请求是否成功
            */
            if(status === 200 || data.prepay_id){
              /*
              对于不同接口,返回的结果略有不同
              例如app下单会有一个callToPay用于返回前端所需要的值 
               */
              console.log(callToPay(data.prepay_id))
            }
          }else{
            console.log(`验签失败!!请重试`)
          }
        })

```


### 如果你想扩展他
```javascript
WechatPay {
  constructor: [Function: WechatPay],
  //构建认证头数据
  buildRequestAuth: [Function (anonymous)],
  //给微信发post,带有验签,可传参取消
  post: [Function (anonymous)],
  //给微信发get,带有验签,可传参取消
  get: [Function (anonymous)],
  //app下单
  orderFromApp: [Function (anonymous)],
  //获取订单号
  getOrder: [Function (anonymous)],
  //获取证书,当你选择自动更新时该方法就不要用了
  //如果你选择自行添加任务,请在获取后调用父类WechatPayV3的setPlatformCert让验签能够工作
  getPlatformCert: [Function (anonymous)],
  //自动更新证书
  autoUpdatePlatformCert: [Function (anonymous)],
  //验证响应
  verifyRes: [Function (anonymous)]
}
WechatPayV3
//除了uuid和setPlatformCert其余都是私有方法
{
  //设置平台证书
  setPlatformCert: [Function (anonymous)],
  //内置的uuid功能函数
  uuid: [Function (anonymous)],
  //获取获取请求签名串
  getSignature: [Function (anonymous)],
  //获取授权头
  getAuthorization: [Function (anonymous)],
  //签名
  sha256WithRsaSign: [Function (anonymous)],
  //验签
  sha256WithRsaVerify: [Function (anonymous)],
  //解密
  aesGcmDecrypt: [Function (anonymous)],
  //构建验签文本
  buildVerifyStr: [Function (anonymous)]
}
utils
//一些功能函数,当你需要扩展该模块时
{
  randomStr: [Function: randomStr],
  unixTimeStamp: [Function: unixTimeStamp],
  getCertificateSerialNo: [Function: getCertificateSerialNo],
  utf8Tobase64: [Function: utf8Tobase64],
  base64ToUtf8: [Function: base64ToUtf8],
  delEmpty: [Function: delEmpty],
  urlExclueOrigin: [Function: urlExclueOrigin],
  trimBlank: [Function: trimBlank],
  allStrLen: [Function: allStrLen],
  log: [Function: log],
  err: [Function: err],
  warn: [Function: warn],
  intervalDays: [Function: intervalDays],
  promiseTry: [Function: promiseTry]
}
request
{
  request:[Function:request]
}
```
