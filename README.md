# express-cas
> Central Authentication Service (CAS) client for express


## Installation

    $ npm install express-cas

## Setup

```javascript
var CASClient = require('express-cas');
var cas = new CASClient({
  casServerUrlPrefix: 'https://localhost:8443/cas',
  casServerLoginUrl: 'https://localhost:8443/cas/login',
  serverName: 'https://localhost:8443 ',
  service: 'https://localhost:8443/yourwebapp/index.html',
  renew: false,
  gateway: false,
  encodeServiceUrl: true,
  sessionName: 'cas_username',
  sessionInfo: 'cas_userinfo',
  devModeUser: 'test',
  devModeInfo: {},
  isDestroySession: false,
  version: '3.0'
});
```

### Options

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `casServerUrlPrefix` | _String_ | The start of the CAS server URL, i.e. `https://localhost:8443/cas` | Yes (unless `casServerLoginUrl` is set) |
| `casServerLoginUrl` | _String_ | Defines the location of the CAS server login URL, i.e. `https://localhost:8443/cas/login`. This overrides casServerUrlPrefix, if set. | Yes (unless casServerUrlPrefix is set) |
| `serverName` | _String_ | The name of the server this application is hosted on. Service URL will be dynamically constructed using this, i.e. `https://localhost:8443` (you must include the protocol, but port is optional if it's a standard port). | Yes |
| `service` | _String_ | The service URL to send to the CAS server, i.e. `https://localhost:8443/yourwebapp/index.html` | No |
| `renew` | _Boolean_ | specifies whether `renew=true` should be sent to the CAS server. Valid values are either `true/false` (or no value at all).  | No |
| `gateway` | _Boolean_ | specifies whether `gateway=true` should be sent to the CAS server. Valid values are either `true/false` (or no value at all) | No |
| `encodeServiceUrl` | _Boolean_ | Whether the client should auto encode the service url. Defaults to `true` | No |
| `sessionName` | _String_ | The name of the session variable that will store the CAS user once they are authenticated. Defaults to `cas_username`| No |
| `sessionInfo` | _String_ | The name of the session variable that will store the CAS user information once they are authenticated. If set to false (or something that evaluates as false), the additional information supplied by the CAS will not be forwarded. This will not work with CAS 1.0, as it does not support additional user information. Defaults to `cas_userinfo`| No |
| `devModeUser` | _String_ | The CAS user to use if dev mode is active. Defaults to `""`| No |
| `devModeInfo` | _Object_ | The CAS user information to use if dev mode is active. Defaults to `{}`| No |
| `isDestroySession` | _Boolean_ | If true, the logout function will destroy the entire session upon CAS logout. Otherwise, it will only delete the session variable storing the CAS user. Defaults to `false`| No |
| `version` | _String_ | The CAS protocol version. Valid values are `"1.0"\|"2.0\|"3.0"\|"saml1.1"`.  Defaults to `3.0`| No |


### Usage

```javascript
var express = require('express');
var session = require('express-session');
var CAS = require('express-cas');

var cas = new CAS({
  casServerUrlPrefix: 'https://localhost:8443/cas',
  serverName: 'http://localhost:3000'
});

var app = express();

app.use( session({
 secret: 'super secret key',
 resave: false,
 saveUninitialized: true
}));

// Unauthenticated clients will be redirected to the CAS login 
// and then back to this route once authenticated.
app.get('/app', cas.bounce, function( req, res ) {
  res.send( '<html><body>Hello!</body></html>' );
});

// Unauthenticated clients will receive a 401 
// Unauthorized response instead of the JSON data.
app.get('/api', cas.block, function( req, res ) {
  res.json({ success: true });
});

// An example of accessing the CAS user session variable. 
// This could be used to retrieve your own local user records
// based on authenticated CAS username.
app.get('/api/user', cas.block, function ( req, res ) {
  res.json( { cas_username: req.session[ cas.sessionName ] } );
});

// Unauthenticated clients will be redirected to the CAS login 
// and then to the provided "referer" query parameter once authenticated.
app.get('/authenticate', cas.redirect );

// This route will de-authenticate the client with the Express server 
// and then redirect the client to the CAS logout page.
app.get('/logout', cas.logout);
```

## 参考
* [cas-authentication](https://github.com/kylepixel/cas-authentication)
* [CAS Protocol 3.0 Specification](https://apereo.github.io/cas/5.3.x/protocol/CAS-Protocol-Specification.html)