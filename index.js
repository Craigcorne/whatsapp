const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const catchAsyncErrors = require("./catchAsyncErrors");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: [
      "https://www.ninetyone.co.ke",
      "https://ninetyone.co.ke",
      "http://localhost:3000",
    ], //this one
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Origin",
    ],
    credentials: true, // email data change
  })
);

const client = new Client({ authStrategy: new LocalAuth() });
// const shopPhoneNumber = 254726327352;
// const shopName = "craaaaig";

// async function sendOrderNotification(shopPhoneNumber, shopName) {
//   const message = `Hello ${shopName}, You have a new order Order Number: click on these link below to check\nhttps://ninetyone.co.ke/dashboard-orders`;

//   try {
//     console.log("Attempting to send message to:", `${shopPhoneNumber}@c.us`);
//     await client.sendMessage(`${shopPhoneNumber}@c.us`, message);
//     console.log("Order notification sent successfully.");
//   } catch (error) {
//     console.error("Error sending order notification:", error);
//   }
// }

client.on("qr", (qr) => {
  console.log("Scan the QR code to log in:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp Client is ready.");
});

client.initialize();

// app.get("/", function (req, res) {
//   res.set("Content-Type", "text/html; charset=utf-8");
//   res.send("<h1>Hello World</h1>");
// });

app.post(
  "/sendmyorder",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        cart,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
        shippingPrice,
        discount,
      } = req.body;
      // hell0

      const shopItemsMap = new Map();
      const shopEmailsMap = new Map();
      const order = req.body;

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);

        if (!shopEmailsMap.has(shopId)) {
          const shop = await Shop.findById(shopId);
          if (shop) {
            shopEmailsMap.set(shopId, shop.email);
          }
        }
      }

      for (const [shopId, items] of shopItemsMap) {
        try {
          const shop = await Shop.findById(shopId);

          if (shop) {
            const shopEmail = shop.email;
            let shopPhoneNumber = shop.phoneNumber || 254726327352;
            const shopName = shop.name || craig;

            // Check if the phone number starts with "07" and replace it with "2547"
            if (shopPhoneNumber.startsWith("07")) {
              shopPhoneNumber = "2547" + shopPhoneNumber.slice(2);
            }

            console.log("Sending SMS to:", shopPhoneNumber);
            console.log("this is", shopName);

            // Sending WhatsApp message
            await client.sendMessage(
              `${shopPhoneNumber}@c.us`,
              `Hello ${shopName}, You have a new order Order Number:${order.orderNo} click on these link below to check
               https://ninetyone.co.ke/dashboard-orders`
            );

            console.log("SMS sent successfully to:", shopPhoneNumber);
          }
        } catch (error) {
          console.error(
            `Error fetching shop details for shopId ${shopId}: ${error}`
          );
        }
      }

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
