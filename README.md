Adding authentication to an application is one of the most challenging 😖 but also a very important part for developers, but today I will teach you 🥰 how to do it, come on let's make an authentication page with me today in just 10 minutes ⚡.

1.Let's initialize npm and install all the necessary packages that we are going to use.

```bash
npm init -y
npm i express bcryptjs body-parser dotenv ejs jsonwebtoken mongoose cookie-parser
```

2.Now create 2 directories views and public and also create server.js file now your folder structure should look like this 👇.

![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m11mb3p3gqrg5bqi24nu.png)

3.Now include the packages in your server.js and create an express server

here we included all the packages and required code to configure our express server that we will need throughout the journey in this article 🤠.

```javascript
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
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.listen(port,()=>{
	console.log(`Running on port ${port}`);
})
```

4.Now Create 3 files in the views folder 👇.

![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dq4o0cfzvye06zg7xtwe.png)

5.Now lets create our login signup and the protected page.
```javascript
// signin.ejs
<form action="/login" method="post">
<label for="">Email</label>
<input type="email" name="email" id="">
<label for="">Password</label>
<input type="text" name="password" id="">
<button type="submit">SignIN</button>
</form>
<form action="/signup" method="get">
<button type="submit">
    Do not have an account
</button>
</form>
```

```javascript
// signup.ejs
<form action="/signup" method="post">
<label for="">Email</label>
<input type="email" name="email" id="">
<label for="">Password</label>
<input type="text" name="password" id="">
<button type="submit">SignUP</button>
</form>
```

```javascript
//home.ejs
This is the protected page
```

6.Now we will create our .env file and store our secret key of JWT and mongodb connection url and add to our server.

![image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e8nxzaqyx7fic6l7vtgj.png)
 
```javascript
// get our urls and secrets
const JWT_SECRET=process.env.jwt;
const MONGODB_URL=process.env.mongodb;

// making connnection with our database
mongoose.connect(MONGODB_URL, {useFindAndModify: false,useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true});
```
Now your server should look like this 👇.
```javascript
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
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// get our urls and secrets
const JWT_SECRET=process.env.jwt;
const MONGODB_URL=process.env.mongodb;

// making connnection with our database
mongoose.connect(MONGODB_URL, {useFindAndModify: false,useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true});



app.listen(port,()=>{
	console.log(`Running on port ${port}`);
})
```

7.Now we will create Our Schema for User Authentication and our signup method.

```javascript
// Schema For User Auth
const userSchema = new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true}
},{collection:'users'}
const User= mongoose.model("User",userSchema);
)
```

```javascript
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
```

8.Now we will create our Login method here we will use JWT to create an auth token and store  it in our browser as a cookie

```javascript
// user login function
const verifyUserLogin = async (email,password)=>{
    try {
        const user = await User.findOne({email}).lean()
        if(!user){
            return {status:'error',error:'user not found'}
        }
        if(await bcrypt.compare(password,user.password)){
            // creating a JWT token
            token = jwt.sign({id:user._id,username:user.email,type:'user'},JWT_SECRET,{ expiresIn: '2h'})
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
```

9.And finally we will make routes for our remaining pages and check for auth for getting into our protected page

```javascript
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
```

10.Finally Your server.js should  look like this 👇.
```javascript
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
app.use(express.json());
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
            token = jwt.sign({id:user._id,username:user.email,type:'user'},JWT_SECRET,{ expiresIn: '2h'})
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
```

Hurray!! You have successfully added authentication in your website 🥳🥳🥳🥳.
