var express = require('express');
var router = express.Router();
var cars = require('../../data/cars.json');

router.get('/', function (req, res, next) {
  let data = {};
  data.title = 'EV Shop';
  data.cars = cars;
  res.render('index', data);
});

router.get('/car/:id', function (req, res, next) {
  let data = {};
  data.car = cars[req.params.id - 1];
  res.render('car', data);
});

module.exports = router;
