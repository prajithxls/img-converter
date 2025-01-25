const express=require('express');
const multer=require('multer');
const imageSize=require('image-size');
const sharp=require('sharp');
const bodyParser=require('body-parser');
const fs=require('fs');
const path=require('path');

var width,format,outputFilePath,height;

const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var storage = multer.diskStorage({
    destination: function(req,file, cb) {
        cb(null,"public/uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = function (req, file, cb) {
    if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg, and .jpeg format allowed!"));
    }
};

var upload=multer({storage:storage,fileFilter:imageFilter });
var dir= "public";
var subDirectory="public/uploads";

if(!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
if(!fs.existsSync(subDirectory)) {
    fs.mkdirSync(subDirectory);
}
const PORT=process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post('/processimage', upload.single('file'), (req, res) => {
    format=req.body.format;
    width=parseInt(req.body.width);
    height=parseInt(req.body.height);

    if (req.file) {
        console.log(req.file.path);

        if (isNaN(width) || isNaN(height)) {
            var dimensions = imageSize(req.file.path);
            console.log(dimensions);
            width=parseInt(dimensions.width);
            height=parseInt(dimensions.height);
            processImage(width, height, req, res);
        } else {
            processImage(width, height, req, res);
        }
    }
});

app.listen(PORT, () => {
    console.log(`APP is listening to the port ${PORT}`);
});

function processImage(width, height, req, res) {
    outputFilePath = "public/uploads/" + Date.now() + "output." + format;
    if (req.file) {
        sharp(req.file.path)
            .resize(width, height)
            .toFile(outputFilePath, (err, info) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error processing the image.");
                }
                const fsPromises = require('fs').promises;

                res.download(outputFilePath, async (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error downloading the file.");
                    }
                
                    try {
                        
                        await fsPromises.unlink(req.file.path);
                        await fsPromises.unlink(outputFilePath); 
                    } catch (error) {
                        console.error('Error deleting files:', error);
                    }
                });
                
            });
    }
}
