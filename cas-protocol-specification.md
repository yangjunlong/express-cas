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

> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

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

### 2.2./login作为凭证接受者
当一组接受的凭证传递给/login时，/login充当凭证接受者，其行为在本节中定义。

#### 2.2.1.所有身份验证类型的通用参数
当/login作为凭证接受者时，下面的HTTP请求参数可能[MAY]被传递给/login。 它们都是区分大小写的，它们都必须由/login处理。

* service [OPTIONAL] - 客户端尝试访问的应用的URL。作为HTTP请求参数，此URL值必须按照[RFC 1738](https://www.ietf.org/rfc/rfc1738.txt)的第2.2节中的描述进行URL编码。 CAS必须在成功验证后将客户端重定向到此URL。这将在第2.2.4节中详细讨论。 如果CAS服务器以非打开模式运行（允许使用CAS服务器的服务URL在CAS服务器中注册），则CAS服务器必须拒绝操作，并在出现未授权的服务URL时打印出有意义的消息。

> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

* warn [OPTIONAL] - 设置了这个参数，单点登录一定不[MUST NOT]是透明的。客户端被认证到另一个服务前必须[MUST]被提示。
* method [OPTIONAL] - 发送响应时使用的方法。 详情请参阅第2.1.1节。

#### 2.2.2.用户/密码认证的参数
除了第2.2.1节中指定的OPTIONAL参数之外，当作为用户名/密码身份验证的凭据接受者时，以下HTTP请求参数必须[MUST]被传递给/login。 它们都是区分大小写的。

* username [REQUIRED] - 尝试登录的客户端的用户名
* password [REQUIRED] - 尝试登录的客户端的密码
* lt [OPTIONAL] - login ticket。 这是作为第2.1.3节中讨论的登录表单的一部分提供的。 登录票根本身将在第3.5节中讨论。
* rememberMe [OPTIONAL, CAS 3.0] - 如果设置了此参数，CAS服务器可能会创建一个长期票证授予票根（Long-Term Ticket Granting Ticket）（称为Remember-Me支持）。 这受限于CAS服务器配置是否支持长期票证授予票根。

> 注意：当CAS服务器支持 长期票证授予票证（记住我）时，必须考虑安全性因素。 例如，在共享计算机上使用。 在CAS客户端系统上，可能需要处理不同的Remember-Me登录。 详细信息请参见4.1节。

#### 2.2.3.信任认证的参数
信任身份验证没有REQUIRED HTTP请求参数。 信任认证可以[MAY]基于HTTP请求的任何方面。

#### 2.2.4.响应
当/login作为凭证接受者时，必须提供以下响应之一。

* successful login:在不将客户端凭证传递到service的情况下，重定向客户端请求到"service"参数指定的URL。这种重定向的结果必须[MUST]导致客户端向服务端发出GET请求。请求必须[MUST]包含一个有效的ST（Service Ticket），作为HTTP请求参数传递，它就是"ticket"。有关更多信息，请参见附录B. 如果未指定服务，CAS必须[MUST]显示一条消息，通知客户端已成功开启单点登录会话。

* failed login:作为凭证请求者返回给/login。在这种情况下建议CAS服务器向用户显示错误消息，描述登录失败的原因（例如，密码错误，锁定帐户等），并且如果合适，为用户提供尝试再次登录的机会。

### 2.3./logout
/logout用于销毁客户端的CAS单点登录会话。ticket-granting cookie(TGC)（第3.6节）被销毁，随后请求/login的将不会获得ST，直到用户再次提交主凭证（从而建立新的单点登录会话）。

#### 2.3.1.参数
下面的HTTP请求参数可能[MAY]被传递给/logout。 它们都是区分大小写的，它们都必须由/logout处理。

service [OPTIONAL, CAS 3.0] - 如果指定了service参数，则在CAS服务器执行注销后，浏览器可能会自动重定向到service指定的URL。 CAS服务器是否实际执行重定向取决于服务器配置。 作为HTTP请求参数，服务值必须[MUST]按照[RFC 1738](https://www.ietf.org/rfc/rfc1738.txt)的2.2节中的描述进行URL编码。

> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

> 注意：CAS 2.0规范中定义的url参数不再是CAS 3.0中的有效参数。 CAS服务器必须忽略给定的url参数。 CAS客户端可以提供如上所述的服务参数，因为这确保了在非打开模式下操作时针对注册的服务URL验证参数。 详情请参见2.3.2。

#### 2.3.2.响应
[CAS 1.0，CAS 2.0] /logout必须[MUST]展示一个页面，说明用户已经注销。 如果“url”请求参数有效，/logout还应该[SHOULD]提供一个链接指向第2.3.1节中所述中提供的URL。

[CAS 3.0] /logout必须[MUST]展示一个页面，说明如果用户注销时没有提供service参数。 如果提供了带有编码URL值的服务请求参数，则CAS服务器会在成功注销后重定向到service参数设置的URL。

> 注意：当CAS服务器以非开放模式运行时（允许的服务URL在CAS服务器中注册），CAS服务器必须确保只接受已注册的[服务]参数服务URL进行重定向。 前CAS 2.0规范中定义的url参数不再是CAS 3.0中的有效参数。 CAS服务器必须忽略给定的url参数。

#### 2.3.3.单点登出
CAS服务器可以[MAY]支持单点注销（SLO）。 SLO意味着用户不仅从CAS服务器登出，而且还从所有访问过的CAS客户端应用登出。 如果CAS服务器支持SLO，一旦ticket-granting cookie被用户显式的置为过期 （例如在注销期间），CAS服务器必须发送包含注销XML文档的HTTP POST请求（参见附录C）到CAS会话期间提供给CAS的所有service URLs。 不支持SLO POST的 CAS Clients必须忽略这些请求。 TGT idle 超时时也可能[MAY]由CAS Server触发SLO请求。

##### 2.3.3.1.服务器行为
CAS服务器应该[SHALL]忽略对CAS客户端应用service URL的单一/logout POST请求可能发生的所有错误。 这可确保发送POST请求时的任何错误都不会干扰CAS Server的性能和可用性(“fire and forget”)。

##### 2.3.3.2.客户端行为
处理/logout POST请求数据取决于CAS客户端。 建议从SLO POST请求中发送的ST标识所标识的应用中注销用户。 如果客户端支持SLO POST请求处理，则客户端应返回HTTP成功状态码。

### 2.4./validate [CAS 1.0]
/validate检验ST的有效性。 /validate是CAS 1.0协议的一部分，因此不处理代理(proxy)身份验证。 当PT传递给/validate时，CAS必须返回ticket验证失败的响应。

#### 2.4.1.参数
下面的HTTP请求参数可能[MAY]被传递给/validate。 它们区分大小写，必须由/validate处理。

* service [REQUIRED] - 发出ticket的服务的标识符，如第2.2.1节中所述。 作为HTTP请求参数，service参数值必须按照[RFC 1738](https://www.ietf.org/rfc/rfc1738.txt)的2.2节中的描述进行URL编码。

> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

* ticket [REQUIRED] - /login发出的ST。 ST在3.1节中有所描述。
* renew [OPTIONAL] - 如果设置了此参数，则仅当从用户主凭证发出ST时，才会通过验证。 如果票根是从单点登录会话发出的，将验证失败。

#### 2.4.2.响应
/validate将返回以下两个响应之一：

* 在票证验证成功时：yes
* 在票证验证失败时：no

#### 2.4.3./validate URL 示例

```
# Simple validation attempt:
https://cas.example.org/cas/validate?service=http%3A%2F%2Fwww.example.org%2Fservice&ticket=ST-1856339-aA5Yuvrxzpv8Tau1cYQ7
 
# Ensure service ticket was issued by presentation of primary credentials:
https://cas.example.org/cas/validate?service=http%3A%2F%2Fwww.example.org%2Fservice&ticket=ST-1856339-aA5Yuvrxzpv8Tau1cYQ7&renew=true
```

### 2.5. /serviceValidate [CAS 2.0]

/serviceValidate检查ST的有效性并返回XML片段响应。/serviceValidate还必须[MUST]在请求时生成并发出PGT。如果 /serviceValidate 只是收到 proxy ticket，则不得[MUST NOT]返回成功的身份验证。 建议[RECOMMENDED]如果/serviceValidate收到proxy ticket，应该在返回的XML响应的错误消息里说明失败原因，原因是proxy ticket已传递给/serviceValidate。即：/serviceValidate不负责校验 proxy ticket。

#### 2.5.1.参数
下面的HTTP请求参数可能[MAY]被传递给 /serviceValidate。它们都区分大小写且必须[MUST] 由 /serviceValidate 来处理。

* service [REQUIRED] - 发出ticket的服务的标识符，如第2.2.1节中所述。 作为HTTP请求参数，service参数值必须按照[RFC 1738](https://www.ietf.org/rfc/rfc1738.txt)的2.2节中的描述进行URL编码。

> 注意：强烈建议通过服务管理工具(service management tool)过滤所有服务URIs，以便只有授权和已知的客户端应用才能使用CAS服务器，否则会增加增加服务攻击和其他安全漏洞的风险。此外，建议客户端应用仅允许安全协议（如https）以进一步加强身份验证客户端。

* ticket [REQUIRED] - /login发出的ST。 ST在3.1节中有所描述。

* pgtUrl [OPTIONAL] - 代理回调的URL。 将在2.5.4节中讨论。 作为HTTP请求参数，“pgtUrl”值必须按照[RFC 1738](https://www.ietf.org/rfc/rfc1738.txt)的2.2节中的描述进行URL编码。

* renew [OPTIONAL] - 如果设置了此参数，则仅当从用户主凭证发出ST时，才会通过验证。 如果票根是从单点登录会话发出的，将验证失败。

* format [OPTIONAL] - 如果设置了此参数，则必须[MUST]根据参数值生成票证验证响应。 支持的值是XML和JSON。 如果未设置此参数，则将默认使用XML格式。 如果CAS服务器不支持参数值，则必须返回错误代码，如2.5.3节所述。

#### 2.5.2.响应
/serviceValidate 将返回XML格式的CAS serviceResponse，如附录A中的XML模式所述。下面是示例响应：

当ticket验证成功：
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
 <cas:authenticationSuccess>
  <cas:user>username</cas:user>
  <cas:proxyGrantingTicket>PGTIOU-84678-8a9d...</cas:proxyGrantingTicket>
 </cas:authenticationSuccess>
</cas:serviceResponse>
```

```javascript
{
  "serviceResponse" : {
    "authenticationSuccess" : {
      "user" : "username",
      "proxyGrantingTicket" : "PGTIOU-84678-8a9d..."
    }
  }
}
```

当ticket验证失败：
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
 <cas:authenticationFailure code="INVALID_TICKET">
    Ticket ST-1856339-aA5Yuvrxzpv8Tau1cYQ7 not recognized
  </cas:authenticationFailure>
</cas:serviceResponse>
```

```
{
  "serviceResponse" : {
    "authenticationFailure" : {
      "code" : "INVALID_TICKET",
      "description" : "Ticket ST-1856339-aA5Yuvrxzpv8Tau1cYQ7 not recognized"
    }
  }
}
```

对于代理的相应信息, 请查看 2.6.2 节。

#### 2.5.3.错误码
下面的值可能[MAY]被用作身份验证失败响应的“code”属性的值。 以下是所有CAS服务器必须实现的最小错误代码集。 具体实现可能[MAY]包括不限于下面列出的值。

* INVALID_REQUEST - 请求参数不全。上面讲到至少必须有 “service”和“ticket”两个参数。
* INVALID_TICKET_SPEC - 未能满足验证规范的要求
* UNAUTHORIZED_SERVICE_PROXY - 该服务未被授权执行代理身份验证
* INVALID_PROXY_CALLBACK - 指定的代理回调无效。 为代理身份验证指定的凭据不符合安全要求
* INVALID_TICKET - 提供的ticket无效，或者你的renew参数设置了true，而不是从/login过来的。 XML响应中的<cas：authenticationFailure>块的主体应该[SHOULD]描述确切的细节。
* INVALID_SERVICE - 提供的ticket有效，但和服务规定的ticket不匹配。 CAS必须使这张ticket失效，并且禁止以后在验证此ticket。
* INTERNAL_ERROR - 在ticket验证期间发生内部错误

对于所有错误代码，推荐[RECOMMENDED]在CAS返回的XML响应块<cas：authenticationFailure>的主体中提供更详细的消息。

#### 2.5.4.代理回调
如果一个服务希望将客户端的身份验证代理到后端服务，则它必须获得一个PGT（proxy-granting ticket 代理授予凭证）。 通过代理回调URL处理此票证的获取。 此URL将唯一且安全地标识代理客户端身份验证的服务。 然后，后端服务可以基于代理服务识别回调URL来决定是否接受凭证。

代理回调机制的工作原理如下：

1. The service that is requesting a proxy-granting ticket (PGT) specifies upon initial service ticket or proxy ticket validation the HTTP request parameter “pgtUrl” to /serviceValidate (or /proxyValidate). This is a callback URL of the service to which CAS will connect to verify the service’s identity. This URL MUST be HTTPS and CAS MUST evaluate the endpoint to establish peer trust. Building trust at a minimum involves utilizing PKIX and employing container trust to validate the signature, chain and the expiration window of the certificate of the callback url. The generation of the proxy-granting-ticket or the corresponding proxy granting ticket IOU may fail due to the proxy callback url failing to meet the minimum security requirements such as failure to establishing trust between peers or unresponsiveness of the endpoint, etc. In case of failure, no proxy-granting ticket will be issued and the CAS service response as described in Section 2.5.2 MUST NOT contain a <proxyGrantingTicket> block. At this point, the issuance of a proxy-granting ticket is halted and service ticket validation will fail. Otherwise, the process will proceed normally to step 2.

2. CAS uses an HTTP GET request to pass the HTTP request parameters pgtId and pgtIou to the pgtUrl endpoint. These entities are discussed in Sections 3.3 and 3.4, respectively. If the proxy callback url specifies any parameters, those MUST be preserved. CAS MUST also ensure that the endpoint is reachable by verifying the response HTTP status code from the GET request, as detailed in step #3. If the proxy service fails to authenticate or the endpoint responds with an unacceptable status code, proxy authentication MUST fail and CAS MUST respond with the appropriate error code as is described in section 2.5.3.

3. If the HTTP GET returns an HTTP status code of 200 (OK), CAS MUST respond to the /serviceValidate (or /proxyValidate) request with a service response (Section 2.5.2) containing the proxy-granting ticket IOU (Section 3.4) within the <cas:proxyGrantingTicket> block. If the HTTP GET returns any other status code, except HTTP 3xx redirects, CAS MUST respond to the /serviceValidate (or /proxyValidate) request with a service response that MUST NOT contain a <cas:proxyGrantingTicket> block. CAS MAY follow any HTTP redirects issued by the pgtUrl. However, the identifying callback URL provided upon validation in the <proxy> block MUST be the same URL that was initially passed to /serviceValidate (or /proxyValidate) as the pgtUrl parameter.

4. The service, having received a proxy-granting ticket IOU in the CAS response, and both a proxy-granting ticket and a proxy-granting ticket IOU from the proxy callback, will use the proxy-granting ticket IOU to correlate the proxy-granting ticket with the validation response. The service will then use the proxy-granting ticket for the acquisition of proxy tickets as described in Section 2.7.

#### 2.5.5.属性 [CAS 3.0]
[CAS 3.0]响应文档可以[MAY]包含用于其他身份验证 和/或 用户属性的可选元素。 有关详细信息，请参阅[附录A]（<＃head_appdx_a>）

#### 2.5.6. /serviceValidate URL 示例
```
# Simple validation attempt:
https://cas.example.org/cas/serviceValidate?service=http%3A%2F%2Fwww.example.org%2Fservice&ticket=ST-1856339-aA5Yuvrxzpv8Tau1cYQ7
 
# Ensure service ticket was issued by presentation of primary credentials:
https://cas.example.org/cas/serviceValidate?service=http%3A%2F%2Fwww.example.org%2Fservice&ticket=ST-1856339-aA5Yuvrxzpv8Tau1cYQ7&renew=true
 
# Pass in a callback URL for proxying:
https://cas.example.org/cas/serviceValidate?service=http%3A%2F%2Fwww.example.org%2Fservice&ticket=ST-1856339-aA5Yuvrxzpv8Tau1cYQ7&pgtUrl=https://www.example.org%2Fservice%2FproxyCallback
```

#### 2.5.7.自定义属性的响应示例
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
   <cas:authenticationSuccess>
     <cas:user>username</cas:user>
     <cas:attributes>
       <cas:firstname>John</cas:firstname>
       <cas:lastname>Doe</cas:lastname>
       <cas:title>Mr.</cas:title>
       <cas:email>jdoe@example.org</cas:email>
       <cas:affiliation>staff</cas:affiliation>
       <cas:affiliation>faculty</cas:affiliation>
     </cas:attributes>
     <cas:proxyGrantingTicket>PGTIOU-84678-8a9d...</cas:proxyGrantingTicket>
   </cas:authenticationSuccess>
 </cas:serviceResponse>
```

```javascript
{
  "serviceResponse" : {
    "authenticationSuccess" : {
      "user" : "username",
      "proxyGrantingTicket" : "PGTIOU-84678-8a9d...",
      "proxies" : [ "https://proxy1/pgtUrl", "https://proxy2/pgtUrl" ],
      "attributes" : {
        "firstName" : "John",
        "affiliation" : [ "staff", "faculty" ],
        "title" : "Mr.",
        "email" : "jdoe@example.orgmailto:jdoe@example.org",
        "lastname" : "Doe"
      }
    }
  }
}
```

### 2.6. /proxyValidate [CAS 2.0]
/proxyValidate必须执行与/serviceValidate相同的验证任务，并且还有验证PT。 /proxyValidate必须[MUST]能够验证ST和PT。 详细信息请参见第2.5.4节。

#### 2.6.1.参数
/proxyValidate与/serviceValidate具有相同的参数要求。 见2.5.1节。

#### 2.6.2.响应
/proxyValidate 将返回XML格式的CAS serviceResponse，如附录A中的XML模式所述。下面是示例响应：

ticket验证成功的响应：
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
   <cas:authenticationSuccess>
     <cas:user>username</cas:user>
     <cas:proxyGrantingTicket>PGTIOU-84678-8a9d...</cas:proxyGrantingTicket>
     <cas:proxies>
       <cas:proxy>https://proxy2/pgtUrl</cas:proxy>
       <cas:proxy>https://proxy1/pgtUrl</cas:proxy>
     </cas:proxies>
   </cas:authenticationSuccess>
 </cas:serviceResponse>
```
```javascript
{
  "serviceResponse" : {
    "authenticationSuccess" : {
      "user" : "username",
      "proxyGrantingTicket" : "PGTIOU-84678-8a9d...",
      "proxies" : [ "https://proxy1/pgtUrl", "https://proxy2/pgtUrl" ]
    }
  }
}
```

> 注意：当身份验证通过多个代理进行时，代理列表的顺序必须[MUST]反映在<cas:proxies>块中。 最近访问过的代理必须在代理列表的第一个代理，然后按照代理的新旧顺序一次附加到代理列表上。 在上面的示例中，服务确定的第一个访问代理地址是：<https://proxy1/pgtUrl>，该服务的代理认证是依靠<https://proxy2/pgtUrl>辨别出来的。

ticket验证失败的响应：
```xml
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
    <cas:authenticationFailure code="INVALID_TICKET">
        ticket PT-1856376-1HMgO86Z2ZKeByc5XdYD not recognized
    </cas:authenticationFailure>
</cas:serviceResponse>
```

```
{
  "serviceResponse" : {
    "authenticationFailure" : {
      "code" : "INVALID_TICKET",
      "description" : "Ticket PT-1856339-aA5Yuvrxzpv8Tau1cYQ7 not recognized"
    }
  }
}
```

#### 2.6.3.错误码
见2.5.3节。

#### 2.6.4./proxyValidate URL 示例
/proxyValidate接受与/serviceValidate相同的参数。 有关使用示例，请参见第2.5.5节，将“proxyValidate”替换为“serviceValidate”。

### 2.7. /proxy [CAS 2.0]
/proxy为已获取PGT的服务提供PT，并将代理对后端服务的身份验证。

#### 2.7.1.参数
必须[MUST]为/proxy指定以下HTTP请求参数。 它们都是区分大小写的。

* pgt [REQUIRED] - ST或PT验证期间服务获取的PGT。
* targetService [REQUIRED] - 后端服务的服务标识符。 请注意，并非所有后端服务都是Web服务，因此此服务标识符并不总是URL。 但是，此处指定的服务标识符必须与验证PT时指定给/proxyValidate的服务参数匹配。

#### 2.7.2.响应
/proxy将返回XML格式的CAS serviceResponse文档，如附录A中的XML模式所述。下面是示例响应：

请求成功的响应：
```xml
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
    <cas:proxySuccess>
        <cas:proxyTicket>PT-1856392-b98xZrQN4p90ASrw96c8</cas:proxyTicket>
    </cas:proxySuccess>
</cas:serviceResponse>
```
```javascript
{
  "serviceResponse" : {
    "proxySuccess" : {
      "proxyTicket" : "PT-1856392-b98xZrQN4p90ASrw96c8"
    }
  }
}
```

请求失败的响应：
```
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
    <cas:proxyFailure code="INVALID_REQUEST">
        'pgt' and 'targetService' parameters are both required
    </cas:proxyFailure>
</cas:serviceResponse>
```
```
{
  "serviceResponse" : {
    "proxyFailure" : {
      "code" : "INVALID_REQUEST",
      "description" : "'pgt' and 'targetService' parameters are both required"
    }
  }
}
```

#### 2.7.3.错误码
下面的值可能被用作身份验证失败响应的“code”属性的值。 以下是所有CAS服务器必须实现的最小错误代码集。 具体实现可能[MAY]包括但不限于下面列出的值。

* INVALID_REQUEST - 请求参数不全。上面讲到至少必须有 “service”和“ticket”两个参数。
* UNAUTHORIZED_SERVICE - 服务未经授权执行代理请求
* INTERNAL_ERROR - 在ticket验证期间发生内部错误
对于所有错误代码，推荐[RECOMMENDED]在CAS返回的XML响应块<cas：proxyFailure>的主体中提供更详细的消息。

#### 2.7.4. /proxy URL 示例

```
# Simple proxy request:
https://server/cas/proxy?targetService=http%3A%2F%2Fwww.service.com&pgt=PGT-490649-W81Y9Sa2vTM7hda7xNTkezTbVge4CUsybAr
```

#### 2.7.5.ST生存期的意义
CAS服务器可以[MAY]实现在PT生成时更新父ST生存期。

### 2.8./p3/serviceValidate [CAS 3.0]
/p3/serviceValidate必须执行与/serviceValidate相同的验证任务，并在CAS响应中额外返回用户的属性信息。 有关详细信息，请参见第2.5节和第2.5.7节。

#### 2.8.1.参数
/p3/serviceValidate与/serviceValidate具有相同的参数要求。 见2.5.1节。

### 2.9./p3/proxyValidate [CAS 3.0]
/p3/proxyValidate必须执行与/p3/serviceValidate相同的验证任务，并另外验证PT。 见2.8节。

#### 2.9.1.参数
/p3/proxyValidate与/p3/serviceValidate具有相同的参数要求。 见2.8.1节。

## 3. CAS Entities
### 3.1. service ticket
ST是一个不透明的字符串，客户端用来作为凭证以获取访问的服务。 如第2.2节所述，ST是CAS根据客户端传递的凭证和服务标识符到/login产生的。

#### 3.1.1.ST的属性

* 只有请求/login时附加了service参数，CAS才会生成ST，服务标识符不应[SHOULD NOT]属于ST。
* ST必须[MUST]仅被尝试验证一次。 无论验证是否成功，CAS必须使改ST无效，以使得今后拒绝再验证同一个PT。
* CAS应该[SHOULD]在一段合理的时间内终止一个没有通过验证的ST。如果一个服务使用了过期的ST，CAS必须[MUST]以验证失败作为响应。
* 建议[RECOMMENDED]验证的响应包含一个描述验证失败原因的描述性消息。
* 建议ST的有效期不超过5分钟， 要结合本地安全性和CAS使用注意事项来确定未经验证的ST的最佳生命周期。
* STs必须[MUST]包含足够的安全随机数据，以便PT不可猜测。
* STs必须[MUST]以字符ST-开头。
* 服务必须[MUST]能够接受长度超过32个字符的服务票据。 建议服务支持最多256个字符的服务票据。

### 3.2. proxy ticket
代理票证是一个不透明的字符串，服务使用该字符串作为凭证来代表客户端获取对后端服务的访问权限。 代理票证是根据CAS提供的有效代理授予票证（第3.3节），以及它所连接的后端服务的服务标识符产生的。

#### 3.2.1. PT的属性

* 代理票证仅对生成时指定给/proxy的服务标识符有效。 服务标识符不应[SHOULD NOT]属于PT。
* PT必须[MUST]仅被尝试验证一次。 无论验证是否成功，CAS必须使PT无效，以使得今后拒绝再验证同一个PT。
* CAS应该[SHOULD]在一段合理的时间内终止一个没有通过验证的PT。如果一个服务使用了过期的PT，CAS必须[MUST]以验证失败作为响应。
* 建议[RECOMMENDED]验证的响应包含一个描述验证失败原因的描述性消息。
* 建议PT的有效期不超过5分钟， 要结合本地安全性和CAS使用注意事项来确定未经验证的PT的最佳生命周期。
* PTs必须[MUST]包含足够的安全随机数据，以便PT不可猜测。
* PTs必须[MUST]以字符PT-开头。
* 服务必须[MUST]能够接受长度超过32个字符的PT。 建议服务支持最多256个字符的服务票据。

### 3.3. proxy-granting ticket
代理授予票证（PGT）是一个不透明的字符串，服务使用该字符串来获取代表客户端访问后端服务的PT。 PGT是在验证服务票证或代理票证时从CAS获得的。PGT的发布在第2.5.4节中有详细描述。

#### 3.3.1.PGT的属性

* 服务可以[MAY]使用PGT来获取多个PT。 PGT不是一次性票证。
* 被代理的身份验证客户端如果退出了CAS，PGT必须被终止(过期)。
* PGT必须[MUST]包含足够的安全随机数据，使它在一段合理的时间内不会被暴力攻击获得。
* PGT应该[SHOULD]以字符PGT-开头。
* 服务必须[MUST]能够处理超过64个字符的PGT。
* 建议服务支持长度256个字符的PGT。

### 3.4. proxy-granting ticket IOU
PGT IOU是一个不透明的字符串，放在/serviceValidate和/proxyValidate提供的响应中，用于将ST或PT验证与特定的PGT相关联。 有关此过程的完整说明，请参见第2.5.4节。

#### 3.4.1. PGT IOU的属性
* PGT IOUs不应该[SHOULD NOT]包含对其相关PGT的任何引用。 给定一个特定的PGT IOU，不可能在合理的时间段内通过算法方法导出其相应的PGT。
* PGT IOUs必须[MUST]包含足够的安全随机数据，使它在一段合理的时间内不会被暴力攻击获得。
* PGT IOUs应该[SHOULD]以字符PGTIOU-开头。
服务必须[MUST]能够接受长度超过64个字符的PGT IOUs。 建议服务支持最多256个字符的服务票据。

### 3.5. login ticket
LT是一个可选字符串，可以由/login作为凭证请求者提供，并作为凭证接受者传递给/login进行用户名/密码验证。 其目的是防止由于Web浏览器中的错误而重用凭证。

#### 3.5.5.LT的属性

* 由/login发出的LTs必须是唯一的。
* LTs必须[MUST]仅被尝试验证一次。 无论验证是否成功，CAS必须使LT无效，以使得今后拒绝再验证同一个LT。
* LTs应该[SHOULD]以字符LT-开头。

### 3.6. ticket-granting cookie
TGC是CAS在建立单点登录会话时设置的HTTP cookie 。 此cookie维护客户端的登录状态，并且当它有效时，客户端可以将其呈现给CAS以代替主认证凭据。 服务可以通过第2.1.1,2.4.1和2.5.1节中描述的“renew”参数选择退出单点登录。

#### 3.6.1.TGC的属性

* 如果相应的TGT长期支持未激活（4.1.1），则TGC应[SHALL]设置为在客户端浏览器会话结束时到期。
* CAS应将cookie路径设置为尽可能限制。 例如，如果CAS服务器设置在路径/cas下，则cookie路径应设置为/cas。
* TGC必须[MUST]包含足够的安全随机数据，以便TGC不可猜测。
* TGC应该[SHOULD]以字符TGC-开头。
* TGC的值应该遵循与TGT相同的规则。 通常，TGC的值可以[MAY]包含TGT本身作为经过身份验证的单点登录会话的表示。

### 3.7. ticket and ticket-granting cookie character set
除了上述要求之外，所有CAS票证和TGC的值必须仅包含集合{A-Z，a-z，0-9}和连字符 - 中的字符。

### 3.8. ticket-granting ticket
票证授予票证（TGT）是一个不透明的字符串，由CAS服务器生成，在访问/login登录成功时发出。 TGT可以[MAY]与TGC相关联，该TGC表示单点登录会话的状态，具有有效期并且作为发布ST，PGT等的基础和基线。

#### 3.8.1 TGT的属性

* 服务可以[MAY]使用TGT来获得多个STs。 TGT不是一次性票证，并且与有效期和到期策略相关联。
* 当正在管理其身份认证的客户端退出CAS时，TGT必须到期。
* TGTs必须[MUST]包含足够的安全随机数据，使它在一段合理的时间内不会被暴力攻击获得。
* TGTs应该[SHOULD]以字符TGT-开头。
* 建议在与其他外部资源共享时对TGTs进行加密，以便最大限度地减少安全漏洞，因为它们与TGT绑定并代表身份验证会话。

## 4.Optional Features
### 4.1.Long-Term Tickets - Remember-Me [CAS 3.0]
CAS Server可以支持LTGTs（称为“记住我”功能）。 如果CAS服务器支持此功能，只要CAS服务器中的LTGT未过期且浏览器TGC Cookie有效，就可以对CAS服务器（执行重复，非交互式）重新登录。

#### 4.1.1.Enabling Remember-Me (Login Page)
CAS服务器必须[MUST]在登录页面上提供一个复选框，以允许记住我的功能。
默认情况下，必须[MUST]取消选中该复选框。
用户必须[MUST]选择是否启用Remember-Me进行登录。 见2.2.2节。

#### 4.1.2 Security implications
启用Remember-Me可能会产生安全隐患。 由于CAS身份验证绑定到浏览器，并且当存在有效的LTGT并且浏览器提供的CAS cookie有效时，用户没有以交互方式登录，因此必须特别注意CAS客户端到处理Remember-Me正确登录。 必须由CAS客户负责决定是否以及何时可以特别处理Remember-Me CAS登录。 见4.1.3。

#### 4.1.3 CAS Validation Response Attributes
由于只有CAS客户端必须[MUST]决定如何处理Remember-Me登录（见4.2.1），CAS服务器必须提供有关到CAS客户端的Remember-Me登录的信息。 在这种情况下，此信息必须由CAS服务器支持的所有票证验证方法提供（参见第2.5,2.6和2.8节）。

在serviceValidate XML响应中（参见附录A），必须由longTermAuthenticationRequestTokenUsed属性指示记住我的登录。 此外，isFromNewLogin属性可用于确定这是否具有安全隐患。
在SAML验证响应中，Remember-Me必须由longTermAuthenticationRequestTokenUsed属性指示。

#### 4.1.4 CAS Client requirements
如果CAS客户端需要特殊处理Remember-Me登录（例如，在记住的登录时拒绝访问CAS客户端应用程序的敏感区域），则CAS客户端不得使用/validate CAS验证URL，因为此URL不支持CAS 验证响应文档中的属性。

#### 4.1.5 Long-Term ticket-granting cookie properties
当CAS服务器创建LTGT时，TGC不得在3.6.1中定义的客户端浏览器会话结束时到期。 相反，TGC将在定义的Long-Term TGT票证生命周期到期。

LTGT的生命周期的定义取决于CAS服务器实现者。LTGT的生命周期不得超过3个月。

### 4.2 /samlValidate [CAS 3.0]
/samlValidate通过HTTP POST提供的SAML 1.1请求文档检查ST的有效性。 必须返回SAML（安全访问标记语言）7 1.1响应文档。 这允许释放经过身份验证的NetID的其他信息（属性）。 安全断言标记语言（SAML）描述了一种文档和协议框架，通过该框架可以交换安全断言（例如关于先前的认证行为的断言）。

#### 4.2.1.参数
必须将以下HTTP请求参数传递给/samlValidate。 它们都是区分大小写的

TARGET [REQUIRED] -后端服务的URL编码服务标识符。 请注意，作为HTTP请求参数，此URL值必须按照RFC 1738的第2.2节中的描述进行URL编码。 此处指定的服务标识符必须与提供给/login的服务参数匹配。 见2.1.1节。 TARGET服务应使用HTTPS。 SAML属性不得发布到非SSL站点。

#### 4.2.2.HTTP Request Method and Body
请求/samlValidate必须是HTTP POST请求。 请求主体必须是文档类型为“text/xml”的有效SAML 1.0或1.1请求XML文档。

#### 4.2.3.SAML request values

* RequestID [REQUIRED]  - 请求的唯一标识符
* IssueInstant [REQUIRED]  - 请求的时间戳
* samlp：AssertionArtifact [REQUIRED]  - 在登录时作为响应参数获取的有效CAS ST。 见2.2.4节。

#### 4.2.4 /samlValidate POST请求示例

```
POST /cas/samlValidate?TARGET=
Host: cas.example.com
Content-Length: 491
Content-Type: text/xml
```

```xml
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Header/>
    <SOAP-ENV:Body>
        <samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1" MinorVersion="1" RequestID="_192.168.16.51.1024506224022" IssueInstant="2002-06-19T17:03:44.022Z">
            <samlp:AssertionArtifact>ST-1-u4hrm3td92cLxpCvrjylcas.example.com</samlp:AssertionArtifact>
        </samlp:Request>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
```

#### 4.2.5 SAML response
CAS服务器对/samlValidate请求的响应。必须是SAML 1.1响应。

SAML 1.1验证响应示例：
```xml
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header />
  <SOAP-ENV:Body>
    <Response xmlns="urn:oasis:names:tc:SAML:1.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:1.0:assertion"
    xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" IssueInstant="2008-12-10T14:12:14.817Z"
    MajorVersion="1" MinorVersion="1" Recipient="https://eiger.iad.vt.edu/dat/home.do"
    ResponseID="_5c94b5431c540365e5a70b2874b75996">
      <Status>
        <StatusCode Value="samlp:Success">
        </StatusCode>
      </Status>
      <Assertion xmlns="urn:oasis:names:tc:SAML:1.0:assertion" AssertionID="_e5c23ff7a3889e12fa01802a47331653"
      IssueInstant="2008-12-10T14:12:14.817Z" Issuer="localhost" MajorVersion="1"
      MinorVersion="1">
        <Conditions NotBefore="2008-12-10T14:12:14.817Z" NotOnOrAfter="2008-12-10T14:12:44.817Z">
          <AudienceRestrictionCondition>
            <Audience>
              https://some-service.example.com/app/
            </Audience>
          </AudienceRestrictionCondition>
        </Conditions>
        <AttributeStatement>
          <Subject>
            <NameIdentifier>johnq</NameIdentifier>
            <SubjectConfirmation>
              <ConfirmationMethod>
                urn:oasis:names:tc:SAML:1.0:cm:artifact
              </ConfirmationMethod>
            </SubjectConfirmation>
          </Subject>
          <Attribute AttributeName="uid" AttributeNamespace="http://www.ja-sig.org/products/cas/">
            <AttributeValue>12345</AttributeValue>
          </Attribute>
          <Attribute AttributeName="groupMembership" AttributeNamespace="http://www.ja-sig.org/products/cas/">
            <AttributeValue>
              uugid=middleware.staff,ou=Groups,dc=vt,dc=edu
            </AttributeValue>
          </Attribute>
          <Attribute AttributeName="eduPersonAffiliation" AttributeNamespace="http://www.ja-sig.org/products/cas/">
            <AttributeValue>staff</AttributeValue>
          </Attribute>
          <Attribute AttributeName="accountState" AttributeNamespace="http://www.ja-sig.org/products/cas/">
            <AttributeValue>ACTIVE</AttributeValue>
          </Attribute>
        </AttributeStatement>
        <AuthenticationStatement AuthenticationInstant="2008-12-10T14:12:14.741Z"
        AuthenticationMethod="urn:oasis:names:tc:SAML:1.0:am:password">
          <Subject>
            <NameIdentifier>johnq</NameIdentifier>
            <SubjectConfirmation>
              <ConfirmationMethod>
                urn:oasis:names:tc:SAML:1.0:cm:artifact
              </ConfirmationMethod>
            </SubjectConfirmation>
          </Subject>
        </AuthenticationStatement>
      </Assertion>
    </Response>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
```

##### 4.2.5.1 SAML CAS response attributes
SAML响应中可能提供以下附加属性：

* longTermAuthenticationRequestTokenUsed - 如果CAS服务器支持LTGT（Remember-Me）（参见第4.1节），则SAML响应必须包含此属性以指示记住CAS客户端的登录。


## 附录 A：CAS response XML schema
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns:cas="http://www.yale.edu/tp/cas"
           targetNamespace="http://www.yale.edu/tp/cas"
           elementFormDefault="qualified">
  <xs:annotation>
    <xs:documentation>
      The following is the schema for the Central Authentication Service (CAS) version 3.0 protocol response.<br />
      This covers the responses for the following endpoints: /serviceValidate, /proxyValidate, /p3/serviceValidate, /p3/proxyValidate, /proxy.<br />
      This specification is subject to change.<br />
 
      Schema version: 3.0.3<br />
 
      History:<br />
      3.0   initial version for CAS 3.0 protocol spec <br />
      3.0.3 fixed attributes memberOf / xs:any clash, added documentation.<br />
    </xs:documentation>
  </xs:annotation>
  <xs:element name="serviceResponse" type="cas:ServiceResponseType">
    <xs:annotation>
      <xs:documentation>The service Response.</xs:documentation>
    </xs:annotation>
  </xs:element>
  <xs:complexType name="ServiceResponseType">
    <xs:choice>
      <xs:element name="authenticationSuccess" type="cas:AuthenticationSuccessType"/>
      <xs:element name="authenticationFailure" type="cas:AuthenticationFailureType"/>
      <xs:element name="proxySuccess" type="cas:ProxySuccessType"/>
      <xs:element name="proxyFailure" type="cas:ProxyFailureType"/>
    </xs:choice>
  </xs:complexType>
  <xs:complexType name="AuthenticationSuccessType">
    <xs:sequence>
      <xs:element name="user" type="xs:string">
        <xs:annotation>
          <xs:documentation>The username which authenticated successfully.</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:element name="attributes" type="cas:AttributesType" minOccurs="0">
        <xs:annotation>
          <xs:documentation>Optional attributes.</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:element name="proxyGrantingTicket" type="xs:string" minOccurs="0">
        <xs:annotation>
          <xs:documentation>Optional PGT.</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:element name="proxies" type="cas:ProxiesType" minOccurs="0">
        <xs:annotation>
          <xs:documentation>Optional type of proxies.</xs:documentation>
        </xs:annotation>
      </xs:element>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="ProxiesType">
    <xs:sequence>
      <xs:element name="proxy" type="xs:string" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="AuthenticationFailureType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="code" type="xs:string" use="required">
          <xs:annotation>
            <xs:documentation>The error code on authentication failure.</xs:documentation>
          </xs:annotation>
        </xs:attribute>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>
  <xs:complexType name="ProxySuccessType">
    <xs:sequence>
      <xs:element name="proxyTicket" type="xs:string">
        <xs:annotation>
          <xs:documentation>The PT.</xs:documentation>
        </xs:annotation>
      </xs:element>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="ProxyFailureType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="code" type="xs:string" use="required">
          <xs:annotation>
            <xs:documentation>The error code on proxy failure.</xs:documentation>
          </xs:annotation>
        </xs:attribute>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>
  <xs:complexType name="AttributesType">
    <xs:sequence>
      <xs:element name="authenticationDate" type="xs:dateTime" minOccurs="1" maxOccurs="1"/>
      <xs:element name="longTermAuthenticationRequestTokenUsed" type="xs:boolean" minOccurs="1" maxOccurs="1">
        <xs:annotation>
          <xs:documentation>true if a long-term (Remember-Me) token was used</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:element name="isFromNewLogin" type="xs:boolean" minOccurs="1" maxOccurs="1">
        <xs:annotation>
          <xs:documentation>true if this was from a new, interactive login. If login was from a non-interactive login (e.g. Remember-Me), this value is false or might be omitted.</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:any minOccurs="0" maxOccurs="unbounded" processContents="lax">
        <xs:annotation>
          <xs:documentation>Any user specific attribute elements. May contain memberOf or any other elements.</xs:documentation>
        </xs:annotation>
      </xs:any>
    </xs:sequence>
  </xs:complexType>
</xs:schema>
```
> 注意：由于CAS服务器实施者可以自定义属性（请参阅模式定义），因此建议使用以下格式形成自定义属性：
```xml
<cas:attributes>
    ...
    <cas:[attribute-name]>VALUE</cas:[attribute-name]>
</cas:attributes>
```
自定义属性的示例响应：
```xml
<cas:attributes>
    <cas:authenticationDate>2015-11-12T09:30:10Z</cas:authenticationDate>
    <cas:longTermAuthenticationRequestTokenUsed>true</cas:longTermAuthenticationRequestTokenUsed>
    <cas:isFromNewLogin>true</cas:isFromNewLogin>
    <cas:myAttribute>myValue</cas:myAttribute>
</cas:attributes>
```

## 附录 B：Safe redirection
成功登录后，必须小心处理将客户端从CAS重定向到最终目的地。 在大多数情况下，客户端已通过POST请求将凭据发送到CAS服务器。 通过此规范，CAS服务器必须使用GET请求将用户重定向到应用地址。

HTTP/1.1 RFC提供了303的响应代码：它提供了所需的行为：通过POST请求接收数据的脚本可以通过303重定向，通过GET请求将浏览器转发到另一个URL。然而，并非所有浏览器都正确地实现了该行为。

因此推荐[RECOMMENDED]重定向方法是使用JavaScript。示例如下：
```html
<html>
    <head>
        <title>Yale Central Authentication Service</title>
        <script>
            window.location.href="https://portal.yale.edu/Login?ticket=ST-..."
mce_href="https://portal.yale.edu/Login?ticket=ST-...";`
       </script>
    </head>
    <body>
        <noscript>
            <p>CAS login successful.</p>
            <p>  Click <a xhref="https://portal.yale.edu/Login?ticket=ST-..."
mce_href="https://portal.yale.edu/Login?ticket=ST-...">here</a>
            to access the service you requested.<br />  </p>
        </noscript>
    </body>
 </html>
```
此外，CAS应通过设置所有各种与缓存相关的标头来禁用浏览器缓存：

* Pragma: no-cache
* Cache-Control: no-store
* Expires: [RFC 1123[6] date equal to or before now]

## 附录 C：Logout XML document
当CAS服务器支持SLO时，它将回调到向系统注册的每个服务，并使用以下SAML注销请求XML文档发送POST请求：
```xml
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
     ID="[RANDOM ID]" Version="2.0" IssueInstant="[CURRENT DATE/TIME]">
    <saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
      @NOT_USED@
    </saml:NameID>
    <samlp:SessionIndex>[SESSION IDENTIFIER]</samlp:SessionIndex>
</samlp:LogoutRequest>`
```

## 附录 D: References
[1] Bradner, S., “Key words for use in RFCs to Indicate Requirement Levels”, RFC 2119, Harvard University, March 1997.

[2] Berners-Lee, T., Fielding, R., Frystyk, H., “Hypertext Transfer Protocol - HTTP/1.0”, RFC 1945, MIT/LCS, UC Irvine, MIT/LCS, May 1996.

[3] Fielding, R., Gettys, J., Mogul, J., Frystyk, H., Masinter, L., Leach, P., Berners-Lee, T., “Hypertext Transfer Protocol - HTTP/1.1”, RFC 2068, UC Irvine, Compaq/W3C, Compaq, W3C/MIT, Xerox, Microsoft, W3C/MIT, June 1999.

[4] Berners-Lee, T., Masinter, L., and MaCahill, M., “Uniform Resource Locators (URL)”, RFC 1738, CERN, Xerox Corporation, University of Minnesota, December 1994.

[5] Kristol, D., Montulli, L., “HTTP State Management Mechanism”, RFC 2965, Bell Laboratories/Lucent Technologies, Epinions.com, Inc., October 2000.

[6] Braden, R., “Requirements for Internet Hosts - Application and Support”, RFC 1123, Internet Engineering Task Force, October 1989.

[7] OASIS SAML 1.1 standard, saml.xml.org, December 2009.

[8] Apereo CAS Server reference implementation

## 附录 E: CAS License
Licensed to Apereo under one or more contributor license agreements. See the NOTICE file distributed with this work for additional information regarding copyright ownership. Apereo licenses this file to you under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at the following location:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## 附录 F: YALE License
Copyright (c) 2000-2005 Yale University.

THIS SOFTWARE IS PROVIDED “AS IS,” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, ARE EXPRESSLY DISCLAIMED. IN NO EVENT SHALL YALE UNIVERSITY OR ITS EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED, THE COSTS OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED IN ADVANCE OF THE POSSIBILITY OF SUCH DAMAGE.

Redistribution and use of this software in source or binary forms, with or without modification, are permitted, provided that the following conditions are met:

1. Any redistribution must include the above copyright notice and disclaimer and this list of conditions in any related documentation and, if feasible, in the redistributed software.

2. Any redistribution must include the acknowledgment, “This product includes software developed by Yale University,” in any related documentation and, if feasible, in the redistributed software.

3. The names “Yale” and “Yale University” must not be used to endorse or promote products derived from this software.

## 附录 G: Changes to this Document
May 4, 2005: v1.0 - initial release for CAS 1.0 and CAS 2.0, Copyright © 2005, Yale University

March 2, 2012: v1.0.1 - fixed “noscropt” typo. apetro per amazurek with credit to Faraz Khan at ASU for catching the typo.

April, 2013: v3.0 - CAS 3.0 protocol, Apereo copyright, Apache License 2.0

January, 2014: v3.0.1 - Attribute occurance

September, 2015: v3.0.2 - Format parameter

December, 2017: v3.0.3 - Fixed ServiceValidate XSD schema

## 参考
[CAS Protocol 3.0 Specification](https://apereo.github.io/cas/5.3.x/protocol/CAS-Protocol-Specification.html)
