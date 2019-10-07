# UXDX Workshop - Part II

## Creating an API

* Create an `api.js` file in routes

```js
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

* Add API to main application. Open up `app.js`

```js
var apiRouter = require('./routes/api');

app.use('/', apiRouter);
```

## Securing our API

* Create an API in Auth0, give it identifier

* Create permissions in the API at Auth0

```
read:cars

read:secret

read:admin
```

* Create Roles in the Auth0 Dashboard and assign the permissions

* Ensure Add Permissions are on for the Selected API

* Update `.env` to include API Identifier

```
AUTH0_API_IDENTIFIER=https://ev-stop-shop.com
```

* Update the `api.js` file to include Auth0 integration

```js
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

// ...

const checkScopes = jwtAuthz(['read:cars'], {customScopeKey: 'permissions'});

router.get('/api/cars/:id', checkJwt, checkScopes, function (req, res, next) {
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
```

## Test API with Postman

* Test the routes work / don't work by calling them directly
* Generate test token from auth0 dashboard

## Done!

