const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

// Configure multer for video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'login-photo/');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/');
    } else {
      cb(new Error('Unsupported file type'), null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const processVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  const videoPath = req.file.path;
  const username = req.params.username;  
  console.log('Video path:', videoPath);
  console.log('Username:', username);

  // Path and options for dataSet.py
  const dataSetScriptPath = path.join(__dirname, '../dataSet.py');
  const dataSetOptions = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.dirname(dataSetScriptPath),
    args: [videoPath, username]
  };

  // Running dataSet.py dodaj argument user.username
  PythonShell.run('dataSet.py', dataSetOptions).then(dataSetMessages => {

    console.log('dataSet.py script finished');
    // Path and options for learn.py
    const learnScriptPath = path.join(__dirname, '../learn.py');
    const learnOptions = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.dirname(learnScriptPath),
      args: [username] 
    };
    
    // Running learn.py
    PythonShell.run('learn.py', learnOptions).then(learnMessages => {
     
      console.log('learn.py script finished');
      try {
        const learnResult = JSON.parse(learnMessages[0]);
        res.json({dataSetResult: JSON.parse(dataSetMessages[0]), learnResult: learnResult});
      } catch (parseError) {
        console.error('Error parsing result:', parseError);
        res.status(500).json({ error: 'Error parsing result.' });
      }
    });
  });
};

const processPhoto = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo file uploaded.' });
  }

  const photoPath = req.file.path;
  const username = req.params.username;  
  console.log('Photo path:', photoPath);
  console.log('Username:', username);

  // Add more Python processing as needed
  const recognizeScriptPath = path.join(__dirname, '../recognize.py');
  const recognizeOptions = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.dirname(recognizeScriptPath),
    args: [username]
  };

  PythonShell.run('recognize.py', recognizeOptions).then(results => {
   
    console.log('recognize.py script finished', results);
    
    // Preberite izhod Python skripte
    try {
      const parsedData = JSON.parse(results[0]);
      const { is_match } = parsedData;
      // Odgovorite samo s statusom ujemanja
      res.json({
        success: true,
        is_match: is_match
      });

      // Delete the uploaded photo after recognition
      fs.unlink(photoPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting the photo:', unlinkErr);
        } else {
          console.log('Photo deleted successfully:', photoPath);
        }
      }); 
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      res.status(500).json({ error: 'Error parsing result.' });
    }
  });
};

module.exports = { upload, processVideo, processPhoto };
