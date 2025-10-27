//import { Cashfree, CFEnvironment } from "cashfree-pg";
const { Cashfree, CFEnvironment } = require("cashfree-pg");
var cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  "10846339023bc7e033ee15533803364801",
  "cfsk_ma_prod_0bb70536761ab5fc8cad5d5ac6bb22b1_c0fffe85"
);
// var cashfree = new Cashfree(
//   CFEnvironment.PRODUCTION,
//   "96222386b0c2728876f8d04a0c322269",
//   "cfsk_ma_prod_fc6560491ee9f09ae58e58d9a2b4ebd1_98e0ddc8"
// );
var request = {
  order_amount: 1,
  order_currency: "INR",
  order_id: "test_cashfree",
  customer_details: {
    customer_id: "walterwNrcMi",
    customer_phone: "9999999999",
  },
  order_meta: {
    return_url:
      "https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id={order_id}",
  },
};
cashfree
  .PGCreateOrder(request)
  .then((response) => {
    console.log("Order Created successfully:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error.response.data.message);
  });