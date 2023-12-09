const express = require("express");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
require('dotenv').config()

const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;
//mongodb://localhost:27017
// app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
  const getConn = async () => {
    try {
      return await MongoClient.connect("mongodb://localhost:27017");
    } catch (e) {
      console.error(e);
    }
  };

  const conn = await getConn();
  const db = conn.db(process.env.MONGO_DB);

  app.get("/goods", cors(), async (req, res) => {
    const collection = db.collection("goods");
    let results = await collection.find({}).limit(50).toArray();
    res.json(results).status(200);
    console.log(results)
  });

  app.get("/goods/:id", cors(), async (req, res) => {
    const collection = db.collection("goods");
    let results = await collection.find({ _id: new mongodb.ObjectId(req.params.id) }).limit(50).toArray();
    res.send(results).status(200);
  });

  app.post("/goods/add", cors(), async (req, res) => {
    const collection = db.collection("goods");
    if (!req.body.name?.length) {
      res.send("Name isn't exist").status(400);
      return 0;
    }
    if (Number(req.body.price) <= 0) {
      res.send("Please , add price").status(400);
      return 0;
    }
    const insertObject = {
      name: req.body.name,
      price: Number(req.body.price),
      createdDate: new Date().toISOString(),
    };
    try {
      const result = await collection.insertOne(insertObject);
      res.send(result.insertedId).status(201);
    } catch (e) {
      res.json(e).status(400);
    }
  });

  app.delete("/goods/delete/:id", cors(), async (req, res) => {
    const id = req.params.id.toString();
    const mongoId = { _id: new mongodb.ObjectId(id) };
    const collection = db.collection("goods");

    try {
      const result = await collection.deleteOne(mongoId);

      res
        .json(`Successfully deleted ${result.deletedCount} document. `)
        .status(200);
    } catch (e) {
      res.json(e).status(400);
    }
  });

  app.get("/", (req, res) => res.send("All is well"));

  app.listen(port, () => {
    console.log(`Server run on http://localhost:${port}`);
  });
})();
