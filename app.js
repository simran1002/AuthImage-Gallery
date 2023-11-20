require("dotenv").config();

const express = require("express");
const multer = require('multer');
const sharp = require('sharp');
const path = require("path");
const ejs = require("ejs");
const fs = require('fs');
const uploadsFolder = 'path/to/upload';
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
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

var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.get('/success', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ,
      passReqToCallback: true
    },
    async function (request, accessToken, refreshToken, profile, done) {
      console.log(profile)
      return done(null, profile)
    }
  )
);

app.get('/',(req,res)=> {
    res.render("pages/auth")
})

app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });

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

// Set up storage using multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Handle image upload and cropping
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // Process and save the image
        const processedImageBuffer = await processImage(req.file.buffer);

        // Save the processed image to the server
        const imageName = `edited-${Date.now()}.png`;
        const imagePath = path.join(__dirname, 'public', 'uploads', imageName);

        await sharp(processedImageBuffer)
            .toFile(imagePath);

        res.json({ success: true, imagePath: `/uploads/${imageName}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Image processing function
async function processImage(buffer) {
    return sharp(buffer)
        .resize(300, 300) // Set the desired dimensions
        .webp({ quality: 80 })
        .toBuffer();
}

// Get a list of uploaded images
app.get('/gallery', (req, res) => {
  const imageFiles = fs.readdirSync(uploadsFolder);
  const imagePaths = imageFiles.map(file => `/uploads/${file}`);
  res.json({ images: imagePaths });
});


app.listen(PORT,() => {
    console.log(`Server is running at Port ${PORT}`);
});