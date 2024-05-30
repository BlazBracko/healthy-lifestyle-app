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

  // Path and options for dataSet.py
  const dataSetScriptPath = path.join(__dirname, '../dataSet.py');
  const dataSetOptions = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.dirname(dataSetScriptPath),
    args: [videoPath]
  };

  // Running dataSet.py
  PythonShell.run('dataSet.py', dataSetOptions, (err, results) => {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: 'Error running Python script.' });
    }

    console.log('dataSet.py script finished');
    // Path and options for learn.py
    const learnScriptPath = path.join(__dirname, '../learn.py');
    const learnOptions = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.dirname(learnScriptPath),
      args: [] // Add arguments if needed
    };
    
    // Running learn.py
    PythonShell.run('learn.py', learnOptions, (learnErr, learnResults) => {
      if (learnErr) {
        console.error('Error running learn.py script:', learnErr);
        return res.status(500).json({ error: 'Error running learn.py script.' });
      }
      console.log('learn.py script finished');
      try {
        const learnResult = JSON.parse(learnResults[0]);
        res.json({dataSetResult: JSON.parse(results[0]), learnResult: learnResult});
      } catch (parseError) {
        console.error('Error parsing result:', parseError);
        res.status(500).json({ error: 'Error parsing result.' });
      }
    });
  });
};

module.exports = { uploadVideo, processVideo };
