import resource from 'resource-router-middleware';
import appliances from '../models/appliances';

export default (req, res) => {
  console.log('req', req);
    //   appliances.list().then(appls => {
    //     let found = appls.find(t => t.type === 'CoffeeMaker');
    //     console.log('found', found);
    //     appliances.activateProgram(
    //       found.haId,
    //       'ConsumerProducts.CoffeeMaker.Program.Beverage.CaffeLatte',
    //       [
    //         // {
    //         //   "key": "ConsumerProducts.CoffeeMaker.Option.BeanAmount",
    //         //   "value": "Normal"
    //         // },
    //         // {
    //         //   "key": "ConsumerProducts.CoffeeMaker.Option.FillQuantity",
    //         //   "value": 200,
    //         //   "unit": "ml"
    //         // }
    //       ]
    //     );

    if (req.query.code) {
        appliances.setAuthCode(req.query.code);
        res.send('<body>covfefe!</body>');
        return;
    }

    if (req.method === 'GET') {
        res.send('<body><p>Go to: <a href="' + req.query.embed + '">this auth</a></p><form method="get" action="/api/auth"><input type="text" name="authcode" value="auth code goes here" /><input type=submit /></body>');
        return;
    }

    res.send('<body>hello</body>');
   //   });
}
