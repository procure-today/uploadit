const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const cors = require('cors')

const jwt = require('jsonwebtoken')

const uploadImage = require('./helpers/helpers')

const app = express()

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    // no larger than 5mb.
    fileSize: 5 * 1024 * 1024,
  },
});

app.disable('x-powered-by')
app.use(multerMid.single('file'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors());
app.use((req, res, next) => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    var decoded = jwt.verify(token, process.env.JWT_SECRET || 'thisisasamplesecret');
    next()
  } catch(err) {
    // err
    res.status(403).send({message: 'Unauthorised! Please try again'})
  }
})

app.post('/uploads', async (req, res, next) => {
  try {
    const myFile = req.file
    const imageUrl = await uploadImage(myFile)

    res
      .status(200)
      .json({
        message: "Upload was successful",
        data: imageUrl
      })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err,
    message: 'Internal server error!',
  })
  next()
})

app.listen(8080, () => {
  console.log('app now listening for requests!!!')
})

