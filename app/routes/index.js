var express = require('express');
var router = express.Router();
var cars = require('../../data/cars.json');
var secured = require('../lib/middleware/secured');

router.get('/', function (req, res, next) {
  let data = {};
  console.log(req.user);
  data.title = 'EV Shop';
  data.cars = cars;
  res.render('index', data);
});

router.get('/car/:id', secured(), function (req, res, next) {
  let data = {};
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