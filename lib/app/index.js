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
    page.render('list');
  });
});


// CONTROLLER FUNCTIONS //

app.fn('list.add', function(e, el) {
  var newItem = this.model.del('_page.newItem');
  if (!newItem) return;
  newItem.userId = this.model.get('_session.userId');
  newItem.date = Date.now();
  this.model.add('items', newItem);
});

app.fn('list.remove', function(e) {
  var item = e.get(':item');
  this.model.del('items.' + item.id);
});

app.enter('/list', function(model, params){
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
    var initial = item.at('initial');
    var cash = Number(initial.get('cash') || "");
    var incomes = Number(initial.get('incomes') || "");
    var outcomes = Number(initial.get('outcomes') || "");
    var balance = cash + incomes - outcomes;
    item.set('totals.initialBalance', balance)
  }
  function dailyOutcomes(path, value, previous, passed){
    var outcomes = item.at('dailyOutcomes');
    var waybills = Number(outcomes.get('waybills') || "");
    var invoices = Number(outcomes.get('invoices') || "");
    var withBill = Number(outcomes.get('withBill') || "");
    var withoutBill = Number(outcomes.get('withoutBill') || "");
    var shifts = Number(outcomes.get('shifts') || "");
    var total = waybills + invoices + withBill + withoutBill + shifts;
    item.set('totals.dailyOutcomes', total)
  }
  function balance(path, value, previous, passed){
    var balance = item.at('balance');
    var theoretical = Number(balance.get('theoretical') || "");
    var cash = Number(balance.get('cash') || "");
    var cardPayments = Number(balance.get('cardPayments') || "");
    var total = cash + cardPayments;
    var delta = total - theoretical;
    item.set('totals.balance', total);
    item.set('totals.balanceDelta', delta);
  }
  function dailyBalance(value, previous, passed){
    var initialBalance = Number(item.get('totals.initialBalance') || "");
    var salesAmount = Number(item.get('sales.amount') || "");
    var dailyOutcomes = Number(item.get('totals.dailyOutcomes') || "");
    var balance = initialBalance + salesAmount - dailyOutcomes;
    item.set('balance.theoretical', balance);
  }
  function taxes(value, previous, passed){
    var IVA = Math.ceil(Number(value) * 0.19);
    item.set('taxes.IVA', IVA);
  }
  function IVARound(value, previous, passed){
    var cash = Number(item.get('balance.cash') || "");
    var net = cash - value;
    item.set('totals.net', net);
  }
  function finish(value, previous, passed){
    var net = Number(item.get('totals.net') || []);
    var withdrawal = Number(item.get('finish.withdrawal') || []);
    balance = net - withdrawal;
    item.set('totals.finish', balance);
  }
});
