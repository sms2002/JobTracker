const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const dotenv=require('dotenv')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const User=require("./models/user")
const Job=require("./models/job")
dotenv.config()

const app=express();
app.use(bodyParser.urlencoded({extended:false}))
app.set('view engine','ejs')
app.use(express.static('./public'))

const isAuthenticated=(req,res,next)=>
{
  try
  {
    const user=jwt.verify(req.headers.token,process.env.JWT_SECRET_KEY)
    req.user=user//this will decode the user details sent via the payload as req to the next middleware in case of chaining
  }catch(error)
  {
    return res.send({status:'Fail',message:'Please login first'})
  }
    next()//this is done in middlewares after the execution if everything is fine 
    //then the place where this middleware is called can continue their execution
    //that is in here the private-route 
}
app.get('/',(req,res)=>{
    res.send({message:'All good'})
})
app.post('/register',async(req,res)=>{
  const{name,email,mobile,password}=req.body;

  if (!name || !email || !mobile || !password) {
    const customError = new Error('Missing required fields');
    customError.status = 400;
    return next(customError);
  }
  try
  {
    const user=await User.findOne({email});
    if(user)
    {
      return res.send(
        {
          status:"Fail",
          message:"User already exists with this email"
        }
      )
    }
  const encryptedPassword=await bcrypt.hash(password,10)

  await User.create({
    name,email,mobile,password:encryptedPassword
  })
  const jwtToken=jwt.sign(
    {name,email,mobile},
    process.env.JWT_SECRET_KEY
    )
  res.send({status:'success',message:"User created successfully",jwtToken})
  }
  catch(error)
  {
    const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;

    next(customError);
  }
 
})
app.post('/login',async (req,res)=>{
  const{name,email,mobile,password}=req.body;
  try
  {
 const user=await User.findOne({email});
 if(user)
 {
  let passwordMatch=await bcrypt.compare(password,user.password)
  if(passwordMatch)
  {
    const jwtToken=jwt.sign(
      {name,email,mobile},
      process.env.JWT_SECRET_KEY
      )
    return res.send({
      status:'SUCCESS',
      message:"User logged in successfully",
      jwtToken
    })
  }
  }
  res.send({status:'FAIL',message:"Incorrect Credentials"})
}
catch(error)
{
  const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;

    next(customError);
}
})
app.post('/job', isAuthenticated, (req, res) => {
  // Validate the request body fields
  const {
    companyName,
    logoUrl,
    jobPosition,
    monthlySalary,
    jobType,
    remoteOffice,
    location,
    jobDescription,
    aboutCompany,
    skills
  } = req.body;
 console.log(req.user.email)
 const {email}=req.user
  // Perform validation checks on the required fields
  if (!companyName || !logoUrl || !jobPosition || !monthlySalary || !jobType || !remoteOffice || !location || !jobDescription || !aboutCompany || !skills) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate the job type field
  if (jobType !== 'Full Time' && jobType !== 'Part Time') {
    return res.status(400).json({ error: 'Invalid job type. Allowed values are "Full Time" or "Part Time"' });
  }

  // Create a new job object with the validated fields
  const job = new Job({
    companyName,
    logoUrl,
    jobPosition,
    monthlySalary,
    jobType,
    remoteOffice,
    location,
    jobDescription,
    aboutCompany,
    skills,
    userEmail:email
  });

  // Save the job to the database
  job.save()
    .then(() => {
      res.status(201).json({ message: 'Job post created successfully' });
    })
    .catch((error) => {
      res.status(500).json({ error: 'Failed to create job post' });
    });
});
app.get('/filterjobs',async(req,res)=>{
  try {
    // Get user input skills from x-www-urluncoded header'skills' body
    //From frontend user should send skills in , seperated values
    const userInputSkills = req.body.skills.split(',');

    // Find jobs that contain all of the user input skills
    const jobs = await Job.find({ skills: { $in: userInputSkills } });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
})
app.get('/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;

    // Find the job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    error: {
      status: err.status || 500,
      message: err.message || 'Something went wrong! Please try again later.',
    },
  });
});

app.listen(process.env.PORT,()=>{
    mongoose.connect(process.env.MONGODB_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  ).then(()=> {console.log('Server Running');console.log('DB connection successfull')})
  .catch((err)=>console.log('DB connection failed',err));
})