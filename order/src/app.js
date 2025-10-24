const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");

class App {
  constructor() {
    this.app = express();
    this.app.use((req, res, next) => {
      console.log(`[Order Service][Docker] ${req.method} ${req.originalUrl}`);
      next();
    });
    this.connectDB();
    this.setupOrderConsumer();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  async setupOrderConsumer() {
    const delay = config.rabbitMQConnectDelayMs;

    const scheduleRetry = () => {
      console.log(`Retrying RabbitMQ connection in ${delay}ms...`);
      setTimeout(connectToRabbitMQ, delay);
    };

    const connectToRabbitMQ = async () => {
      console.log("Connecting to RabbitMQ...");

      try {
        const connection = await amqp.connect(config.rabbitMQURI);
        console.log("Connected to RabbitMQ");

        connection.on("close", () => {
          console.warn("RabbitMQ connection closed");
          scheduleRetry();
        });

        connection.on("error", (error) => {
          console.error("RabbitMQ connection error:", error.message);
        });

        const channel = await connection.createChannel();
        await channel.assertQueue(config.orderQueue, { durable: true });

        channel.consume(config.orderQueue, async (data) => {
          console.log("Consuming ORDER service");
          const { products, username, orderId } = JSON.parse(data.content);

          const newOrder = new Order({
            products,
            user: username,
            totalPrice: products.reduce((acc, product) => acc + product.price, 0),
          });

          await newOrder.save();

          channel.ack(data);
          console.log("Order saved to DB and ACK sent to ORDER queue");

          const { user, products: savedProducts, totalPrice } = newOrder.toJSON();
          channel.sendToQueue(
            config.productQueue,
            Buffer.from(
              JSON.stringify({ orderId, user, products: savedProducts, totalPrice })
            ),
            { persistent: true }
          );
        });
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
        scheduleRetry();
      }
    };

    setTimeout(connectToRabbitMQ, delay);
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`Server started on port ${config.port}`)
    );
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
  }
}

module.exports = App;