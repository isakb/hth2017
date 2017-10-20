import resource from 'resource-router-middleware';
import appliances from '../models/appliances';

export default (req, res) => {
  console.log('req', req.query);
  appliances.list().then(appls => {
    let found = appls.find(t => t.type === 'CoffeeMaker' && t.brand === 'BOSCH');
    console.log('found', found);
    appliances.activateProgram(
      found.haId,
      'ConsumerProducts.CoffeeMaker.Program.Beverage.CaffeLatte',
      // 'ConsumerProducts.CoffeeMaker.Program.Beverage.Espresso',
      [
        // {
        //   "key": "ConsumerProducts.CoffeeMaker.Option.BeanAmount",
        //   "value": "Normal"
        // },
        // {
        //   "key": "ConsumerProducts.CoffeeMaker.Option.FillQuantity",
        //   "value": 200,
        //   "unit": "ml"
        // }
      ]
    );
    res.json({ success: 'maybe' });
  });
}
