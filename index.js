const express = require("express");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
require("dotenv").config();

const { genHashPassword, comparePassword } = require("./utils/password");

const jwt = require("jsonwebtoken");

const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;
//mongodb://localhost:27017
// app.use(bodyParser.urlencoded({ extended: true }));

const tokenKey = "325242vbcfxd";

function isUserAuthorization(authorization) {
  let result = false;
  jwt.verify(
    authorization.split(' ')[1],
    tokenKey,
    (err, payload) => {
      if (err) result = false;
      else if (payload) {
        result = true;
      }
    }
  );
  return result;
}

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
  });

  app.get("/goods/get/:id", cors(), async (req, res) => {
    const collection = db.collection("goods");
    let results = await collection
      .find({ _id: new mongodb.ObjectId(req.params.id) })
      .limit(50)
      .toArray();
    res.send(results).status(200);
  });

  app.post("/goods/add", cors(), async (req, res) => {
    if (!isUserAuthorization(req.headers.authorization)) {
      res.send("You not autorization").status(401);
      return 0;
    }

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
    if (!isUserAuthorization(req.headers.authorization)) {
      res.send("You not autorization").status(401);
      return 0;
    }

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

  app.post("/auth/signup", async (req, res) => {
    const collection = db.collection("users");
    const insertObject = {
      email: req.body.email,
      password: await genHashPassword(req.body.password),
      createdDate: new Date().toISOString(),
    };
    try {
      const result = await collection.insertOne(insertObject);
      res
        .json({
          userId: result.insertedId,
          token: jwt.sign({ id: result.insertedId }, tokenKey, { expiresIn: '1h' }),
        })
        .status(201);
    } catch (e) {
      res.json(e).status(400);
    }
  });

  app.post("/auth/login", cors(), async (req, res) => {
    const collection = db.collection("users");
    let results = await collection
      .find({ email: req.body.email })
      .limit(50)
      .toArray();

    if (!results.length) {
      res.send("User not found").status(404);
    }
    const user = results[0];

    if (await comparePassword(req.body.password, user.password)) {
      res
        .json({
          userId: user._id,
          token: jwt.sign({ id: user._id }, tokenKey, { expiresIn: '1h' }),
        })
        .status(200);
    } else {
      res.send("Password is wrong").status(200);
    }
  });

  app.get("/", (req, res) => res.send("All is well"));

  app.listen(port, () => {
    console.log(`Server run on http://localhost:${port}`);
  });
})();
