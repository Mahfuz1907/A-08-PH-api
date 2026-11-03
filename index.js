import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

// define express app and port
const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// connect to mongodb and get the collections
const mongoClient = await connectToMongoDB();
const database = mongoClient.db("studio-space");
const studiosCollection = database.collection("studios");
const categoriesCollection = database.collection("categories");

// verify token

// home route
app.get("/", async (req, res) => {
  res.send("Welcome to studio space booking API");
});

// add-studio route
app.post("/add-studio", async (req, res) => {
  const studio = req.body;
  const result = await studiosCollection.insertOne(studio);
  console.log(result);
  res.send(result);
});

// get all studio
app.get("/studios", async (req, res) => {
  const cursor = studiosCollection.find({});
  const studios = await cursor.toArray();
  res.send(studios);
});

// get studio by id
app.get("/studios/:id", async (req, res) => {
  const { id } = req.params;
  const studio = await studiosCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(studio);
});

// get featured studios
app.get("/featured-studios", async (req, res) => {
  const cursor = studiosCollection.find({});
  const featuredStudios = await cursor.limit(6).toArray();
  res.send(featuredStudios);
});

// get categoires route
app.get("/categories", async (req, res) => {
  const cursor = categoriesCollection.find({});
  const categories = await cursor.toArray();
  res.send(categories);
});

// get studio by categories
app.get("/categories/:category", async (req, res) => {
  const rawCategory = req.params.category;

  const query = {
    category: { $regex: new RegExp(`^${rawCategory}$`, "i") },
  };
  console.log("Query:", query);
  const studio = await studiosCollection.find(query).toArray();
  res.send(studio);
});

// app listen port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
