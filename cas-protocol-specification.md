# CAS协议规范 3.0

## 1.介绍
以下是CAS协议1.0，2.0和3.0的官方规范。

Central Authentication Service (CAS)是WEB的单点登录/单点登出（single-sign-on / single-sign-off）协议。用户仅需向central CAS Server应用程序提供一次凭证（如userid和password）就可以访问多个不同应用。

### 1.1.约定俗成
本文档中的关键字"MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL"按照[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)中的描述进行解释。

* “Client”是指终端用户或者是WEB浏览器
* “CAS Client”是指与Web集成并通过CAS协议与CAS服务器交互的应用
* “Server”是指Central Authentication Service服务器
* “Service”是指客户端试图访问的应用
* “Back-end service”是指服务代表client视图访问的应用，又称作“target service”
* “SSO”是指Single Sign on(单点登录)
* “SLO”是指Single Logout(单点登出)
* “" is a bare line feed (ASCII value 0x0a

### 1.2.参考实现
Apereo CAS-Server 是CAS协议规范的官方参考实现。
APEEO CAS服务器4.x支持CAS协议3规范。

## 2.CAS URIs
CAS是基于HTTP2,3的协议，它要求其每个组件都可通过特定的URI访问。本节将讨论每个URI：

| URI  | 描述  | 备注
| ------------ | ------------ | ------------ |
|/login	| 凭证请求者/接收者 | credential requestor / acceptor |
|/logout | CAS会话注销 | destroy CAS session (logout) |
|/validate | ST验证	| service ticket validation |
|/serviceValidate | ST验证[CAS2.0] | service ticket validation [CAS 2.0] |
|/proxyValidate |S/PT代理票根验证[CAS2.0] |service/proxy ticket validation [CAS 2.0]
|/proxy	|PT服务[CAS2.0] | proxy ticket service [CAS 2.0] |
|/p3/serviceValidate | ST验证[CAS3.0] | service ticket validation [CAS 3.0] |
|/p3/proxyValidate | S/PT验证[CAS3.0] | service/proxy ticket validation [CAS 3.0] |

### 2.1/login作为凭证请求者
/login URI有两种操作行为：作为凭证请求者和作为凭证接受者。它通过充当凭证接受者来响应凭证，否则充当凭证请求者。

如果客户端已经与CAS建立了单点登录会话，Web浏览器会向CAS传递一个包含标识TGT字符串的安全cookie。这个cookie被称作ticket-granting cookie。如果TGC里面是一个有效的TGT，CAS可以签发一个ST，这个ST可以在本规范的其他任何情况下使用。

#### 2.1.1参数
下面的HTTP请求参数可以作为证书请求者传递到 /login。它们都是区分大小写的，它们都必须[MUST]通过 /login 来处理。

* service[OPTIONAL] - 客户端试图访问的应用标识。大多数情况下，就是应用的URL。作为HTTP请求参数，该URL值必须如[RFC 3986](https://www.ietf.org/rfc/rfc3986.txt)中的第2.2节中所描述的那样进行URL编码。如果未指定服务且单点登录会话尚不存在，CAS应该[SHOULD]向用户请求凭据以发起单点登录会话。如果没有指定服务并且已经存在单点登录会话，CAS应该显示一条消息，通知客户端它已经登录。

>> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

* renew [OPTIONAL] - 如果设置了此参数，则将绕过单点登录。在这种情况下，不管是否存在单点登录会话，CAS都会要求客户端提供凭证。不能和gateway参数同时使用。重定向到/login URI和登录表单POST到/login URI的服务不应该[SHOULD NOT] 同时设置renew和gateway请求参数。 建议[RECOMMENDED]CAS实现在设置renew参数时忽略gateway参数。

* gateway [OPTIONAL] - 如果设置了此参数，CAS将不会向客户端请求凭据。如果客户端与CAS预先存在单点登录会话，或者可以通过非交互方式（即信任身份验证）建立单点登录会话，则CAS可以将客户端重定向到服务指定的URL参数，附加有效的服务ticket参数。（CAS还可以设置一个咨询页面，告知客户端已经进行了CAS身份验证。）否则不带ticket参数重定向到 service URL。如果未指定service参数且设置了gateway，则CAS的行为未定义。建议[RECOMMENDED]在这种情况下，CAS请求凭证，就好像两个参数都没有指定一样。此参数与renew参数不兼容。如果两者都已设置，则行为未定义。建议在设置gateway参数时，其值为“true”。

* method [OPTIONAL, CAS 3.0] - 发送响应时使用的方法。 虽然原生HTTP重定向（GET）可以用作默认方法，但需要POST响应的应用可以使用此参数来设置方法类型。还可以指定HEADER方法以完成CAS最终响应，例如service和ticket应该以HTTP响应头的形式返回。 由CAS服务器决定是否实现支持POST或HEADER响应。

#### 2.1.2. /login URL示例

```
# Simple login example:
https://cas.example.org/cas/login?service=http%3A%2F%2Fwww.example.org%2Fservice
 
# Don’t prompt for username/password:
https://cas.example.org/cas/login?service=http%3A%2F%2Fwww.example.org%2Fservice&gateway=true
 
# Always prompt for username/password:
https://cas.example.org/cas/login?service=http%3A%2F%2Fwww.example.org%2Fservice&renew=true
 
# Use POST responses instead of redirects:
https://cas.example.org/cas/login?method=POST&service=http%3A%2F%2Fwww.example.org%2Fservice
```

#### 2.1.3.用户名/密码验证的响应
当/login充当凭据请求者时，响应将根据其请求的凭据类型而有所不同。 在大多数情况下，CAS将通过显示请求用户名和密码的登录页面进行响应。 该页面必须包含以下参数的表单：“username”，“password”和“lt”。 也可以包含“warn”参数。如果service参数传递给/login，service也必须是这个表单的参数，值为传给/login的参数值。通过HTTP POST提交这个form到/login，此时/login会作为凭证接受者(credential acceptor)。

#### 2.1.4.信任认证的响应
信任认证作为一种基本的认证，要考虑各种各样的请求。 信任认证的用户体验就是高度详尽的部署，考虑本地策略和特定认证机制的实现。

当/login充当信任身份验证的凭据请求者时，其行为将取决于它将接收的凭证类型。 如果凭证有效，CAS可以透明地将用户重定向到服务。 或者，CAS可能会显示一条警告信息，表明存在凭据，并允许客户端确认它要使用这些凭据。 建议[RECOMMENDED]CAS实现允许部署者选择首选行为。 如果凭证无效或不存在，则建议[RECOMMENDED ]CAS向客户端显示身份验证失败的原因，并向用户显示其他可能的身份验证方法（例如用户名/密码身份验证）。

#### 2.1.5.单点登录身份验证的响应
如果客户端已经与CAS建立了单点登录会话，则客户端将携带session cookie发送到/login，并且将按照2.2.4节中的方式处理该行为。 但是，如果设置了renew参数，则将按照2.1.3节或2.1.4节中的说明处理该行为。
