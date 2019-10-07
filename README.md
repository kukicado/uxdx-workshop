# UXDX Workshop - Part I

* `npm install` Dependencies
* Run app and show it
* Display directory structure. 
* * Show `app.js`
* * Show `views` directory
* * Show `routes` directory
* * Show `data` and `cars.json`

## Setting up Auth0

* Go to [http://bit.ly/auth0-uxdx](http://bit.ly/auth0-uxdx)
* Showcase the Auth0 Dashboard
* * Show Applications, Connections, Rules, and other Auth0 Features

* Create a new Web Application Client

* Create a `.env` file on your computer with the following data

```
AUTH0_CLIENT_ID=mhMYyZLDxVxgoO1CDMqyWyLhy3q4a5D2
AUTH0_DOMAIN=uxdx.auth0.com
AUTH0_CLIENT_SECRET=en34sK_jRPeREITfk3u0sqMLUh9Lvos0LY0icOeGxqaxMFMxZxy7XyXIw51x8bk1
```

## Set Up PassportJS

* Open up `app.js`

* Update Imports

```js
var session = require('express-session');
var dotenv = require('dotenv');
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var indexRouter = require('./routes/index');
```

* Introduce PassportJS and set up PassportJS w/ Auth0 Strategy in `app.js`

```js
dotenv.load();

// Configure Passport to use Auth0
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

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
```

* Set up our session managmenet, we'll use in memory by default

```js
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

## Creating an Auth0 Rule

* Go into dashboard and add a new rule

```js
function (user, context, callback) {
  const namespace = 'https://ev-store.com';
  let idTokenClaims = context.idToken || {};
  user.app_metadata = user.app_metadata || {};

  idTokenClaims[`${namespace}/role`] = user.app_metadata.role;

  context.idToken = idTokenClaims;

  callback(null, user, context);
}
```

## Set Up Middleware

* Create a middleware folder and create our middleware

* Secured middleware that will check to see if a user exists. `secured.js`

```js
module.exports = function () {
    return function secured (req, res, next) {
        if (req.user) { return next(); }
        req.session.returnTo = req.originalUrl;
        res.redirect('/login');
    };
};
```

* User in views to pass our user information to our views. `userInViews.js`

```js
module.exports = function () {
    return function (req, res, next) {
        res.locals.user = req.user;
        next();
    };
};
```

* Add middleware to our applications. Open up `app.js`

* Update imports

```js
var userInViews = require('./lib/middleware/userInViews');
```

```js

/* 
// Handle auth failure error messages
app.use(function (req, res, next) {
  if (req && req.query && req.query.error) {
    req.flash('error', req.query.error);
  }
  if (req && req.query && req.query.error_description) {
    req.flash('error_description', req.query.error_description);
  }
  next();
});
*/ 

app.use(userInViews());

// app.use('/', indexRouter);
```

* Use middleware in our routes. Open up `index.js`
* Add imports and secure routes that need to be secured

```js
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
```

## Handling Authentication

* Create an auth file in routes. `auth.js`

```js
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

* Add new routes to application in `app.js`

```js
// ... imports ..
var authRouter = require('./routes/auth');

// ...
app.use('/', authRouter);
```

## User Profile 

* Open up `index.js` and add user route

```js
router.get('/user', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;

  res.render('user', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'Profile page'
  });
});
```

* Create a user view in `views`. `user.pug`

```pug
extends layout

block content
  div.container
    h1 Welcome #{user.nickname}
    img(src=user.picture)
    h2 User profile
    p This is the content of <code>req.user</code>.
    p Note: <code>_raw</code> and <code>_json</code> properties have been ommited.
    pre
      code #{userProfile}
```

## Update Views to finalize functionality.

* Update `car.pug`

```pug
extends layout

block content
  div.container
    div.row
      div.col-xl-8.offset-xl-2.my-5
        h4 #{car.brand}
        h1 #{car.model}
        - var img = car.img
        img(src="/img/" + img class="img-fluid my-3")
        h1.text-success.text-center #{car.price}
        div.row.my-5
          div.col-xl-4
            h3.text-center.text-muted Range 
            h2.text-center #{car.stats.range} miles
          div.col-xl-4
            h3.text-center.text-muted 0-60 mph 
            h2.text-center #{car.stats.ramp} seconds
          div.col-xl-4
            h3.text-center.text-muted Top Speed 
            h2.text-center #{car.stats.speed} mph
        if user.role === "admin"
          div.col-lg-12.my-5.py-5(style="background: #dedede; border-radius: 50px;")
            div.row
              div.col-xl-6
                h3.text-center.text-muted Stock 
                h2.text-center #{car.inventory}
              div.col-xl-6
                h3.text-center.text-muted Best Price 
                h2.text-center.text-danger #{car.dealerPrice}
          - var id = car.id
          a.btn.btn-success.btn-block(href="/car/" + id) Buy Now
```

* Update `index.pug`

```pug
extends layout

block content
  div.container
    div.row
      for car in locals.cars
        if car.id != 9
          div.col-xl-4.my-5
            h4 #{car.brand}
            h1 #{car.model}
            - var img = car.img
            img(src="/img/" + img class="img-fluid my-3")
            if user
              - var id = car.id
              h3.text-success #{car.price}
              a.btn.btn-success(href="/car/" + id) Learn More
            else
              a.btn.btn-info(href="/login") Log In to View Price
        else if car.id == 9 && (user && user.role == "secret") || (user && user.role == "admin")
          div.col-xl-4.my-5
            h4 #{car.brand}
            h1 #{car.model}
            - var img = car.img
            img(src="/img/" + img class="img-fluid my-3")
            h3.text-success #{car.price}
            if locals.user
              - var id = car.id
              a.btn.btn-success(href="/car/" + id) Learn More
            else
              a.btn.btn-info(href="/login") Log In to View Price
        else if car.id == 9 && (user && user.role == "member") || !user
          div.col-xl-4.my-5
            h4 Exclusive for Apple Members
            h1 Upcoming EV
            img(src="/img/secret.jpg" class="img-fluid my-3")
            h3.text-info Sign In With Apple To Reveal
```

* Update `layout.pug`

```pug
doctype html
html
  head
    title= title
    link(rel='stylesheet', href='/stylesheets/style.css')
    link(rel='stylesheet', href='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css')
    link(rel='shortcut icon', href='//cdn2.auth0.com/styleguide/latest/lib/logos/img/favicon.png')

  body.bg-light
    div.container
      div.row 
        div.col-lg-12
          h1.display-1.text-center.mb-5 EV Stop N' Shop
          ul.nav.justify-content-center
            li.nav-item
              h2 
                a.nav-link(href="/") Home
            if locals.user
              li.nav-item
                h2
                  a.nav-link(href="/user") Profile
              li.nav-item
                h2
                  a.nav-link.text-danger(href="/logout") Logout
            else 
              li.nav-item
                h2
                  a.nav-link(href="/login") Login

    block content
```

## Test the application

* Log in with Auth0
* Show that a user with no permissions can only do so much
* Add permissions in `app_metadata`

```json
{
  "role": "secret, admin, member"
}
```

## DONE!
