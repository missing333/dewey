//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});

const password = "test123";
mongoose
  .connect(
    "mongodb+srv://mmissing3:" +
      password +
      "@cluster0.dgj4kzb.mongodb.net/todoDB"
  )
  .then(() => {
    console.log("Database connected!");
    processDB();
  })
  .catch((err) => console.log(err));

const todoSchema = new mongoose.Schema({ name: String });
const Item = mongoose.model("Item", todoSchema);

const listSchema = new mongoose.Schema({ name: String, items: [todoSchema] });
const List = mongoose.model("List", listSchema);

async function processDB() {}

const item1 = new Item({ name: "task 1" });
const item2 = new Item({ name: "task 2" });
const item3 = new Item({ name: "task 3" });
const defaultTasks = [item1, item2, item3];

const day = date.getDate();

app.get("/", async function (req, res) {
  const allItems = await Item.find();
  // console.log(allItems);

  if (allItems.length == 0) {
    Item.insertMany(defaultTasks);
    console.log("saved initial items to DB");
    res.redirect("/");
  } else {
    res.render("list", { listTitle: day, newListItems: allItems });
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName == day) {
    newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async (req, res) => {
  const checkboxID = req.body.checkbox;
  const listName = req.body.listName;

  // console.log("box id: " + checkboxID + ", list name: " + listName);

  if (listName == day) {
    //default list
    // console.log("deleting from the default list");
    Item.findByIdAndRemove(checkboxID).exec();
    console.log("Removed task: " + checkboxID);
    res.redirect("/");
  } else {
    //custom list
    console.log("deleting from a custom list");
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkboxID } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:listName", async function (req, res) {
  const customListName = req.params.listName;
  console.log("the custom list is: " + customListName);

  //does the list exist?
  const listExists = await List.findOne({ name: customListName }).exec();
  // console.log("Found: " + listExists);

  if (listExists != null) {
    // console.log("That list exists!");
    res.render("list", {
      listTitle: customListName,
      newListItems: listExists.items,
    });
  } else {
    // console.log("That list doesn't exist!");
    const list = new List({ name: customListName, items: defaultTasks });
    list.save();
    res.redirect(`/${customListName}`);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});
