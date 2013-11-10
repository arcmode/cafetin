var day = require('../../days');

var app = require('derby').createApp(module)
  .use(require('derby-ui-boot'))
  .use(require('../../ui'))
  .use(day.lib)


// ROUTES //

// Derby routes are rendered on the client and the server
app.get('/', function(page) {
  page.render('home');
});

day.route(app);
