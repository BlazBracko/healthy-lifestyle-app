const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

// Ensure directories exist
const loginPhotoDir = 'login-photo';
const uploadsDir = 'uploads';

[loginPhotoDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure multer for video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, loginPhotoDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, uploadsDir);
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

  // Running dataSet.py
  PythonShell.run('dataSet.py', dataSetOptions)
    .then(dataSetMessages => {
      console.log('dataSet.py script finished');
      console.log('dataSet.py output:', dataSetMessages);
      
      // Parse dataSet result
      let dataSetResult = { success: true };
      try {
        if (dataSetMessages && dataSetMessages.length > 0) {
          const lastMessage = dataSetMessages[dataSetMessages.length - 1];
          if (lastMessage.trim().startsWith('{')) {
            dataSetResult = JSON.parse(lastMessage);
          }
        }
      } catch (parseError) {
        console.log('dataSet.py did not return JSON, assuming success');
      }

      // Path and options for learn.py
      const learnScriptPath = path.join(__dirname, '../learn.py');
      const learnOptions = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(learnScriptPath),
        args: [username] 
      };
      
      // Running learn.py
      return PythonShell.run('learn.py', learnOptions)
        .then(learnMessages => {
          console.log('learn.py script finished');
          console.log('learn.py output:', learnMessages);
          
          // Parse learn result
          let learnResult = { success: true };
          try {
            if (learnMessages && learnMessages.length > 0) {
              const lastMessage = learnMessages[learnMessages.length - 1];
              if (lastMessage.trim().startsWith('{')) {
                learnResult = JSON.parse(lastMessage);
              }
            }
          } catch (parseError) {
            console.log('learn.py did not return JSON, assuming success');
          }

          // Delete the uploaded video after processing
          fs.unlink(videoPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting the video:', unlinkErr);
            } else {
              console.log('Video deleted successfully:', videoPath);
            }
          });

          // Send success response
          res.json({
            success: true,
            message: 'Video processed and model trained successfully',
            dataSetResult: dataSetResult,
            learnResult: learnResult
          });
        })
        .catch(learnError => {
          console.error('Error running learn.py:', learnError);
          
          // Delete the uploaded video even on error
          fs.unlink(videoPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting the video:', unlinkErr);
            }
          });

          res.status(500).json({ 
            error: 'Error training model.',
            details: learnError.message || 'Unknown error'
          });
        });
    })
    .catch(dataSetError => {
      console.error('Error running dataSet.py:', dataSetError);
      
      // Delete the uploaded video on error
      fs.unlink(videoPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting the video:', unlinkErr);
        }
      });

      res.status(500).json({ 
        error: 'Error processing video.',
        details: dataSetError.message || 'Unknown error'
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

  // Preveri, ali datoteka obstaja (multer je končal z zapisovanjem)
  if (!fs.existsSync(photoPath)) {
    console.error('Uploaded file does not exist:', photoPath);
    return res.status(500).json({ 
      success: false,
      error: 'File upload failed. Please try again.'
    });
  }

  // Preveri, ali model obstaja
  const modelPath = path.join(__dirname, '../learned_model', username, 'face_recognition_model.keras');
  if (!fs.existsSync(modelPath)) {
    // Delete the uploaded photo
    fs.unlink(photoPath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting the photo:', unlinkErr);
      }
    });
    
    return res.status(404).json({ 
      success: false,
      error: 'Face recognition model not found. Please set up Face ID first.',
      model_not_found: true
    });
  }

  // Počakaj, da multer konča z zapisovanjem datoteke
  // Preveri, ali datoteka obstaja (z retry mehanizmom)
  const checkFileExists = (filePath, retries = 5, delay = 200) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if (fs.existsSync(filePath)) {
          resolve(true);
        } else if (attempts >= retries) {
          reject(new Error(`File ${filePath} does not exist after ${retries} attempts`));
        } else {
          setTimeout(check, delay);
        }
      };
      check();
    });
  };

  // Preveri, ali datoteka obstaja, preden pokličemo Python skripto
  checkFileExists(photoPath)
    .then(() => {
      console.log('File confirmed to exist:', photoPath);
      
      // Add more Python processing as needed
      const recognizeScriptPath = path.join(__dirname, '../recognize.py');
      const recognizeOptions = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(recognizeScriptPath),
        args: [username]
      };

      return PythonShell.run('recognize.py', recognizeOptions);
    })
    .then(results => {
   
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
      
      // Delete the uploaded photo on error
      fs.unlink(photoPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting the photo:', unlinkErr);
        }
      });
      
      res.status(500).json({ error: 'Error parsing result.' });
    }
    })
    .catch(error => {
      console.error('Error processing photo:', error);
      
      // Delete the uploaded photo on error
      if (fs.existsSync(photoPath)) {
        fs.unlink(photoPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting the photo:', unlinkErr);
          }
        });
      }
      
      res.status(500).json({ 
        error: 'Error running face recognition.',
        details: error.message || 'Unknown error'
      });
    });
};

module.exports = { upload, processVideo, processPhoto };
