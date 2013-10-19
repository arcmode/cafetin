var app = require('derby').createApp(module)
  .use(require('derby-ui-boot'))
  .use(require('../../ui'))


// ROUTES //

// Derby routes are rendered on the client and the server
app.get('/', function(page) {
  page.render('home');
});

app.get('/day', function(page, model, params, next) {
  // This value is set on the server in the `createUserId` middleware
  var userId = model.get('_session.userId');

  // Create a scoped model, which sets the base path for all model methods
  var user = model.at('users.' + userId);

  // Create a mongo query that gets the current user's items
  var itemsQuery = model.query('items', {userId: userId});

  // Get the inital data and subscribe to any updates
  model.subscribe(user, itemsQuery, function(err) {
    if (err) return next(err);

    // Create references that can be used in templates or controller methods
    model.ref('_page.user', user);
    itemsQuery.ref('_page.items');

    user.increment('visits');
    page.render('day');
  });
});


// CONTROLLER FUNCTIONS //

app.fn('day.add', function(e, el) {
  var newItem = this.model.del('_page.newItem');
  if (!newItem) return;
  newItem.userId = this.model.get('_session.userId');
  newItem.date = Date.now();
  this.model.add('items', newItem);
});

app.fn('day.remove', function(e) {
  var item = e.get(':item');
  this.model.del('items.' + item.id);
});

app.enter('/day', function(model, params){
  item = model.at('_page.newItem');
  item.on('change', 'initial.*', initialBalance);
  item.on('change', 'dailyOutcomes.*', dailyOutcomes);
  item.on('change', 'totals.initialBalance', dailyBalance);
  item.on('change', 'sales.amount', dailyBalance);
  item.on('change', 'sales.amount', taxes);
  item.on('change', 'totals.dailyOutcomes', dailyBalance);
  item.on('change', 'balance.*', balance);
  item.on('change', 'taxes.IVARound', IVARound);
  item.on('change', 'totals.net', finish);
  item.on('change', 'finish.withdrawal', finish);

  function initialBalance(path, value, previous, passed){
    var initial = model.at('_page.newItem.initial');
    var cash = Number(initial.get('cash') || "");
    var incomes = Number(initial.get('incomes') || "");
    var outcomes = Number(initial.get('outcomes') || "");
    var balance = cash + incomes - outcomes;
    model.set('_page.newItem.totals.initialBalance', balance)
  }
  function dailyOutcomes(path, value, previous, passed){
    var outcomes = model.at('_page.newItem.dailyOutcomes');
    var waybills = Number(outcomes.get('waybills') || "");
    var invoices = Number(outcomes.get('invoices') || "");
    var withBill = Number(outcomes.get('withBill') || "");
    var withoutBill = Number(outcomes.get('withoutBill') || "");
    var shifts = Number(outcomes.get('shifts') || "");
    var total = waybills + invoices + withBill + withoutBill + shifts;
    model.set('_page.newItem.totals.dailyOutcomes', total)
  }
  function balance(path, value, previous, passed){
    var balance = model.at('_page.newItem.balance');
    var theoretical = Number(balance.get('theoretical') || "");
    var cash = Number(balance.get('cash') || "");
    var cardPayments = Number(balance.get('cardPayments') || "");
    var total = cash + cardPayments;
    var delta = total - theoretical;
    model.set('_page.newItem.totals.balance', total);
    model.set('_page.newItem.totals.balanceDelta', delta);
  }
  function dailyBalance(value, previous, passed){
    var initialBalance = Number(model.get('_page.newItem.totals.initialBalance') || "");
    var salesAmount = Number(model.get('_page.newItem.sales.amount') || "");
    var dailyOutcomes = Number(model.get('_page.newItem.totals.dailyOutcomes') || "");
    var balance = initialBalance + salesAmount - dailyOutcomes;
    model.set('_page.newItem.balance.theoretical', balance);
  }
  function taxes(value, previous, passed){
    var IVA = Math.ceil(Number(value) * 0.19);
    model.set('_page.newItem.taxes.IVA', IVA);
  }
  function IVARound(value, previous, passed){
    var cash = Number(model.get('_page.newItem.balance.cash') || "");
    var net = cash - value;
    model.set('_page.newItem.totals.net', net);
  }
  function finish(value, previous, passed){
    var net = Number(model.get('_page.newItem.totals.net') || []);
    var withdrawal = Number(model.get('_page.newItem.finish.withdrawal') || []);
    balance = net - withdrawal;
    model.set('_page.newItem.totals.finish', balance);
  }
});
