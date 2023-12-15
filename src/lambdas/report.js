const { MongoClient } = require('mongodb');

const diffTime = (dateRecent, dateOld) =>
  new Date(dateRecent).getTime() - new Date(dateOld).getTime();

const reportReduce = (orders, status) =>
  orders.reduce(
    (acc, order, index) => {
      const ONE = 1;

      const {
        orderId,
        ticketId,
        ticketCreatedAt,
        orderCreatedAt,
        sendQueueMessageAt,
        receivedQueueMessageAt,
        manufacturingStartedAt,
        manufacturingFinishedAt,
        updatedAt,
      } = status.find(({ orderId }) => orderId === `${order._id}`);

      const diffs = {
        orderCreatedTime: diffTime(ticketCreatedAt, orderCreatedAt),
        ticketCreatedTime: diffTime(sendQueueMessageAt, ticketCreatedAt),
        queueTime: diffTime(receivedQueueMessageAt, sendQueueMessageAt),
        manufacturingTime: diffTime(manufacturingFinishedAt, manufacturingStartedAt),
        availableDelivery: diffTime(updatedAt, manufacturingFinishedAt),
        totalOrderTime: diffTime(updatedAt, orderCreatedAt),
      };

      acc.timeAccumulator.orderCreatedTime += diffs.orderCreatedTime;
      acc.timeAccumulator.ticketCreatedTime += diffs.ticketCreatedTime;
      acc.timeAccumulator.queueTime += diffs.queueTime;
      acc.timeAccumulator.manufacturingTime += diffs.manufacturingTime;
      acc.timeAccumulator.availableDelivery += diffs.availableDelivery;
      acc.timeAccumulator.totalOrderTime += diffs.totalOrderTime;

      acc.timeString.push({
        orderId,
        ticketId,
        description: order.description,
        orderCreatedTime: timeToString(diffs.orderCreatedTime),
        ticketCreatedTime: timeToString(diffs.ticketCreatedTime),
        queueTime: timeToString(diffs.queueTime),
        manufacturingTime: timeToString(diffs.manufacturingTime),
        availableDelivery: timeToString(diffs.availableDelivery),
        totalOrderTime: timeToString(diffs.totalOrderTime),
      });

      if (index === orders.length - ONE) {
        acc.timeAccString = {
          orderCreatedTime: timeToString(acc.timeAccumulator.orderCreatedTime / orders.length),
          ticketCreatedTime: timeToString(acc.timeAccumulator.ticketCreatedTime / orders.length),
          queueTime: timeToString(acc.timeAccumulator.queueTime / orders.length),
          manufacturingTime: timeToString(acc.timeAccumulator.manufacturingTime / orders.length),
          availableDelivery: timeToString(acc.timeAccumulator.availableDelivery / orders.length),
          totalOrderTime: timeToString(acc.timeAccumulator.totalOrderTime / orders.length),
        };
      }

      return acc;
    },
    {
      timeString: [],
      timeAccString: {
        orderCreatedTime: '',
        ticketCreatedTime: '',
        queueTime: '',
        manufacturingTime: '',
        availableDelivery: '',
        totalOrderTime: '',
      },
      timeAccumulator: {
        orderCreatedTime: 0,
        ticketCreatedTime: 0,
        queueTime: 0,
        manufacturingTime: 0,
        availableDelivery: 0,
        totalOrderTime: 0,
      },
    },
  );

const timeToString = (time) => {
  const ONE_HOUR = 3600000;
  const ONE_MINUTE = 60000;
  const ONE_SECOND = 1000;

  if (time >= ONE_HOUR) {
    return `approximately ${Math.ceil(time / ONE_HOUR)} hour(s)`;
  }

  if (time >= ONE_MINUTE) {
    return `approximately ${Math.ceil(time / ONE_MINUTE)} minute(s)`;
  }

  if (time >= ONE_SECOND) {
    return `approximately ${Math.ceil(time / ONE_SECOND)} second(s)`;
  }

  return `${time} millisecond(s)`;
};

module.exports.handler = async () => {
  try {
    const TWENTY_FOUR_HOURS = 86400000;

    const dateNow = new Date();
    const [date] = new Date(dateNow.getTime() - TWENTY_FOUR_HOURS).toISOString().split('T');

    const mongoClient = new MongoClient('mongodb://localhost:27017').connect();
    const db = (await mongoClient).db('data');

    const mongoFilter = {
      $and: [
        { active: false },
        { updatedAt: { $gte: new Date(`${date}T00:00:00.000Z`) } },
        { updatedAt: { $lte: new Date(`${date}T23:59:59.999Z`) } },
      ],
    };

    const statusOptions = {
      projection: { _id: false, createdAt: false, active: false },
    };

    const ordersOptions = {
      projection: { description: true },
    };

    const [status, orders] = await Promise.all([
      db.collection('status').find(mongoFilter, statusOptions).toArray(),
      db.collection('orders').find(mongoFilter, ordersOptions).toArray(),
    ]);

    const report = reportReduce(orders, status);

    await db.collection('reports').insertOne({
      date,
      averageAccumulatedTime: report.timeAccString,
      reportTimeList: report.timeString,
    });

    (await mongoClient).close();
  } catch (error) {
    return {
      status: 500,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};
