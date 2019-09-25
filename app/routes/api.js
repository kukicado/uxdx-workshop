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
