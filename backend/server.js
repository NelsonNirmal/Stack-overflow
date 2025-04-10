const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Question = require('./models/Question'); // Import the Question model
const router = express.Router();
const app = express();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const http = require('http'); // Import http module
require("dotenv").config();


const server = http.createServer(app); // Create an HTTP server
//const io = socketIo(server, { cors: { origin: "*" } }); // Pass server to Socket.IO


const port = process.env.PORT || 5000;
// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/test1', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Middleware
// app.use(cors());
app.use(cors({
  origin: "http://localhost:3000", // ✅ Allow only your frontend URL
  credentials: true, // ✅ Allow credentials (cookies, authorization headers, etc.)
}));
app.use(bodyParser.json());
app.use(express.json());

// User Schema for MongoDB
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: { type: String, default: null }, // Will be empty for Google-authenticated users
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth users
  profilePic: String, // Store Google profile picture if needed
});

const User = mongoose.model('User', userSchema, 'users');

// Sign-up route
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    return res.status(201).json({ message: 'Signup successful!' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found!' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    return res.status(200).json({ message: 'Login successful!' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err });
  }
});



// API endpoint to save a question
app.post('/api/questions', async (req, res) => {
  const { title, details, attempts, tags } = req.body;

  try {
    const question = new Question({ title, details, attempts, tags, answers: [] }); // Initialize answers as empty array
    await question.save();
    res.status(201).json({ message: 'Question saved successfully!', question });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save question.', error });
  }
});

// Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find(); // Fetch all questions from the database
    res.status(200).json(questions); // Respond with the questions
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch questions.', error });
  }
});

// Get a single question by `id_no`
router.get('/questions/:id', async (req, res) => {
  console.log("Received request for question ID:", req.params.id);  // Debugging

  try {
    const question = await Question.findOne({ id_no: parseInt(req.params.id) }); // Fetch question by id_no field
    console.log("Fetched question:", question);  // Display the question

    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    res.json(question); // Return the question with answers
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Server error while fetching question.' });
  }
});

// API endpoint to submit an answer to a question
app.post('/api/questions/:id/answers', async (req, res) => {
  const questionId = req.params.id;
  const { content, author } = req.body;

  try {
    const question = await Question.findOne({ id_no: parseInt(questionId) }); // Fetch question by id_no
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    // Add the new answer to the answers array
    question.answers.push({ content, author, time: new Date() });
    await question.save();

    res.status(201).json({ message: 'Answer submitted successfully!', question });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer.' });
  }
});

// Use the router for routes starting with /api
app.use('/api', router); // Add this line to link the router to the app

// const otpStore = {};

// const sendEmailOTP = async (email) => {
//   const otp = Math.floor(100000 + Math.random() * 900000);
//   otpStore[email] = otp;

//   const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: { user: 'agileshvigram@gmail.com', pass: 'lrem vgfe xxlh rejq' },
//   });

//   await transporter.sendMail({
//     from: 'agileshvigram@gmail.com',
//     to: email,
//     subject: 'Language Change OTP',
//     text: `Your OTP is ${otp}`,
//   });

//   return otp;
// };

// const sendSMSOTP = async (phone) => {
//   const otp = Math.floor(100000 + Math.random() * 900000);
//   otpStore[phone] = otp;

//   const client = twilio('TWILIO_SID', 'TWILIO_AUTH_TOKEN');
//   await client.messages.create({
//     body: `Your OTP is ${otp}`,
//     from: 'your-twilio-number',
//     to: phone,
//   });

//   return otp;
// };

// app.post('/api/send-email-otp', async (req, res) => {
//   const { email } = req.body;
//   await sendEmailOTP(email);
//   res.json({ message: 'Email OTP sent' });
// });

// app.post('/api/send-sms-otp', async (req, res) => {
//   const { phone } = req.body;
//   await sendSMSOTP(phone);
//   res.json({ message: 'SMS OTP sent' });
// });

// app.post('/api/verify-otp', (req, res) => {
//   const { otp, identifier } = req.body;
//   if (otpStore[identifier] == otp) {
//     delete otpStore[identifier];
//     return res.json({ success: true });
//   }
//   res.json({ success: false });
// });
const OTP = mongoose.model('OTP', new mongoose.Schema({
  identifier: String,  // Email or Mobile Number
  otp: String,
  expiresAt: Date
}));

const otp = mongoose.model('otp', userSchema, 'otp_verification');
// Twilio setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer setup
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// Generate OTP function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Email OTP function
const sendEmailOTP = async (email, otp) => {
    const mailOptions = {
        from: 'agileshvigram@gmail.com',
        to: email,
        subject: 'Your OTP for Authentication',
        text: `Your OTP is: ${otp}`
    };
    await transporter.sendMail(mailOptions);
};

// Send Mobile OTP function
const sendMobileOTP = async (phone, otp) => {
    await twilioClient.messages.create({
        body: `Your OTP is: ${otp}`,
        from: '+917708440769',
        to: phone
    });
};

// API to send OTP (Email or Mobile)
app.post('/send-otp', async (req, res) => {
    const { identifier, type } = req.body;  // identifier = email or phone, type = 'email' or 'mobile'

    if (!identifier || !type) {
        return res.status(400).json({ message: "Identifier and type are required!" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    await OTP.findOneAndUpdate({ identifier }, { otp, expiresAt }, { upsert: true });

    try {
        if (type === 'email') {
            await sendEmailOTP(identifier, otp);
        } else if (type === 'mobile') {
            await sendMobileOTP(identifier, otp);
        }
        res.json({ message: `OTP sent successfully to ${identifier}` });
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error });
    }
});

// API to verify OTP
app.post('/verify-otp', async (req, res) => {
    const { identifier, otp } = req.body;
    const record = await OTP.findOne({ identifier });

    if (!record) {
        return res.status(400).json({ message: "OTP not found, please request a new one." });
    }

    if (record.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
        return res.status(400).json({ message: "OTP expired" });
    }

    await OTP.deleteOne({ identifier });
    res.json({ message: "OTP verified successfully" });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "agileshvigram@gmail.com",
    pass: "lrem vgfe xxlh rejq",
  },
});

const userRoutes = require("./routes/userRoutes");
const followRoutes = require("./routes/follow");
const authRoutes = require("./routes/authRoutes");
const followRoute = require("./routes/followRoutes");
app.use("/api", followRoute)

app.use("/api/users1", userRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/auth1", authRoutes);

const questionSchema= new mongoose.Schema({
  text: String,
  videoUrl: String,
  answers: [{ text: String }]
});

// ✅ Import the correct model
const Question1 = mongoose.model('Question1', questionSchema);


// ✅ Get all questions
app.get('/questions1', async (req, res) => {
  try {
    const questions = await Question1.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching questions" });
  }
});

// ✅ Ask a new question (with YouTube URL processing)
app.post('/ask-question1', async (req, res) => {
  try {
    let { text, videoUrl } = req.body;

    // Convert YouTube link to embeddable format
    if (videoUrl && videoUrl.includes("youtube.com")) {
      videoUrl = videoUrl.replace("watch?v=", "embed/");
    } else if (videoUrl && videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.split("/").pop();
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const newQuestion = new Question1({ text, videoUrl, answers: [] });
    await newQuestion.save();

    res.status(201).json({ message: "Question added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding question" });
  }
});

// ✅ Answer a question
app.post('/answer-question1', async (req, res) => {
  try {
    const { questionId, text } = req.body;

    await Question1.findByIdAndUpdate(questionId, {
      $push: { answers: { text } }
    });

    res.status(201).json({ message: "Answer added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding answer" });
  }
});



// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
