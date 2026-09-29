const mongoose = require("mongoose");

const checkOtherOplog = async () => {
  const otherUri = "mongodb+srv://admin:YjeIAtxM11wFeI0W@cluster0.nuputvl.mongodb.net/local";
  try {
    const conn = await mongoose.createConnection(otherUri).asPromise();
    console.log("Connected to other database local.");
    const oplog = conn.collection("oplog.rs");
    const count = await oplog.countDocuments({});
    console.log("Other Oplog entries count:", count);

    if (count > 0) {
      const oldest = await oplog.find({}).sort({ ts: 1 }).limit(1).toArray();
      const newest = await oplog.find({}).sort({ ts: -1 }).limit(1).toArray();
      const namespaces = await oplog.distinct("ns").catch(e => "blocked distinct");

      const getSeconds = (ts) => {
        if (!ts) return 0;
        if (typeof ts.getHighBits === "function") return ts.getHighBits();
        if (ts.seconds) return ts.seconds;
        return parseInt(ts.toString());
      };

      const oldestSec = getSeconds(oldest[0].ts);
      const newestSec = getSeconds(newest[0].ts);

      console.log("Other Database Oldest timestamp:", new Date(oldestSec * 1000).toISOString());
      console.log("Other Database Newest timestamp:", new Date(newestSec * 1000).toISOString());
      console.log("Namespaces:", namespaces);
    }
  } catch (err) {
    console.error("Failed to read other oplog:", err.message);
  } finally {
    process.exit(0);
  }
};

checkOtherOplog();
