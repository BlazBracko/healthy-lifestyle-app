const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

// Configure multer for video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept videos only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not a video file!'), false);
  }
};

const uploadVideo = multer({ storage: storage, fileFilter: fileFilter });

const processVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  const videoPath = req.file.path;
  console.log('Video path:', videoPath);

  // Example: Integrate Python processing or any other logic
  const scriptPath = path.join(__dirname, '../dataSet.py');
  console.log('Script path:', scriptPath);

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.dirname(scriptPath),
    args: [videoPath]
  };

  PythonShell.run('dataSet.py', options, (err, results) => {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: 'Error running Python script.' });
    }

    console.log('Python script finished');
    try {
      const result = JSON.parse(results[0]);
      res.json(result);
    } catch (parseError) {
      console.error('Error parsing result:', parseError);
      res.status(500).json({ error: 'Error parsing result.' });
    }
  });
};

module.exports = { uploadVideo, processVideo };
