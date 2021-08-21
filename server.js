const express = require('express');
const bodyparser=require("body-parser");
const mongoose= require('mongoose');
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const app = express();
require('dotenv').config();
const bcrypt = require('bcryptjs');
const salt = 10;
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());
app.use(cookieParser());
app.use(express.static("public"));

// get our urls and secrets
const JWT_SECRET=process.env.jwt;
const MONGODB_URL=process.env.mongodb;

// making connnection with our database
mongoose.connect(MONGODB_URL, {useFindAndModify: false,useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true});

// Schema For User Auth
const userSchema = new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true}
},{collection:'users'}
)
const User= mongoose.model("User",userSchema);

app.post('/signup',async (req,res)=>{
	// geting our data from frontend
	const {email,password:plainTextPassword}=req.body;
	// encrypting our password to store in database
	const password = await bcrypt.hash(plainTextPassword,salt);
	try {
		// storing our user data into database
		const response = await User.create({
			email,
			password
		})
		return res.redirect('/');
	} catch (error) {
		console.log(JSON.stringify(error));
		if(error.code === 11000){
			return res.send({status:'error',error:'email already exists'})
		}
		throw error
	}
})


// user login function
const verifyUserLogin = async (email,password)=>{
    try {
        const user = await User.findOne({email}).lean()
        if(!user){
            return {status:'error',error:'user not found'}
        }
        if(await bcrypt.compare(password,user.password)){
            // creating a JWT token
            token = jwt.sign({id:user._id,username:user.email,type:'user'},JWT_SECRET)
            return {status:'ok',data:token}
        }
        return {status:'error',error:'invalid password'}
    } catch (error) {
        console.log(error);
        return {status:'error',error:'timed out'}
    }
}

// login 
app.post('/login',async(req,res)=>{
	const {email,password}=req.body;
	// we made a function to verify our user login
    const response = await verifyUserLogin(email,password);
    if(response.status==='ok'){
		// storing our JWT web token as a cookie in our browser
        res.cookie('token',token,{ maxAge: 2 * 60 * 60 * 1000, httpOnly: true });  // maxAge: 2 hours
        res.redirect('/');
    }else{
        res.json(response);
    }
})

const verifyToken = (token)=>{
    try {
        const verify = jwt.verify(token,JWT_SECRET);
        if(verify.type==='user'){return true;}
        else{return false};
    } catch (error) {
        console.log(JSON.stringify(error),"error");
        return false;
    }
}



// get requests
app.get('/',(req,res)=>{
	const {token}=req.cookies;
    if(verifyToken(token)){
        return res.render('home');
    }else{
        res.redirect('/login')
    }
})

app.get('/login',(req,res)=>{
	res.render('signin');
})

app.get('/signup',(req,res)=>{
	res.render('signup')
})


app.listen(port,()=>{
	console.log(`Running on port ${port}`);
})