const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const recognizeFace = (req, res) => {
  console.log('recognizeFace called');
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const imagePath = req.file.path;
  console.log('Image path:', imagePath);

  const scriptPath = path.join(__dirname, '../recognize.py');
  console.log('Script path:', scriptPath);

  const options = {
    mode: 'text',
    pythonOptions: ['-u'], // Unbuffered output
    scriptPath: path.dirname(scriptPath),
    args: [imagePath]
  };

  console.log('Running Python script...');
  PythonShell.run('recognize.py', options, (err, results) => {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: 'Error running Python script.' });
    }

    console.log('Python script finished');
    try {
      console.log('Results from Python script:', results);
      const result = JSON.parse(results[0]);
      res.json(result);
    } catch (parseError) {
      console.error('Error parsing result:', parseError);
      res.status(500).json({ error: 'Error parsing result.' });
    }
  });
};

module.exports = { upload, recognizeFace };
