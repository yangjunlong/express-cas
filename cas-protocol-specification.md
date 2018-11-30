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
| ------------ | ------------ |
|/login	|凭证请求者/接收者	|credential requestor / acceptor
|/logout	|CAS会话注销	|destroy CAS session (logout)
|/validate	|服务票根验证	|service ticket validation
|/serviceValidate	|服务票根验证[CAS2.0]	|service ticket validation [CAS 2.0]
|/proxyValidate	|服务/代理票根验证[CAS2.0]	|service/proxy ticket validation [CAS 2.0]
|/proxy	|代理票根服务[CAS2.0]|	proxy ticket service [CAS 2.0]
|/p3/serviceValidate	|服务票根验证[CAS3.0]	|service ticket validation [CAS 3.0]
|/p3/proxyValidate	|服务/代理票根验证[CAS3.0] |service/proxy ticket validation [CAS 3.0]
