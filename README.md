# uxdx-workshop

## Application Overview

## Securing a Traditional Web Application

### Using Passport JS

- What is Passport JS?
- Strategies
- Auth0Strategy

```
var strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
      process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    profile.role = profile._json['https://ev-store.com/role'];
    return done(null, profile);
  }
);
```

Setting up Passport

```
passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
```

Session Setup

```
// config express-session
var sess = {
  secret: 'CHANGE THIS SECRET',
  cookie: {},
  resave: false,
  saveUninitialized: true
};

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());
```


## Routes

### Traditional Web App

```
var express = require('express');
var router = express.Router();
var secured = require('../lib/middleware/secured');

router.get('/', function (req, res, next) {
  let data = {};
  let cars = require('../../data/cars.json');
  console.log(req.user);
  data.title = 'EV Shop';
  data.cars = cars;
  res.render('index', data);
});

router.get('/car/:id', secured(), function (req, res, next) {
  let data = {};
  let cars = require('../../data/cars.json');
  data.car = cars[req.params.id - 1];
  res.render('car', data);
});

router.get('/user', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;

  res.render('user', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'Profile page'
  });
});

module.exports = router;
```

## Default Web App Routes

```
var express = require('express');
var router = express.Router();
var cars = require('../../data/cars.json');

router.get('/', function (req, res, next) {
  let data = {};
  let cars = require('../../data/cars.json');
  console.log(req.user);
  data.title = 'EV Shop';
  data.cars = cars;
  res.render('index', data);
});

router.get('/car/:id', function (req, res, next) {
  let data = {};
  let cars = require('../../data/cars.json');
  data.car = cars[req.params.id - 1];
  res.render('car', data);
});

router.get('/user', function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;

  res.render('user', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'Profile page'
  });
});

module.exports = router;
```

## Authentication Routes

```
var express = require('express');
var router = express.Router();
var passport = require('passport');
var dotenv = require('dotenv');
var util = require('util');
var url = require('url');
var querystring = require('querystring');

dotenv.config();

// Perform the login, after login Auth0 will redirect to callback
router.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}), function (req, res) {
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err); }
    console.log(user);
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
  req.logout();

  var returnTo = req.protocol + '://' + req.hostname;
  var port = req.connection.localPort;
  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo += ':' + port;
  }
  var logoutURL = new url.URL(
    util.format('https://%s/logout', process.env.AUTH0_DOMAIN)
  );
  var searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo
  });
  logoutURL.search = searchString;

  res.redirect(logoutURL);
});

module.exports = router;
```



## Rules

```
RULE

function (user, context, callback) {
  const namespace = 'https://ev-store.com';
  let idTokenClaims = context.idToken || {};
  user.app_metadata = user.app_metadata || {};

  idTokenClaims[`${namespace}/role`] = user.app_metadata.role;

  context.idToken = idTokenClaims;

  callback(null, user, context);
}

RULE API

function (user, context, callback) {
  const namespace = 'https://ev-store.com';
  const assignedRoles = (context.authorization || {}).roles;
  const assignedPermissions = (context.authorization || {}).permissions;

  let idTokenClaims = context.idToken || {};
  let accessTokenClaims = context.accessToken || {};

  idTokenClaims[`${namespace}/roles`] = assignedRoles;
  accessTokenClaims[`${namespace}/roles`] = assignedRoles;
  
   idTokenClaims[`${namespace}/roles`] = assignedPermissions;
  accessTokenClaims[`${namespace}/roles`] = assignedPermissions;

  context.idToken = idTokenClaims;
  context.accessToken = accessTokenClaims;

  callback(null, user, context);
}

```

## Securing an API

Adding API Routes

```
var express = require('express');
var router = express.Router();
var dotenv = require('dotenv');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

dotenv.load();

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_API_IDENTIFIER,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

router.get('/api/cars', function (req, res, next) {
  let cars = require('../../data/cars.json');

  res.json(cars);
});

const checkScopes = jwtAuthz(['read:cars'], {customScopeKey: 'permissions'});

router.get('/api/cars/:id', checkJwt, checkScopes, function (req, res, next) {
  let id = req.params.id;
  let cars = require('../../data/cars.json');
  let car = cars[id - 1];
  console.log(req.user.permissions);
  if (req.user.permissions.includes('read:admin')) {
    res.json(car);
  } else {
    car.inventory = null;
    car.dealerPrice = null;
    res.json(car);
  }
});

module.exports = router;
```


## Default API ROUTES

```
var express = require('express');
var router = express.Router();
var cars = require('../../data/cars.json');

router.get('/api/cars', function (req, res, next) {

  res.json(cars);
});

router.get('/api/cars/:id', function (req, res, next) {
  let id = req.params.id;
  let car = cars[id - 1];

  if (req.user.permissions.includes('read:admin')) {
    res.json(car);
  } else {
    car.inventory = null;
    car.dealerPrice = null;
    res.json(car);
  }
});

module.exports = router;
```


## REACT



# 4 Hour Workshop

0:00 - 0:10: introduction, share repo, install dependencies, show the app we'll be building
0:10 - 1:00: Presentation on Intrduction to Modern Identity
1:00 - 1:10: Bio Break, Finish setting up application
1:10 - 1:20: Overview of the Traditional Web Application
1:20 - 1:40: Setting Up Auth0 and Overview of Auth0 
1:40 - 2:30: Setting up Authentication Routes and Login, Setting Up Roles, Updating UI
2:30 - 2:40: Bio Break, Help
2:40 - 2:50: Showcase single page app, show how we'll extend our existing app. 
2:50 - 3:00: Set up SPA app and run it
3:00 - 3:40: Add Authentication to SPA App
3:40 - 4:00: Questions, other scenarios.
