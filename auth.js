const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function registerUser(username, password) {
  try {
    await client.connect();
    const db = client.db("gameDB");
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({ username, password: hashedPassword });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Registration failed" };
  } finally {
    await client.close();
  }
}

// ... rest of your code ...
