
exports.add = function(e, el) {
  var newItem = this.model.del('new');
  if (!newItem) return;
  newItem.userId = this.model.parent(2).get('_session.userId');
  newItem.date = new Date();
  newItem.id = [
    String(newItem.date.getDate()),
    String(newItem.date.getMonth() + 1),
    String(1900 + newItem.date.getYear())
  ].join('-');
  this.model.parent(2).add('items', newItem);
};

exports.init = function() {
  var model = this.model;
  function initialBalance(cash, incomes, outcomes) {
    return Number(cash || '') + Number(incomes || '') - Number(outcomes || '');
  }
  function dailyOutcomes(waybills, invoices, withBill, withoutBill, shifts) {
    return Number(waybills || '') + Number(invoices || '') +
      Number(withBill || '') + Number(withoutBill || '') + Number(shifts || '');
  }
  function theoretical(initialBalance, salesAmount, dailyOutcomes){
    return Number(initialBalance || '') + Number(salesAmount || '') -
      Number(dailyOutcomes || '');
  }
  function balance(cash, cardPayments){
    return Number(cash || '') + Number(cardPayments || '');
  }
  function delta(total, theoretical){
    return Number(total || '') - Number(theoretical || '');
  }
  function iva(sales){
    return Math.ceil(Number(sales || '') * 0.19);
  }
  function net(cash, roundedIva){
    return Number(cash || '') - Number(roundedIva || '');
  }
  function finish(net, withdrawal){
    return Number(net || '') - Number(withdrawal || '');
  }

  model.start(initialBalance,'new.totals.initialBalance',
    'new.initialBalance.cash',
    'new.initialBalance.incomes',
    'new.initialBalance.outcomes');
  model.start(dailyOutcomes, 'new.totals.dailyOutcomes',
    'new.dailyOutcomes.waybills',
    'new.dailyOutcomes.invoices',
    'new.dailyOutcomes.withBill',
    'new.dailyOutcomes.withoutBill',
    'new.dailyOutcomes.shifts');
  model.start(theoretical, 'new.balance.theoretical',
    'new.totals.initialBalance',
    'new.sales.amount',
    'new.totals.dailyOutcomes');
  model.start(balance, 'new.totals.balance',
    'new.balance.cash',
    'new.balance.cardPayments');
  model.start(delta, 'new.totals.balanceDelta',
    'new.totals.balance',
    'new.balance.theoretical');
  model.start(iva, 'new.taxes.iva',
    'new.sales.amount');
  model.start(net, 'new.totals.net',
    'new.balance.cash',
    'new.taxes.roundedIva');
  model.start(finish, 'new.totals.finish',
    'new.totals.net',
    'new.finish.withdrawal');
};
