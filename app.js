require("dotenv").config();

const express = require("express");
const path = require("path");
const ejs = require("ejs");
const passport = require("passport");
const cookieSession = require("cookie-session");
const cors = require("cors");
const { nextTick } = require("process");
const { updateMany, updateOne, update } = require("./source/model/schema");
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 8080
const session = require("express-session");
const schema = require("./source/model/schema");
const { response } = require("express");
require("./source/db/connection");
require("./passport-setup");
const app = express()
app.use(express.json());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());


app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.JWT_SECRET
}));

const views_path = path.join(__dirname,  "./views/pages");
const static_path = path.join(__dirname, "/public");
app.use(express.static(static_path ))
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");


app.get('/',(req,res)=> {
      
    res.render("pages/index")
})


app.get('/pages/login',(req,res) => {
    res.render('pages/login');
})

app.get("/google",passport.authenticate("google", { scope: ["profile", "email"] })
);


app.get("/google/callback",passport.authenticate("google", { failureRedirect: "/failed" }),
    function(req,res){
      if (req.user.email) {
        res.redirect("/success");
      } else {
        res.send("Login using college email only")
      }
    }  
);


app.get('/success',(req,res) => {
  if(req.isAuthenticated()) {
    const userDetails = {
      email: req.user.email,
      name: req.user.name.givenName + " " + req.user.name.familyName,
      profileURL: req.user.picture
    }
    res.render("pages/register", {userDetailsNew: userDetails})
  } else {
    res.redirect("/")
  }   
})

function loggedIn(req, res, next) {
  if (req.user) {
      next();
  } else {
      res.redirect('/google');
  }
}


app.post("/add/registered/user",async (req,res,next)=>{
  console.log(req.body)
    
  
  try {
    const userExist=await schema.findOne({email:req.body.email});
    
    if(!userExist){
      const registerUser=new schema({
        email:req.body.email,
        name:req.body.userName,
        profileurl:req.body.pictureURL,
      })
      const userData=await registerUser.save();
       const token= await registerUser.generateAuthtoken();
      res.cookie("email",token);
      console.log(userData);
      console.log("Registered Successfully");
    }  
    else{
      console.log("User Already Exists")
      const token= await userExist.generateAuthtoken();
      res.cookie("email",token);
    }
    
  } catch (e) {
    console.log(e);
    res.status(400).json({message:"Details missing"});
  }
})
 

app.listen(PORT,() => {
    console.log(`Server is running at Port ${PORT}`);
});