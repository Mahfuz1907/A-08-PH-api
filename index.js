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
const bookingsCollection = database.collection("bookings");
const usersCollection = database.collection("user");

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

// get studio by email
app.get("/studios/email/:email", async (req, res) => {
  const { email } = req.params;
  const studio = await studiosCollection.find({ hostEmail: email }).toArray();
  res.send(studio);
});

// edit studio
app.put("/studios/edit/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const filter = { _id: new ObjectId(id) };

  const updateDoc = {
    $set: {
      title: updatedData.title,
      category: updatedData.category,
      "hourly-rate": updatedData["hourly-rate"],
      securityDeposit: updatedData.securityDeposit,
      maxCapacity: updatedData.maxCapacity,
      location: updatedData.location,
      imageUrl: updatedData.imageUrl,
      amenities: updatedData.amenities,
      description: updatedData.description,
    },
  };

  const result = await studiosCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// delete studio
app.delete("/studios/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await studiosCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

// get featured studios
app.get("/featured-studios", async (req, res) => {
  const cursor = studiosCollection.find({});
  const featuredStudios = await cursor.sort({ _id: -1 }).limit(6).toArray();
  res.send(featuredStudios);
});

// get categoires route
app.get("/categories", async (req, res) => {
  const cursor = categoriesCollection.find({});
  const categories = await cursor.toArray();
  res.send(categories);
});

// add bookings
app.post("/add-bookings", async (req, res) => {
  const newBooking = req.body;
  const existingBookings = await bookingsCollection
    .find({
      studioId: newBooking.studioId,
      bookingDate: newBooking.bookingDate,
      status: { $ne: "Canceled" },
    })
    .toArray();

  const isConflict = existingBookings.some((booking) => {
    const existingStart = booking.startTime;
    const existingEnd = booking.endTime;
    const newStart = newBooking.startTime;
    const newEnd = newBooking.endTime;

    return existingStart < newEnd && existingEnd > newStart;
  });

  if (isConflict) {
    return res.status(400).send({
      success: false,
      message: "This slot is already booked!",
    });
  }

  const result = await bookingsCollection.insertOne(newBooking);

  res.send(result);
});

// get bookings
app.get("/bookings", async (req, res) => {
  const cursor = bookingsCollection.find({});
  const bookings = await cursor.toArray();
  res.send(bookings);
});

// get bookings by id
app.get("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(booking);
});

// get bookings by user
app.get("/bookings/user/:email", async (req, res) => {
  const { email } = req.params;
  const bookings = await bookingsCollection
    .find({
      userEmail: email,
    })
    .toArray();
  res.send(bookings);
});

// cancel booking
app.patch("/bookings/cancel/:id", async (req, res) => {
  const { id } = req.params;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: "Canceled",
    },
  };
  const result = await bookingsCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// delete bookings
app.delete("/bookings/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookingsCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

// get users
app.get("/users", async (req, res) => {
  const cursor = usersCollection.find({});
  const users = await cursor.toArray();
  res.send(users);
});

// get user by id
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await usersCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(user);
});

// app listen port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
