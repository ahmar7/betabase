const app = require("./app");
const User =require('./models/userModel')
var bodyParser = require("body-parser");
const { errorMiddleware } = require("./middlewares/errorMiddleware");
// Database connect
app.use(bodyParser.urlencoded({ extended: true }));
const database = require("./config/database");
database();

const cloudinary = require("cloudinary");

app.get("/", async (req, res) => {
  res.send("working");
});
let PORT = process.env.PORT || 4000;
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

app.use(errorMiddleware);
setInterval(async () => {
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

  await User.updateMany(
    { lastActivity: { $lt: threeMinutesAgo }, online: true },
    { $set: { online: false, lastOnline: new Date() } }
  ); 
}, 60 * 1000); // har 1 min me check karo

let server = app.listen(process.env.PORT, () => {
  console.log(`server is running at ${process.env.PORT}`);
});
