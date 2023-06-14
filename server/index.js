const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const dotenv=require('dotenv')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const User=require("./models/user")
const Job=require("./models/job")
const cors = require('cors');
const PORT=process.env.PORT||4000
dotenv.config()

const app=express();
app.use(cors());
app.use(bodyParser.urlencoded({extended:false}))
app.set('view engine','ejs')
app.use(express.static('./public'))
//Specific Middleware
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { email } = decodedToken;

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};


//App health route
app.get('/',(req,res)=>{
    res.send({message:'All good'})
})

//Register Route
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
  res.send({status:'success',message:"User created successfully",name,email,jwtToken})
  }
  catch(error)
  {
    const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;

    next(customError);
  }
 
})

//Login Route
app.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      let passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const { name, mobile } = user;
        const jwtToken = jwt.sign(
          { name, email, mobile },
          process.env.JWT_SECRET_KEY
        );
        return res.send({
          status: 'SUCCESS',
          message: 'User logged in successfully',
          name,
          email,
          jwtToken,
          
        });
      }
    }
    res.send({ status: 'FAIL', message: 'Incorrect Credentials' });
  } catch (error) {
    console.error(error);
    const customError = new Error('Something went wrong! Please try again later.');
    customError.status = 500;
    next(customError);
  }
});

//Creating a new Job post
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
 console.log(req.user.name)
 console.log(req.user.mobile)
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
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Filtering jobs based on skills
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

//Find detailed job description using Job ID
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

//For editing the job post
app.put('/job/:id', isAuthenticated, async (req, res) => {
  const jobId = req.params.id;
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

  try {
    // Find the job post by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the authenticated user is the owner of the job post
    if (job.userEmail !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update the job post fields
    job.companyName = companyName;
    job.logoUrl = logoUrl;
    job.jobPosition = jobPosition;
    job.monthlySalary = monthlySalary;
    job.jobType = jobType;
    job.remoteOffice = remoteOffice;
    job.location = location;
    job.jobDescription = jobDescription;
    job.aboutCompany = aboutCompany;
    job.skills = skills;

    // Save the updated job post
    await job.save();

    res.json({ message: 'Job post updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update job post' });
  }
});

//General Middleware for error handling
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

//Server Connection+ Mongo DB connection
app.listen(PORT,()=>{
    mongoose.connect(process.env.MONGODB_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  ).then(()=> {console.log('Server Running');console.log('DB connection successfull')})
  .catch((err)=>console.log('DB connection failed',err));
})